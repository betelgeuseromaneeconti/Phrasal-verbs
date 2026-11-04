import React from 'react';
import {
  CheckCircle2,
  Clock,
  Bookmark,
  RotateCcw,
  Download,
  Volume2,
} from 'lucide-react';
import {
  FocusSection,
  MasteryLevel,
  PhrasalVerb,
  UserProgress,
} from '../types/phrasal';
import { calculateProgressStats } from '../utils/parser';

interface ProgressViewProps {
  allVerbs: PhrasalVerb[];
  focusSections: FocusSection[];
  progress: UserProgress;
  onSelectVerb: (verb: PhrasalVerb) => void;
  onResetProgress: () => void;
  speak: (text: string, id: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  allVerbs,
  focusSections,
  progress,
  onSelectVerb,
  onResetProgress,
  speak,
}) => {
  const stats = calculateProgressStats(
    allVerbs,
    progress.mastery,
    progress.bookmarks
  );

  const bookmarkedVerbs = allVerbs.filter((v) =>
    progress.bookmarks.includes(v.id)
  );

  const verbsWithNotes = allVerbs.filter(
    (v) => (progress.notes[v.id] ?? '').trim().length > 0
  );

  const handleExportProgress = () => {
    const dataStr = JSON.stringify(progress, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phrasal-verbs-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="progress-heading" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-mono text-sky-700 dark:text-sky-400">
            Offline-First Learning Analytics
          </p>
          <h1
            id="progress-heading"
            className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight"
          >
            My Learning Progress
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Your mastery levels, bookmarks, personal notes, and quiz scores are automatically saved on your device for offline study.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportProgress}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={onResetProgress}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-red-600 dark:text-red-400 hover:border-red-500 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Mastered Verbs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.masteredCount}{' '}
            <span className="text-sm font-normal text-slate-400">
              / {stats.totalVerbs}
            </span>
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
            {stats.masteryPercentage}% of compendium mastered
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Currently Learning</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.learningCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {stats.newCount} remaining to start
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Saved Bookmarks</span>
            <Bookmark className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.bookmarkedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {verbsWithNotes.length} verbs with personal notes
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Corpus</span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.totalMeanings}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Meanings · {stats.totalExamples} examples
          </p>
        </div>
      </div>

      {/* Bookmarked Verbs & Personal Notes Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookmarked Verbs */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Bookmarked Phrasal Verbs ({bookmarkedVerbs.length})
          </h2>
          {bookmarkedVerbs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              You have not bookmarked any phrasal verbs yet. Click the bookmark icon on any verb card to save it here for quick review.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {bookmarkedVerbs.map((v) => (
                <div
                  key={v.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectVerb(v)}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 font-mono cursor-pointer"
                    >
                      {v.verb}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      Focus {v.focusNumber} · {v.meanings[0]?.explanation}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Pronounce ${v.verb}`}
                    onClick={() => speak(v.verb, `prog-bm-${v.id}`)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal Notes & Recent Quizzes */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Personal Study Notes ({verbsWithNotes.length})
            </h2>
            {verbsWithNotes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Open any phrasal verb card to write your own example sentences or memory notes.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {verbsWithNotes.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectVerb(v)}
                      className="text-xs font-bold font-mono text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {v.verb} (Focus {v.focusNumber})
                    </button>
                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                      {progress.notes[v.id]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Quiz Sessions ({progress.quizHistory.length})
            </h3>
            {progress.quizHistory.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Complete a practice quiz to track your score history here.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {progress.quizHistory.slice(0, 5).map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums"
                  >
                    <span>
                      {q.focusFilter} · {q.date}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {q.score}/{q.total} (
                      {Math.round((q.score / Math.max(1, q.total)) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 50-Focus Mastery Matrix */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
          50-Focus Mastery Matrix
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Completion progress across all 50 Focus units in the Compendium.
        </p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {focusSections.map((sec) => {
            const mastered = sec.verbs.filter(
              (v) => progress.mastery[v.id] === 'mastered'
            ).length;
            const total = sec.verbs.length;
            const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

            return (
              <div
                key={sec.focusNumber}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center"
              >
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  F{sec.focusNumber}
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {mastered}/{total}
                </div>
                <div className="mt-1.5 h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-emerald-600 dark:bg-emerald-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
