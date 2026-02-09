import React, { useState } from 'react';
import { StudentLevel, AppLanguage } from '../types';
import { generateTopics } from '../services/aiService';
import { translations } from '../translations';
import { getTranslation } from '../translations';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface TopicPhaseProps {
  username: string;
  level: StudentLevel;
  lang: AppLanguage;
  onConfirm: (topic: string) => void;
}

const TopicPhase: React.FC<TopicPhaseProps> = ({ username, level, lang, onConfirm }) => {
  const t = getTranslation(lang);
  const [customTopic, setCustomTopic] = useState('');
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const topics = await generateTopics(username, level);
      setGeneratedTopics(topics);
    } catch (e: any) {
      alert(e.message || t.aiBusy);
    } finally {
      setLoading(false);
    }
  };

  const levelName = (t.levelNames as any)[level];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.topicTitle}</h2>
        <p className="text-slate-500">{t.topicDesc} ({levelName})</p>
      </div>

      {/* AI Generator */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" /> {t.aiSuggestions}
          </h3>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-sm px-3 py-1 bg-white text-indigo-600 font-medium rounded-full shadow-sm hover:shadow border border-indigo-100 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {generatedTopics.length > 0 ? t.refresh : t.generate}
          </button>
        </div>

        {generatedTopics.length === 0 ? (
          <div className="text-center py-8 text-indigo-400 text-sm italic">
            {t.clickGenerate}
          </div>
        ) : (
          <div className="space-y-2">
            {generatedTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => onConfirm(topic)}
                className="w-full text-left p-4 bg-white hover:bg-indigo-50 rounded-xl border border-white hover:border-indigo-200 shadow-sm hover:shadow transition-all group flex justify-between items-center"
              >
                <span className="font-medium text-slate-700 group-hover:text-indigo-700">{topic}</span>
                <ArrowRight size={16} className="text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-2 text-sm text-slate-400">{t.or}</span>
        </div>
      </div>

      {/* Manual Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{t.writeOwn}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder={t.inputPlaceholder}
            className="flex-1 rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3"
          />
          <button
            onClick={() => customTopic && onConfirm(customTopic)}
            disabled={!customTopic.trim()}
            className="bg-slate-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t.startBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicPhase;