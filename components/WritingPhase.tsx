import React, { useState } from 'react';
import { StudentLevel, PracticeMode, AppLanguage } from '../types';
import { translations } from '../translations';
import { Send, Clock } from 'lucide-react';

interface WritingPhaseProps {
  level: StudentLevel;
  mode: PracticeMode;
  topic: string;
  lang: AppLanguage;
  onSubmit: (content: string) => void;
  loading: boolean;
}

const WritingPhase: React.FC<WritingPhaseProps> = ({ level, mode, topic, lang, onSubmit, loading }) => {
  const t = translations[lang];
  const [content, setContent] = useState('');
  
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in h-[calc(100vh-80px)] flex flex-col">
       {/* Header */}
       <div className="flex justify-between items-start mb-6">
         <div>
           <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
             <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold uppercase">{mode === PracticeMode.Essay ? t.essay : t.drill}</span>
             <span>{t.levelNames[level]}</span>
           </div>
           <h2 className="text-xl font-bold text-slate-900 leading-tight">{topic}</h2>
         </div>
         <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2 text-slate-600 font-mono text-sm">
           <span className={wordCount < 10 ? 'text-red-500' : 'text-emerald-600'}>{wordCount}</span> {t.words}
         </div>
       </div>

       {/* Editor */}
       <div className="flex-1 relative">
         <textarea
           value={content}
           onChange={(e) => setContent(e.target.value)}
           placeholder={mode === PracticeMode.Sentence 
             ? t.drillPlaceholder
             : t.essayPlaceholder}
           className="w-full h-full p-6 text-lg leading-relaxed rounded-2xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none font-serif text-slate-800 bg-white"
           disabled={loading}
         />
       </div>

       {/* Footer Action */}
       <div className="mt-6 flex justify-end">
          <button
            onClick={() => onSubmit(content)}
            disabled={content.length < 5 || loading}
            className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg flex items-center gap-3 transition-all ${
              content.length < 5 || loading 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>{t.processing} <span className="animate-pulse">...</span></>
            ) : (
              <>{t.submitGrading} <Send size={18} /></>
            )}
          </button>
       </div>
    </div>
  );
};

export default WritingPhase;