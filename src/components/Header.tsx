import React, { useState } from 'react';
import { BookOpen, Layers, Sparkles, CheckSquare, BarChart2, Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type ActiveTab = 'explorer' | 'focuses' | 'flashcards' | 'quiz' | 'progress';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'explorer', label: 'Compendium', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'focuses', label: '50 Focus Units', icon: <Layers className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'quiz', label: 'Practice Quiz', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'progress', label: 'My Progress', icon: <BarChart2 className="w-5 h-5" /> },
  ];

  const handleInstallAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-8 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('explorer');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 font-display"
        >
          Phrasal Verbs Compendium
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'border-sky-600 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {!isInstalled ? (
            <button
              type="button"
              onClick={handleInstallAction}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectTab('quiz')}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start Practice Quiz
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Thumb-zone navigation for phones, hidden on md+) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-14 px-1"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'text-sky-700 dark:text-sky-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap truncate max-w-[68px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* PWA Install Instructions Modal for iOS / Browsers without direct prompt */}
      {showInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="pwa-install-title"
                className="text-lg font-bold text-slate-900 dark:text-white font-display"
              >
                Install Phrasal Verbs Compendium
              </h2>
              <button
                type="button"
                aria-label="Close install instructions"
                onClick={() => setShowInstallModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Install this application on your phone, tablet, or computer for instant offline access to all 50 Focus sections and 400 phrasal verbs.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <strong className="text-slate-900 dark:text-white">iPhone / iPad (Safari):</strong>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  1. Tap the <strong>Share</strong> button in the Safari toolbar.<br />
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white">Android / Desktop (Chrome, Edge, Brave):</strong>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Click the <strong>Install</strong> icon in the address bar or open the browser menu and select <strong>Install App / Add to Home screen</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-sky-600 text-white text-sm font-semibold hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
