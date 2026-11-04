import React, { useState, useEffect } from 'react';
import {
  Volume2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Check,
  Shuffle,
} from 'lucide-react';
import { FocusSection, MasteryLevel, PhrasalVerb } from '../types/phrasal';

interface FlashcardViewProps {
  allVerbs: PhrasalVerb[];
  focusSections: FocusSection[];
  selectedFocus: number | 'all';
  onChangeFocus: (focus: number | 'all') => void;
  masteryMap: Record<string, MasteryLevel>;
  onChangeMastery: (verbId: string, level: MasteryLevel) => void;
  bookmarks: string[];
  onToggleBookmark: (verbId: string) => void;
  speak: (text: string, id: string, rate?: number) => void;
  speakingId: string | null;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  allVerbs,
  focusSections,
  selectedFocus,
  onChangeFocus,
  masteryMap,
  onChangeMastery,
  bookmarks,
  onToggleBookmark,
  speak,
  speakingId,
}) => {
  const [deckFilter, setDeckFilter] = useState<'all' | 'new' | 'learning' | 'mastered' | 'bookmarked'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledOffset, setShuffledOffset] = useState(0);

  const baseDeck = allVerbs.filter((v) => {
    if (selectedFocus !== 'all' && v.focusNumber !== selectedFocus) return false;
    if (deckFilter === 'bookmarked') return bookmarks.includes(v.id);
    if (deckFilter !== 'all') {
      const status = masteryMap[v.id] ?? 'new';
      return status === deckFilter;
    }
    return true;
  });

  const deck =
    shuffledOffset === 0
      ? baseDeck
      : baseDeck.map((_, idx) => baseDeck[(idx * 7 + shuffledOffset) % baseDeck.length]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedFocus, deckFilter, shuffledOffset]);

  const currentCard = deck[currentIndex] ?? null;

  const handleNext = () => {
    if (deck.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deck.length);
  };

  const handlePrev = () => {
    if (deck.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
  };

  const handleGradeAndNext = (level: MasteryLevel) => {
    if (!currentCard) return;
    onChangeMastery(currentCard.id, level);
    handleNext();
  };

  return (
    <section aria-labelledby="flashcards-heading" className="max-w-4xl mx-auto space-y-6">
      {/* Header & Deck Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="max-w-xl">
          <p className="text-xs font-mono text-sky-700 dark:text-sky-400">
            Active Recall Studio
          </p>
          <h1
            id="flashcards-heading"
            className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight"
          >
            Phrasal Verb Flashcards
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Test your recall of meanings and example sentences, listen to native pronunciation, and rate your mastery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span className="whitespace-nowrap">Focus Unit:</span>
            <select
              aria-label="Select Focus Unit for Flashcards"
              value={selectedFocus}
              onChange={(e) =>
                onChangeFocus(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="min-h-[40px] w-[220px] sm:w-[250px] truncate rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="all">All 50 Focus Units ({allVerbs.length} verbs)</option>
              {focusSections.map((sec) => (
                <option key={sec.focusNumber} value={sec.focusNumber}>
                  Focus {sec.focusNumber}: {sec.title}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setShuffledOffset((prev) => prev + 3)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500 flex items-center gap-1.5 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle Deck</span>
          </button>
        </div>
      </div>

      {/* Mastery Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Filter flashcard deck by mastery status"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl"
        >
          {(
            [
              { id: 'all', label: 'All Cards' },
              { id: 'new', label: 'To Learn' },
              { id: 'learning', label: 'Learning' },
              { id: 'mastered', label: 'Mastered' },
              { id: 'bookmarked', label: 'Bookmarked' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDeckFilter(tab.id)}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                deckFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
          {deck.length > 0
            ? `Card ${currentIndex + 1} of ${deck.length}`
            : '0 cards matching filter'}
        </div>
      </div>

      {!currentCard ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No flashcards match your current filter.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try switching the mastery filter back to "All Cards" or selecting another Focus section.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeckFilter('all');
              onChangeFocus('all');
            }}
            className="mt-4 min-h-[42px] px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 cursor-pointer"
          >
            Reset Deck Filters
          </button>
        </div>
      ) : (
        <>
          {/* Flashcard Surface */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 min-h-[360px] flex flex-col justify-between">
            {/* Top Bar inside card */}
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>Focus {currentCard.focusNumber}</span>
                <span aria-hidden="true"> · </span>
                <span>{currentCard.focusTitle}</span>
                <span aria-hidden="true"> · </span>
                <span>
                  {currentCard.meanings.length}{' '}
                  {currentCard.meanings.length === 1 ? 'meaning' : 'meanings'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Pronounce ${currentCard.verb}`}
                  onClick={() => speak(currentCard.verb, `fc-${currentCard.id}`)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    speakingId === `fc-${currentCard.id}`
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Listen</span>
                </button>

                <button
                  type="button"
                  aria-label={
                    bookmarks.includes(currentCard.id)
                      ? `Remove ${currentCard.verb} from bookmarks`
                      : `Bookmark ${currentCard.verb}`
                  }
                  onClick={() => onToggleBookmark(currentCard.id)}
                  className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    bookmarks.includes(currentCard.id)
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarks.includes(currentCard.id) ? 'fill-current' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Center Content: Front vs Back */}
            {!isFlipped ? (
              <div className="my-10 text-center space-y-4">
                <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
                  {currentCard.verb}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Recall {currentCard.meanings.length === 1 ? 'its meaning' : `all ${currentCard.meanings.length} meanings`} and how it is used in context, then flip the card to verify.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-sky-600 text-white text-sm font-semibold hover:bg-slate-800 dark:hover:bg-sky-500 inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Reveal Meanings & Examples</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                    {currentCard.verb}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Show Front</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
                  {currentCard.meanings.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-sky-700 dark:text-sky-400 font-semibold">
                        <span>
                          MEANING {m.meaningNumber}
                          {m.usageNote ? ` · ${m.usageNote}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => speak(m.explanation, `fc-m-${m.id}`)}
                          className="text-slate-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Speak</span>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                        {m.explanation}
                      </p>
                      <div className="space-y-1 pt-1 text-xs text-slate-600 dark:text-slate-300">
                        {m.examples.map((ex, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-2">
                            <span>
                              <strong className="font-mono text-slate-400">Ex {idx + 1}:</strong>{' '}
                              {ex}
                            </span>
                            <button
                              type="button"
                              aria-label={`Pronounce example ${idx + 1}`}
                              onClick={() => speak(ex, `fc-ex-${m.id}-${idx}`)}
                              className="text-slate-400 hover:text-sky-600 shrink-0 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Navigation & Self-Grading */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
                  Mark card as:
                </span>
                <button
                  type="button"
                  onClick={() => handleGradeAndNext('new')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    (masteryMap[currentCard.id] ?? 'new') === 'new'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Still New
                </button>
                <button
                  type="button"
                  onClick={() => handleGradeAndNext('learning')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    masteryMap[currentCard.id] === 'learning'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  Learning
                </button>
                <button
                  type="button"
                  onClick={() => handleGradeAndNext('mastered')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                    masteryMap[currentCard.id] === 'mastered'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mastered</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
