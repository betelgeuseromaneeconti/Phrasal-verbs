import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckSquare, CheckCircle2, Search } from 'lucide-react';
import { FocusSection, MasteryLevel, PhrasalVerb } from '../types/phrasal';

interface FocusCurriculumViewProps {
  focusSections: FocusSection[];
  masteryMap: Record<string, MasteryLevel>;
  onSelectFocusForExplorer: (focusNumber: number) => void;
  onSelectFocusForFlashcards: (focusNumber: number) => void;
  onSelectFocusForQuiz: (focusNumber: number) => void;
  onSelectVerb: (verb: PhrasalVerb) => void;
}

export const FocusCurriculumView: React.FC<FocusCurriculumViewProps> = ({
  focusSections,
  masteryMap,
  onSelectFocusForExplorer,
  onSelectFocusForFlashcards,
  onSelectFocusForQuiz,
  onSelectVerb,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredSections = focusSections.filter((sec) => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    if (`focus ${sec.focusNumber}`.includes(q)) return true;
    if (sec.title.toLowerCase().includes(q)) return true;
    return sec.verbs.some((v) => v.verb.toLowerCase().includes(q));
  });

  return (
    <section aria-labelledby="curriculum-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-mono text-sky-700 dark:text-sky-400">
            50 Grammatical & Lexical Units
          </p>
          <h1
            id="curriculum-heading"
            className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight"
          >
            50 Focus Curriculum
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Every Focus section groups phrasal verbs by grammatical behavior, particle meaning, or pronunciation pattern. Select any unit to study its verbs, practice flashcards, or take a targeted quiz.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Filter Focus sections by title or verb"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter 50 Focus units..."
            className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSections.map((sec) => {
          const masteredCount = sec.verbs.filter(
            (v) => masteryMap[v.id] === 'mastered'
          ).length;
          const learningCount = sec.verbs.filter(
            (v) => masteryMap[v.id] === 'learning'
          ).length;
          const total = sec.verbs.length;
          const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

          return (
            <article
              key={sec.focusNumber}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  <span>
                    Focus {String(sec.focusNumber).padStart(2, '0')} · {total} verbs
                  </span>
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    {pct === 100 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {masteredCount}/{total} mastered ({pct}%)
                  </span>
                </div>

                <h2 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white font-display capitalize leading-snug">
                  {sec.title}
                </h2>

                {/* Progress Bar */}
                <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${pct}%` }}
                    className="bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                  />
                  {learningCount > 0 && (
                    <div
                      style={{ width: `${Math.round((learningCount / total) * 100)}%` }}
                      className="bg-amber-500 transition-all duration-300"
                    />
                  )}
                </div>

                {/* Verb Links */}
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                  {sec.verbs.map((v) => {
                    const status = masteryMap[v.id] ?? 'new';
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelectVerb(v)}
                        className={`font-mono hover:underline cursor-pointer ${
                          status === 'mastered'
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : status === 'learning'
                            ? 'text-amber-700 dark:text-amber-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400'
                        }`}
                      >
                        {v.verb}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectFocusForExplorer(sec.focusNumber)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Focus {sec.focusNumber}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectFocusForFlashcards(sec.focusNumber)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Flashcards</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectFocusForQuiz(sec.focusNumber)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Quiz</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
