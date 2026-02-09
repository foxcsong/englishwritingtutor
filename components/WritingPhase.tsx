import React, { useState } from 'react';
import { StudentLevel, PracticeMode, AppLanguage } from '../types';
import { getTranslation } from '../translations';
import { Send, Clock, Camera, X, Image as ImageIcon } from 'lucide-react';

interface WritingPhaseProps {
  level: StudentLevel;
  mode: PracticeMode;
  topic: string;
  lang: AppLanguage;
  onSubmit: (content: string, image?: string) => void;
  loading: boolean;
}

const WritingPhase: React.FC<WritingPhaseProps> = ({ level, mode, topic, lang, onSubmit, loading }) => {
  const t = getTranslation(lang);
  const [content, setContent] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        setContent('Handwritten Essay Uploaded'); // Placeholder text
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setCapturedImage(null);
    setContent('');
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold uppercase">{mode === PracticeMode.Essay ? t.essay : t.drill}</span>
            <span>{(t.levelNames as any)[level]}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{topic}</h2>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2 text-slate-600 font-mono text-sm">
          {!capturedImage && (
            <><span className={wordCount < 10 ? 'text-red-500' : 'text-emerald-600'}>{wordCount}</span> {t.words}</>
          )}
          {capturedImage && <span className="text-indigo-600 font-bold">Image Mode</span>}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {capturedImage ? (
          <div className="w-full h-full p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-slate-50 flex items-center justify-center relative group">
            <img src={capturedImage} alt="Essay" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
            <button
              onClick={clearImage}
              className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
              <p className="text-white font-bold">Handwritten Essay Selected</p>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === PracticeMode.Sentence
              ? t.drillPlaceholder
              : t.essayPlaceholder}
            className="w-full h-full p-6 text-lg leading-relaxed rounded-2xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none font-serif text-slate-800 bg-white"
            disabled={loading}
          />
        )}
      </div>

      {/* Footer Action */}
      <div className="mt-6 flex justify-between items-center">
        <div>
          <input
            type="file"
            accept="image/*"
            id="essay-upload"
            className="hidden"
            onChange={handleFileSelect}
            disabled={loading}
          />
          {!capturedImage && (
            <label
              htmlFor="essay-upload"
              className={`px-6 py-4 rounded-xl font-bold bg-white border border-slate-200 shadow-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 transition-all cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Camera size={18} />
              <span>Upload Handwriting</span>
            </label>
          )}
        </div>

        <button
          onClick={() => onSubmit(content, capturedImage || undefined)}
          disabled={content.length < 5 || loading}
          className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg flex items-center gap-3 transition-all ${content.length < 5 || loading
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