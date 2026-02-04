import React, { useState, useEffect } from 'react';
import { ChevronDown, Globe, CheckCircle2, Volume2 } from 'lucide-react';

import { Lesson, Language, BlockType, CommandLabBlock } from './types';
import { INITIAL_LESSONS, LANGUAGES, UI_TRANSLATIONS } from './constants';
import CommandLab from './components/CommandLab';

// --- Contexts ---

const AppContext = React.createContext<{
  lang: Language;
  setLang: (l: Language) => void;
} | null>(null);

const useAppContext = () => {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppContext");
  return ctx;
};

// --- Helper Components ---

const TTSButton: React.FC<{ text: string; lang: Language }> = ({ text, lang }) => {
  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'sv' ? 'sv-SE' : lang === 'ar' ? 'ar-SA' : 'en-US'; 
      window.speechSynthesis.speak(utterance);
    }
  };
  return (
    <button onClick={speak} className="text-slate-400 hover:text-brand-600 p-1 transition-colors" title="Read Aloud">
      <Volume2 size={24} />
    </button>
  );
};

const LanguageSwitcher = () => {
    const { lang, setLang } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-md transition-all border border-transparent hover:border-slate-700"
            >
                <Globe size={16} />
                <span className="uppercase">{lang}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                    {LANGUAGES.map(l => (
                        <button 
                            key={l.code} 
                            onClick={() => { setLang(l.code); setIsOpen(false); }}
                            className={`flex items-center w-full px-4 py-3 text-sm text-left hover:bg-slate-50 transition-colors ${lang === l.code ? 'text-brand-600 font-bold bg-brand-50' : 'text-slate-700'}`}
                        >
                           <span className="flex-1">{l.label}</span>
                           {lang === l.code && <CheckCircle2 size={14} />}
                        </button>
                    ))}
                </div>
                </>
            )}
        </div>
    );
};

// --- Main Page Component ---

const SinglePageLesson = () => {
  const { lang } = useAppContext();
  // We only show the first lesson (Intro)
  const baseLesson = INITIAL_LESSONS[0]; 
  const t = UI_TRANSLATIONS[lang];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-12 pb-24">
      {/* Lesson Header */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{t.lesson1Title}</h1>
            <TTSButton text={t.lesson1Title} lang={lang} />
        </div>
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl">{t.lesson1Desc}</p>
      </div>

      {/* Blocks */}
      <div className="space-y-12">
        {baseLesson.blocks.map((block, idx) => (
          <div key={block.id} className="animate-in fade-in duration-700 slide-in-from-bottom-8 fill-mode-backwards" style={{animationDelay: `${idx * 100}ms`}}>
            
            {block.type === BlockType.COMMAND_LAB && (
              <div className="space-y-4">
                  {/* Translated Instruction Override */}
                  <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-900">
                      <p className="font-medium text-lg">{t.labInstruction}</p>
                      <TTSButton text={t.labInstruction} lang={lang} />
                  </div>
                  <div className="w-full overflow-x-auto">
                     <CommandLab block={block as CommandLabBlock} lang={lang} />
                  </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* GDPR Footer */}
      <footer className="mt-24 pt-8 border-t border-slate-200 text-center">
        <p className="text-slate-500 text-sm font-medium">{t.gdprFooter}</p>
      </footer>
    </div>
  );
};

// --- Layout ---

const Layout = ({ children }: { children?: React.ReactNode }) => {
    const { lang } = useAppContext();
    const t = UI_TRANSLATIONS[lang];
    const isRtl = LANGUAGES.find(l => l.code === lang)?.dir === 'rtl';

    return (
        <div className={`min-h-screen flex flex-col bg-slate-50 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl shadow-slate-900/10 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 select-none">
                        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">k</div>
                        <span>{t.brandName}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <LanguageSwitcher />
                    </div>
                </div>
            </nav>
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
};

// --- App Root ---

const App = () => {
    const [lang, setLang] = useState<Language>('sv');

    return (
        <AppContext.Provider value={{ lang, setLang }}>
            <Layout>
                <SinglePageLesson />
            </Layout>
        </AppContext.Provider>
    );
};

export default App;