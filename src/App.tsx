/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Volume2,
  Bookmark,
  Check,
  SlidersHorizontal,
  Sun,
  Moon,
  Sparkles,
  WifiOff,
  X,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import {
  parseCompendiumData,
  filterPhrasalVerbs,
  calculateProgressStats,
} from './utils/parser';
import { MasteryLevel, PhrasalVerb, UserProgress } from './types/phrasal';
import { useSpeech } from './hooks/useSpeech';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Header, ActiveTab } from './components/Header';
import { VerbDetailModal } from './components/VerbDetailModal';
import { FocusCurriculumView } from './components/FocusCurriculumView';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { ProgressView } from './components/ProgressView';

const STORAGE_KEY = 'pvc_user_progress_v1';
const THEME_KEY = 'pvc_theme_v1';

const DEFAULT_PROGRESS: UserProgress = {
  mastery: {},
  bookmarks: [],
  notes: {},
  quizHistory: [],
};

export default function App() {
  const { focusSections, allVerbs, particles } = useMemo(
    () => parseCompendiumData(),
    []
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(THEME_KEY) === 'dark';
  });

  const [progress, setProgress] = useState<UserProgress>(() => {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          mastery: parsed.mastery ?? {},
          bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
          notes: parsed.notes ?? {},
          quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : [],
        };
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_PROGRESS;
  });

  // Explorer filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<number | 'all'>('all');
  const [selectedParticle, setSelectedParticle] = useState<string | 'all'>('all');
  const [selectedWordCount, setSelectedWordCount] = useState<number | 'all'>('all');
  const [masteryFilter, setMasteryFilter] = useState<
    MasteryLevel | 'all' | 'bookmarked'
  >('all');
  const [expandAllMeanings, setExpandAllMeanings] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Active modal verb
  const [selectedVerb, setSelectedVerb] = useState<PhrasalVerb | null>(null);

  const { speak, speakingId, rate, setRate, accent, setAccent } = useSpeech();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [
    searchQuery,
    selectedFocus,
    selectedParticle,
    selectedWordCount,
    masteryFilter,
  ]);

  const filteredVerbs = useMemo(
    () =>
      filterPhrasalVerbs(allVerbs, {
        searchQuery,
        focusNumber: selectedFocus,
        particle: selectedParticle,
        wordCount: selectedWordCount,
        masteryFilter,
        masteryMap: progress.mastery,
        bookmarks: progress.bookmarks,
      }),
    [
      allVerbs,
      searchQuery,
      selectedFocus,
      selectedParticle,
      selectedWordCount,
      masteryFilter,
      progress.mastery,
      progress.bookmarks,
    ]
  );

  const stats = useMemo(
    () =>
      calculateProgressStats(allVerbs, progress.mastery, progress.bookmarks),
    [allVerbs, progress.mastery, progress.bookmarks]
  );

  const handleChangeMastery = (verbId: string, level: MasteryLevel) => {
    setProgress((prev) => ({
      ...prev,
      mastery: {
        ...prev.mastery,
        [verbId]: level,
      },
    }));
  };

  const handleCycleMastery = (verbId: string) => {
    const current = progress.mastery[verbId] ?? 'new';
    const next: MasteryLevel =
      current === 'new'
        ? 'learning'
        : current === 'learning'
        ? 'mastered'
        : 'new';
    handleChangeMastery(verbId, next);
  };

  const handleToggleBookmark = (verbId: string) => {
    setProgress((prev) => {
      const exists = prev.bookmarks.includes(verbId);
      return {
        ...prev,
        bookmarks: exists
          ? prev.bookmarks.filter((id) => id !== verbId)
          : [...prev.bookmarks, verbId],
      };
    });
  };

  const handleChangeNote = (verbId: string, text: string) => {
    setProgress((prev) => ({
      ...prev,
      notes: {
        ...prev.notes,
        [verbId]: text,
      },
    }));
  };

  const handleRecordQuizResult = (
    score: number,
    total: number,
    focusFilter: string
  ) => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    setProgress((prev) => ({
      ...prev,
      quizHistory: [
        { date: today, score, total, focusFilter },
        ...prev.quizHistory,
      ].slice(0, 25),
    }));
  };

  const handleResetProgress = () => {
    setProgress(DEFAULT_PROGRESS);
  };

  const currentFocusObj = useMemo(
    () =>
      selectedFocus === 'all'
        ? null
        : focusSections.find((f) => f.focusNumber === selectedFocus) ?? null,
    [focusSections, selectedFocus]
  );

  const relatedVerbsForModal = useMemo(() => {
    if (!selectedVerb) return [];
    return allVerbs.filter(
      (v) =>
        v.id !== selectedVerb.id &&
        (v.baseVerb === selectedVerb.baseVerb ||
          v.focusNumber === selectedVerb.focusNumber)
    );
  }, [allVerbs, selectedVerb]);

  const topParticles = [
    'UP',
    'OUT',
    'OFF',
    'DOWN',
    'IN',
    'ON',
    'OVER',
    'BACK',
    'AWAY',
    'AROUND',
    'THROUGH',
    'INTO',
  ];

  return (
    <div id="top" className="min-h-screen flex flex-col pb-20 md:pb-12">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Workspace Audio & Theme Utility Strip */}
      <div className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
            <span>50 Focus Sections</span>
            <span aria-hidden="true">·</span>
            <span>{stats.totalVerbs} Phrasal Verbs</span>
            <span aria-hidden="true">·</span>
            <span>{stats.totalMeanings} Meanings</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {stats.masteredCount} Mastered ({stats.masteryPercentage}%)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Voice Accent Selector */}
            <div
              role="group"
              aria-label="Pronunciation Accent"
              className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5"
            >
              <button
                type="button"
                onClick={() => setAccent('en-US')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  accent === 'en-US'
                    ? 'bg-slate-900 text-white dark:bg-sky-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                US Audio
              </button>
              <button
                type="button"
                onClick={() => setAccent('en-GB')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  accent === 'en-GB'
                    ? 'bg-slate-900 text-white dark:bg-sky-600'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                UK Audio
              </button>
            </div>

            {/* Speech Speed Toggle */}
            <button
              type="button"
              onClick={() => setRate(rate === 1.0 ? 0.8 : 1.0)}
              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500 cursor-pointer"
            >
              Speed: {rate === 1.0 ? '1.0x Normal' : '0.8x Learner'}
            </button>

            {/* Dark/Light Theme Toggle */}
            <button
              type="button"
              aria-label={
                darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'
              }
              onClick={() => setDarkMode((prev) => !prev)}
              className="min-h-[32px] min-w-[32px] p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500 flex items-center justify-center cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {activeTab === 'explorer' && (
          <div className="space-y-8">
            {/* Hero & Search Command Section */}
            <section
              aria-labelledby="hero-heading"
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-sky-700 dark:text-sky-400">
                    <span>COMPLETE REFERENCE & STUDY SYSTEM</span>
                    <span aria-hidden="true">·</span>
                    <span>FOCUS 1–50</span>
                  </div>
                  <h1
                    id="hero-heading"
                    className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white font-display tracking-tight text-balance"
                  >
                    Master English Phrasal Verbs Across 50 Structured Focus Units
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    Search {stats.totalVerbs} phrasal verbs, {stats.totalMeanings} clear definitions, and {stats.totalExamples} real-world example sentences. Listen to instant pronunciation, practice with active-recall flashcards, and track your progress offline.
                  </p>
                </div>

                {/* Quick Study Action Card */}
                <div className="lg:col-span-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>YOUR MASTERY</span>
                    <span>
                      {stats.masteredCount} / {stats.totalVerbs} verbs
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${stats.masteryPercentage}%` }}
                      className="bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                    />
                    <div
                      style={{
                        width: `${Math.round(
                          (stats.learningCount / Math.max(1, stats.totalVerbs)) *
                            100
                        )}%`,
                      }}
                      className="bg-amber-500 transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                    <span>{stats.learningCount} Learning</span>
                    <span>{stats.bookmarkedCount} Bookmarked</span>
                  </div>
                  <div className="pt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('flashcards')}
                      className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-sky-500 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Flashcards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('quiz')}
                      className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-sky-500 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Take Quiz</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Bar & Primary Filters */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Search input */}
                  <div className="md:col-span-6 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      aria-label="Search phrasal verbs, meanings, or examples"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search verb (e.g. put on, break down), meaning, or example..."
                      className="w-full min-h-[44px] pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:bg-white dark:focus:bg-slate-900"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        aria-label="Clear search query"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Focus Dropdown */}
                  <div className="md:col-span-4">
                    <select
                      aria-label="Filter by Focus Section (1 to 50)"
                      value={selectedFocus}
                      onChange={(e) =>
                        setSelectedFocus(
                          e.target.value === 'all'
                            ? 'all'
                            : Number(e.target.value)
                        )
                      }
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="all">
                        All 50 Focus Sections ({allVerbs.length} verbs)
                      </option>
                      {focusSections.map((sec) => (
                        <option key={sec.focusNumber} value={sec.focusNumber}>
                          Focus {sec.focusNumber}: {sec.title} ({sec.verbs.length})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Particle Dropdown */}
                  <div className="md:col-span-2">
                    <select
                      aria-label="Filter by Particle"
                      value={selectedParticle}
                      onChange={(e) => setSelectedParticle(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="all">All Particles</option>
                      {particles.map((p) => (
                        <option key={p} value={p}>
                          Particle: {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Particle Buttons & Mastery Status Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {/* Mastery Segmented Buttons */}
                  <div
                    role="group"
                    aria-label="Filter by learning status"
                    className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
                  >
                    {(
                      [
                        { id: 'all', label: 'All Verbs' },
                        { id: 'new', label: 'To Learn' },
                        { id: 'learning', label: 'Learning' },
                        { id: 'mastered', label: 'Mastered' },
                        { id: 'bookmarked', label: 'Bookmarked' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMasteryFilter(item.id)}
                        className={`min-h-[34px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                          masteryFilter === item.id
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Word Count & Expand All Toggle */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      role="group"
                      aria-label="Filter by word count"
                      className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
                    >
                      {(
                        [
                          { id: 'all', label: 'All Lengths' },
                          { id: 2, label: '2-Word' },
                          { id: 3, label: '3-Word' },
                        ] as const
                      ).map((wc) => (
                        <button
                          key={String(wc.id)}
                          type="button"
                          onClick={() => setSelectedWordCount(wc.id)}
                          className={`min-h-[34px] px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                            selectedWordCount === wc.id
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {wc.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandAllMeanings((prev) => !prev)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 flex items-center gap-1.5 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>
                        {expandAllMeanings
                          ? 'Show Compact View'
                          : 'Expand All Meanings'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Common Particle Quick Filter Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 mr-1 shrink-0">
                    Particles:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedParticle('all')}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-mono font-semibold shrink-0 transition-colors cursor-pointer ${
                      selectedParticle === 'all'
                        ? 'bg-sky-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    ALL
                  </button>
                  {topParticles.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() =>
                        setSelectedParticle(selectedParticle === pt ? 'all' : pt)
                      }
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-mono font-semibold shrink-0 transition-colors cursor-pointer ${
                        selectedParticle === pt
                          ? 'bg-sky-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Active Focus Banner when a single Focus is selected */}
            {currentFocusObj && (
              <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
                    FOCUS {currentFocusObj.focusNumber} OF 50
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white font-display capitalize">
                    {currentFocusObj.title}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('flashcards')}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 cursor-pointer"
                  >
                    Study Focus {currentFocusObj.focusNumber} Flashcards
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quiz')}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 text-xs font-semibold text-sky-800 dark:text-sky-300 hover:border-sky-500 cursor-pointer"
                  >
                    Quiz Focus {currentFocusObj.focusNumber}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFocus('all')}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                  >
                    Show All 50 Focuses
                  </button>
                </div>
              </div>
            )}

            {/* Results Count & Reset Filter Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>
                Showing {Math.min(visibleCount, filteredVerbs.length)} of{' '}
                {filteredVerbs.length} matching phrasal verbs
              </span>
              {(searchQuery ||
                selectedFocus !== 'all' ||
                selectedParticle !== 'all' ||
                selectedWordCount !== 'all' ||
                masteryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFocus('all');
                    setSelectedParticle('all');
                    setSelectedWordCount('all');
                    setMasteryFilter('all');
                  }}
                  className="text-sky-700 dark:text-sky-400 font-sans font-semibold hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Phrasal Verb Cards Grid */}
            {filteredVerbs.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No phrasal verbs found matching your criteria.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try searching for another verb, particle, or meaning, or reset your active filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFocus('all');
                    setSelectedParticle('all');
                    setSelectedWordCount('all');
                    setMasteryFilter('all');
                  }}
                  className="mt-2 min-h-[42px] px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredVerbs.slice(0, visibleCount).map((item) => {
                  const status = progress.mastery[item.id] ?? 'new';
                  const isBookmarked = progress.bookmarks.includes(item.id);
                  const meaningsToShow = expandAllMeanings
                    ? item.meanings
                    : item.meanings.slice(0, 1);

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div>
                        {/* Unboxed Metadata Kicker (Zero-Pill Discipline) */}
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedFocus(item.focusNumber)}
                              className="hover:text-sky-700 dark:hover:text-sky-400 hover:underline cursor-pointer"
                            >
                              Focus {item.focusNumber}
                            </button>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[210px] sm:max-w-[260px]">
                              {item.focusTitle}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {item.meanings.length}{' '}
                              {item.meanings.length === 1
                                ? 'meaning'
                                : 'meanings'}
                            </span>
                          </div>
                        </div>

                        {/* Verb Title + Audio + Bookmark + Mastery Toggle */}
                        <div className="mt-2 flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
                              <button
                                type="button"
                                onClick={() => setSelectedVerb(item)}
                                className="hover:text-sky-700 dark:hover:text-sky-400 text-left cursor-pointer"
                              >
                                {item.verb}
                              </button>
                            </h2>
                            <button
                              type="button"
                              aria-label={`Pronounce ${item.verb}`}
                              onClick={() => speak(item.verb, `card-${item.id}`)}
                              className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                                speakingId === `card-${item.id}`
                                  ? 'bg-sky-700 text-white border-sky-700'
                                  : 'border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-400 hover:border-sky-500'
                              }`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              aria-label={`Change mastery status for ${item.verb} (currently ${status})`}
                              onClick={() => handleCycleMastery(item.id)}
                              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                                status === 'mastered'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                                  : status === 'learning'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                              }`}
                            >
                              {status === 'mastered' && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {status === 'mastered'
                                  ? 'Mastered'
                                  : status === 'learning'
                                  ? 'Learning'
                                  : 'Mark Learned'}
                              </span>
                            </button>

                            <button
                              type="button"
                              aria-label={
                                isBookmarked
                                  ? `Remove ${item.verb} from bookmarks`
                                  : `Bookmark ${item.verb}`
                              }
                              onClick={() => handleToggleBookmark(item.id)}
                              className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                                isBookmarked
                                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                            >
                              <Bookmark
                                className={`w-4 h-4 ${
                                  isBookmarked ? 'fill-current' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Meanings List */}
                        <div className="mt-4 space-y-4">
                          {meaningsToShow.map((m) => (
                            <div
                              key={m.id}
                              className="pb-4 border-b border-slate-100 dark:border-slate-800/70 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-center gap-2 text-xs font-mono text-sky-700 dark:text-sky-400 font-semibold">
                                <span>MEANING {m.meaningNumber}</span>
                                {m.usageNote && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-sans italic text-amber-700 dark:text-amber-400 font-normal">
                                      {m.usageNote}
                                    </span>
                                  </>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                {m.explanation}
                              </p>
                              <div className="mt-2 space-y-1.5 pl-3 border-l border-slate-200 dark:border-slate-700">
                                {m.examples.map((ex, exIdx) => {
                                  const exSpeakId = `${m.id}-card-ex-${exIdx}`;
                                  return (
                                    <div
                                      key={exSpeakId}
                                      className="flex items-start justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                                    >
                                      <p>
                                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mr-1.5">
                                          Ex {exIdx + 1}:
                                        </span>
                                        {ex}
                                      </p>
                                      <button
                                        type="button"
                                        aria-label={`Listen to example: ${ex}`}
                                        onClick={() => speak(ex, exSpeakId)}
                                        className={`shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                                          speakingId === exSpeakId
                                            ? 'text-sky-600 dark:text-sky-400'
                                            : 'text-slate-400 hover:text-sky-600'
                                        }`}
                                      >
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          Base: {item.baseVerb} · Particle: {item.particle}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedVerb(item)}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg text-sky-700 dark:text-sky-400 font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>
                            {!expandAllMeanings && item.meanings.length > 1
                              ? `View All ${item.meanings.length} Meanings & Notes`
                              : 'Full Details & Notes'}
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Load More Pagination */}
            {visibleCount < filteredVerbs.length && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-sky-500 transition-colors cursor-pointer"
                >
                  Load More Phrasal Verbs ({filteredVerbs.length - visibleCount}{' '}
                  remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'focuses' && (
          <FocusCurriculumView
            focusSections={focusSections}
            masteryMap={progress.mastery}
            onSelectFocusForExplorer={(focusNum) => {
              setSelectedFocus(focusNum);
              setActiveTab('explorer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectFocusForFlashcards={(focusNum) => {
              setSelectedFocus(focusNum);
              setActiveTab('flashcards');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectFocusForQuiz={(focusNum) => {
              setSelectedFocus(focusNum);
              setActiveTab('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectVerb={(verb) => setSelectedVerb(verb)}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardView
            allVerbs={allVerbs}
            focusSections={focusSections}
            selectedFocus={selectedFocus}
            onChangeFocus={setSelectedFocus}
            masteryMap={progress.mastery}
            onChangeMastery={handleChangeMastery}
            bookmarks={progress.bookmarks}
            onToggleBookmark={handleToggleBookmark}
            speak={speak}
            speakingId={speakingId}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            allVerbs={allVerbs}
            focusSections={focusSections}
            selectedFocus={selectedFocus}
            onChangeFocus={setSelectedFocus}
            onChangeMastery={handleChangeMastery}
            onRecordQuizResult={handleRecordQuizResult}
            speak={speak}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            allVerbs={allVerbs}
            focusSections={focusSections}
            progress={progress}
            onSelectVerb={(verb) => setSelectedVerb(verb)}
            onResetProgress={handleResetProgress}
            speak={speak}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          Phrasal Verbs Compendium — Complete 50 Focus Sections Reference & Interactive Study Studio.
        </p>
        <p className="font-mono">Offline-Ready Progressive Web App</p>
      </footer>

      {/* Verb Detail Modal */}
      <VerbDetailModal
        verb={selectedVerb}
        onClose={() => setSelectedVerb(null)}
        mastery={selectedVerb ? progress.mastery[selectedVerb.id] ?? 'new' : 'new'}
        onChangeMastery={handleChangeMastery}
        isBookmarked={
          selectedVerb ? progress.bookmarks.includes(selectedVerb.id) : false
        }
        onToggleBookmark={handleToggleBookmark}
        note={selectedVerb ? progress.notes[selectedVerb.id] ?? '' : ''}
        onChangeNote={handleChangeNote}
        speak={speak}
        speakingId={speakingId}
        relatedVerbs={relatedVerbsForModal}
        onSelectVerb={(v) => setSelectedVerb(v)}
      />

      {/* Offline Mode Toast */}
      {!isOnline && (
        <div
          role="status"
          className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode — All 50 Focus sections available from local cache.</span>
        </div>
      )}
    </div>
  );
}
