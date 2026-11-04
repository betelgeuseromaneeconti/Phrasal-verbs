import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  RotateCcw,
  Award,
} from 'lucide-react';
import { FocusSection, MasteryLevel, PhrasalVerb } from '../types/phrasal';
import { generateQuizQuestions } from '../utils/parser';

interface QuizViewProps {
  allVerbs: PhrasalVerb[];
  focusSections: FocusSection[];
  selectedFocus: number | 'all';
  onChangeFocus: (focus: number | 'all') => void;
  onChangeMastery: (verbId: string, level: MasteryLevel) => void;
  onRecordQuizResult: (score: number, total: number, focusLabel: string) => void;
  speak: (text: string, id: string, rate?: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  allVerbs,
  focusSections,
  selectedFocus,
  onChangeFocus,
  onChangeMastery,
  onRecordQuizResult,
  speak,
}) => {
  const [seedOffset, setSeedOffset] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const filteredPool = useMemo(() => {
    if (selectedFocus === 'all') return allVerbs;
    return allVerbs.filter((v) => v.focusNumber === selectedFocus);
  }, [allVerbs, selectedFocus]);

  const questions = useMemo(() => {
    const count = selectedFocus === 'all' ? 10 : Math.min(8, filteredPool.length);
    return generateQuizQuestions(filteredPool, count, seedOffset);
  }, [filteredPool, selectedFocus, seedOffset]);

  const currentQuestion = questions[currentIdx] ?? null;

  const handleSelectFocus = (val: number | 'all') => {
    onChangeFocus(val);
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  const handleAnswer = (option: string) => {
    if (selectedOption || !currentQuestion) return;
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      onChangeMastery(currentQuestion.verbId, 'mastered');
    } else {
      onChangeMastery(currentQuestion.verbId, 'learning');
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalScore = score;
      const focusLabel =
        selectedFocus === 'all' ? 'All 50 Focus Units' : `Focus ${selectedFocus}`;
      onRecordQuizResult(finalScore, questions.length, focusLabel);
      setIsFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleRestart = () => {
    setSeedOffset((prev) => prev + 5);
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <section aria-labelledby="quiz-heading" className="max-w-3xl mx-auto space-y-6">
      {/* Header & Unit Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="max-w-xl">
          <p className="text-xs font-mono text-sky-700 dark:text-sky-400">
            Contextual Mastery Check
          </p>
          <h1
            id="quiz-heading"
            className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight"
          >
            Interactive Phrasal Verb Quiz
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Complete real example sentences and match definitions drawn directly from the 50 Focus sections.
          </p>
        </div>

        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 shrink-0">
          <span className="whitespace-nowrap">Quiz Scope:</span>
          <select
            aria-label="Select Focus Unit for Quiz"
            value={selectedFocus}
            onChange={(e) =>
              handleSelectFocus(
                e.target.value === 'all' ? 'all' : Number(e.target.value)
              )
            }
            className="min-h-[40px] w-full sm:w-[240px] truncate rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="all">All 50 Focus Sections (10 Questions)</option>
            {focusSections.map((sec) => (
              <option key={sec.focusNumber} value={sec.focusNumber}>
                Focus {sec.focusNumber}: {sec.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isFinished ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              QUIZ COMPLETED
            </p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              You scored {score} out of {questions.length} (
              {Math.round((score / Math.max(1, questions.length)) * 100)}%)
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Verbs you answered correctly have been marked as <strong>Mastered</strong>, and missed items were added to your <strong>Learning</strong> queue.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start New Quiz Set</span>
            </button>
          </div>
        </div>
      ) : currentQuestion ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          {/* Progress header */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            <span>
              Question {currentIdx + 1} of {questions.length} · Focus{' '}
              {currentQuestion.focusNumber}
            </span>
            <span>Score: {score}</span>
          </div>

          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{
                width: `${Math.round(((currentIdx + 1) / questions.length) * 100)}%`,
              }}
              className="h-full bg-sky-600 transition-all duration-300"
            />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">
              {currentQuestion.type === 'sentence-blank'
                ? 'Choose the phrasal verb that completes this sentence:'
                : 'Which phrasal verb matches this definition?'}
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.prompt}
            </h2>
            {currentQuestion.contextHint && (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentQuestion.contextHint}
              </p>
            )}
          </div>

          {/* 4 Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              let btnStyle =
                'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-900 dark:text-white hover:border-sky-500';

              if (selectedOption) {
                if (isCorrect) {
                  btnStyle =
                    'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle =
                    'border-red-600 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200';
                } else {
                  btnStyle =
                    'border-slate-200 dark:border-slate-800 opacity-50 text-slate-500';
                }
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={!!selectedOption}
                  onClick={() => handleAnswer(option)}
                  className={`min-h-[52px] px-4 py-3 rounded-xl border text-left text-sm font-mono font-semibold flex items-center justify-between transition-colors cursor-pointer ${btnStyle}`}
                >
                  <span>{option}</span>
                  {selectedOption && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {selectedOption && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {selectedOption && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-xs font-bold ${
                    selectedOption === currentQuestion.correctAnswer
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {selectedOption === currentQuestion.correctAnswer
                    ? 'Correct! Marked as Mastered.'
                    : `Not quite — the correct phrasal verb is ${currentQuestion.correctAnswer}.`}
                </p>
                {currentQuestion.fullExample && (
                  <button
                    type="button"
                    onClick={() =>
                      speak(currentQuestion.fullExample, `quiz-ex-${currentQuestion.id}`)
                    }
                    className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Hear Example</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Meaning:</strong> {currentQuestion.explanation}
              </p>
              {currentQuestion.fullExample && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                  <strong>Complete Example:</strong> "{currentQuestion.fullExample}"
                </p>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>
                    {currentIdx + 1 >= questions.length
                      ? 'See Quiz Results'
                      : 'Next Question'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
};
