import React, { useEffect, useState } from 'react';
import { StudentLevel, TopicMaterial, PracticeMode, AppLanguage } from '../types';
import { generateLearningMaterial } from '../services/aiService';
import { translations, getTranslation } from '../translations';
import { BookOpen, ArrowRight, Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface LearningPhaseProps {
  username: string;
  level: StudentLevel;
  topic: string;
  lang: AppLanguage;
  onProceed: (mode: PracticeMode, requirements?: any) => void;
}

const LearningPhase: React.FC<LearningPhaseProps> = ({ username, level, topic, lang, onProceed }) => {
  const t = getTranslation(lang);
  const [material, setMaterial] = useState<TopicMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchMaterial = async () => {
      try {
        const data = await generateLearningMaterial(username, level, topic, lang);
        if (mounted) setMaterial(data);
      } catch (e: any) {
        if (mounted) setError(e.message);
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMaterial();
    return () => { mounted = false; };
  }, [username, level, topic, lang]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
        <p>{t.preparing} "{topic}"...</p>
      </div>
    );
  }

  if (error) return (
    <div className="text-center py-20 px-4">
      <div className="text-red-500 font-bold mb-4">{t.failLoad}</div>
      <p className="text-slate-500 text-sm mb-6">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-slate-800 text-white rounded-xl font-medium"
      >
        刷新页面重试
      </button>
    </div>
  );

  if (!material) return <div className="text-center py-20 text-red-500">{t.failLoad}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in pb-24">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-3 uppercase tracking-wider">
          {t.topicStudy}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">{material.topic}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <BookOpen size={20} className="text-emerald-500" /> {t.introduction}
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{material.introduction}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <CheckCircle2 size={20} className="text-amber-500" /> {t.keyAnalysis}
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">{material.analysis}</p>
          </div>
        </div>

        <div className="bg-slate-800 text-slate-100 p-8 rounded-2xl shadow-xl leading-relaxed font-serif relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText size={120} />
          </div>
          <h3 className="font-sans font-bold text-slate-300 text-sm tracking-widest uppercase mb-6 border-b border-slate-600 pb-2">{t.sampleEssay}</h3>
          <div className="whitespace-pre-wrap opacity-90">{material.sampleEssay}</div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 font-medium hidden sm:block">{t.readyToPractice}</p>
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={() => onProceed(PracticeMode.Sentence, material?.requirements)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl border-2 border-slate-200 font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              {t.sentenceDrill}
            </button>
            <button
              onClick={() => onProceed(PracticeMode.Essay, material?.requirements)}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {t.startWriting} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LearningPhase;