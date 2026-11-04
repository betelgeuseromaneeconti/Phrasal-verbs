import React, { useEffect } from 'react';
import { Volume2, Bookmark, X, Check, ArrowRight } from 'lucide-react';
import { MasteryLevel, PhrasalVerb } from '../types/phrasal';

interface VerbDetailModalProps {
  verb: PhrasalVerb | null;
  onClose: () => void;
  mastery: MasteryLevel;
  onChangeMastery: (verbId: string, level: MasteryLevel) => void;
  isBookmarked: boolean;
  onToggleBookmark: (verbId: string) => void;
  note: string;
  onChangeNote: (verbId: string, text: string) => void;
  speak: (text: string, id: string, customRate?: number) => void;
  speakingId: string | null;
  relatedVerbs: PhrasalVerb[];
  onSelectVerb: (verb: PhrasalVerb) => void;
}

export const VerbDetailModal: React.FC<VerbDetailModalProps> = ({
  verb,
  onClose,
  mastery,
  onChangeMastery,
  isBookmarked,
  onToggleBookmark,
  note,
  onChangeNote,
  speak,
  speakingId,
  relatedVerbs,
  onSelectVerb,
}) => {
  useEffect(() => {
    if (!verb) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [verb, onClose]);

  if (!verb) return null;

  const fullAudioScript = [
    verb.verb,
    ...verb.meanings.map(
      (m) =>
        `Meaning ${m.meaningNumber}: ${m.explanation} Example: ${m.examples.join(' ')}`
    ),
  ].join('. ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verb-detail-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-8">
        {/* Top Metadata & Close */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>Focus {verb.focusNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{verb.focusTitle}</span>
              <span aria-hidden="true">·</span>
              <span>
                {verb.meanings.length}{' '}
                {verb.meanings.length === 1 ? 'meaning' : 'meanings'}
              </span>
            </div>
            <h2
              id="verb-detail-heading"
              className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight"
            >
              {verb.verb}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label={
                isBookmarked
                  ? `Remove ${verb.verb} from bookmarks`
                  : `Bookmark ${verb.verb}`
              }
              onClick={() => onToggleBookmark(verb.id)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`}
              />
            </button>
            <button
              type="button"
              aria-label="Close verb details"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pronunciation & Mastery Controls Bar */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => speak(verb.verb, `${verb.id}-head-normal`, 1.0)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                speakingId === `${verb.id}-head-normal`
                  ? 'bg-sky-700 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-500'
              }`}
            >
              <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Pronounce (1.0x)</span>
            </button>
            <button
              type="button"
              onClick={() => speak(verb.verb, `${verb.id}-head-slow`, 0.75)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                speakingId === `${verb.id}-head-slow`
                  ? 'bg-sky-700 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-500'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Slow Audio (0.75x)</span>
            </button>
            <button
              type="button"
              onClick={() => speak(fullAudioScript, `${verb.id}-full-entry`, 0.95)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                speakingId === `${verb.id}-full-entry`
                  ? 'bg-sky-700 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-500'
              }`}
            >
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Read All Meanings</span>
            </button>
          </div>

          {/* Mastery Segmented Selector */}
          <div
            role="group"
            aria-label={`Mastery status for ${verb.verb}`}
            className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg"
          >
            {(['new', 'learning', 'mastered'] as MasteryLevel[]).map((lvl) => {
              const active = mastery === lvl;
              const labels: Record<MasteryLevel, string> = {
                new: 'To Learn',
                learning: 'Learning',
                mastered: 'Mastered',
              };
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onChangeMastery(verb.id, lvl)}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? lvl === 'mastered'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : lvl === 'learning'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{labels[lvl]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* All Numbered Meanings & Examples */}
        <div className="mt-6 space-y-6">
          {verb.meanings.map((m) => (
            <div
              key={m.id}
              className="pb-6 border-b border-slate-200/70 dark:border-slate-800 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400 font-mono">
                  <span>MEANING {m.meaningNumber}</span>
                  {m.usageNote && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-700 dark:text-amber-400 font-sans italic">
                        {m.usageNote}
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={`Listen to meaning ${m.meaningNumber}`}
                  onClick={() => speak(m.explanation, m.id)}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </button>
              </div>

              <p className="mt-2 text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                {m.explanation}
              </p>

              <div className="mt-3 space-y-2.5 pl-4 border-l border-slate-200 dark:border-slate-700">
                {m.examples.map((ex, idx) => {
                  const exId = `${m.id}-ex-${idx}`;
                  return (
                    <div
                      key={exId}
                      className="flex items-start justify-between gap-3 group"
                    >
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500 mr-2">
                          Ex {idx + 1}:
                        </span>
                        {ex}
                      </p>
                      <button
                        type="button"
                        aria-label={`Pronounce example ${idx + 1}: ${ex}`}
                        onClick={() => speak(ex, exId)}
                        className={`shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                          speakingId === exId
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Personal Study Note */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <label
            htmlFor="personal-verb-note"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Personal Study Note & Own Sentence (Saved Offline)
          </label>
          <textarea
            id="personal-verb-note"
            rows={2}
            value={note}
            onChange={(e) => onChangeNote(verb.id, e.target.value)}
            placeholder={`Write your own example sentence using "${verb.verb.toLowerCase()}"...`}
            className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
        </div>

        {/* Related Phrasal Verbs */}
        {relatedVerbs.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Related Phrasal Verbs (Same Base Verb or Focus)
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedVerbs.slice(0, 6).map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectVerb(rel)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{rel.verb}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
