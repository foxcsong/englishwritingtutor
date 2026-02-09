import React from 'react';
import { LEVELS } from '../constants';
import { StudentLevel, AppLanguage } from '../types';
import { translations } from '../translations';
import { GraduationCap } from 'lucide-react';

interface LevelSelectorProps {
  lang: AppLanguage;
  onSelect: (level: StudentLevel) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ lang, onSelect }) => {
  const t = translations[lang];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full text-indigo-600 mb-6">
          <GraduationCap size={48} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{t.selectLevel}</h1>
        <p className="text-lg text-slate-500">{t.selectLevelDesc}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className="p-6 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 hover:shadow-lg transition-all duration-200 text-left group"
          >
            <span className="block text-sm font-bold text-slate-800 group-hover:text-indigo-700">{t.levelNames[level]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LevelSelector;