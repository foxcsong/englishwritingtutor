import React from 'react';
import { EvaluationResult, AppLanguage } from '../types';
import { translations } from '../translations';
import { Download, Check, RefreshCcw, FileText, Layout, Award, Share2, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import ShareCard from './ShareCard';

interface ResultPhaseProps {
  result: EvaluationResult;
  userContent: string;
  topic: string;
  lang: AppLanguage;
  username: string;
  onHome: () => void;
}

const ResultPhase: React.FC<ResultPhaseProps> = ({ result, userContent, topic, lang, username, onHome }) => {
  const t = translations[lang];
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        style: { transform: 'scale(1)' } // Prevent scaling issues
      });
      download(dataUrl, `Report-${topic.slice(0, 10)}.png`);
    } catch (error) {
      console.error('Failed to export image', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    const markdown = `
# 英语写作练习报告 (${topic})
**日期**: ${new Date().toLocaleDateString()}
**分数**: ${result.score}/100

## 你的原文
> ${userContent.replace(/\n/g, '\n> ')}

---

## 老师点评
${result.generalFeedback}

## 详细批改
${result.detailedCorrections.length === 0 ? '*完美！没有语法错误。*' : result.detailedCorrections.map((c, i) => `
### ${i + 1}. 修改建议
- **原文**: \`${c.original}\`
- **修改**: **${c.correction}**
- **解析**: ${c.explanation}
`).join('\n')}

---

## 优化版本
\`\`\`text
${result.improvedVersion}
\`\`\`

*生成自 英语写作大师*
    `;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `写作报告-${topic.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scoreData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score },
  ];
  const scoreColor = result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in pb-32">

      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-4 bg-white p-8 rounded-[40px] shadow-xl shadow-indigo-100/50 border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="h-40 w-40 relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  innerRadius={60}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={scoreColor} />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-black text-slate-800">{result.score}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded mt-1">Score</span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{t.assessmentComplete}</h2>
          <p className="text-sm text-slate-500 font-medium px-4">{topic}</p>
        </div>

        <div className="lg:col-span-8 bg-indigo-600 p-10 rounded-[40px] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Award size={200} />
          </div>
          <div className="relative z-10">
            <h3 className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-4">{t.teachersComment}</h3>
            <p className="text-xl font-bold leading-relaxed mb-8 italic">"{result.generalFeedback}"</p>
            <div className="flex gap-4">
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black shadow-lg flex items-center gap-3 hover:scale-105 transition-all"
              >
                <Download size={20} /> {t.downloadReport}
              </button>
              <button
                onClick={handleShareImage}
                disabled={isExporting}
                className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black shadow-lg flex items-center gap-3 hover:bg-indigo-400 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
                Share Image
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Corrections Column */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Layout size={16} /> {t.detailedCorrections}
          </h3>
          {result.detailedCorrections.length === 0 ? (
            <div className="p-10 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Check size={32} className="text-emerald-500" />
              </div>
              <p className="font-bold text-lg">{t.perfect}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.detailedCorrections.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="mb-3 text-slate-400 line-through text-sm decoration-red-300 font-medium">{item.original}</div>
                  <div className="mb-4 text-emerald-600 font-black flex items-center gap-2 text-lg">
                    <Check size={20} /> {item.correction}
                  </div>
                  <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="font-black text-indigo-600 mr-2 uppercase text-[10px] tracking-widest">{t.analysis}</span>
                    <span className="leading-relaxed">{item.explanation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Improved Version Column */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <FileText size={16} /> {t.improvedVersion}
          </h3>
          <div className="bg-slate-800 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
              <FileText size={120} />
            </div>
            <p className="whitespace-pre-wrap leading-loose text-slate-200 font-serif text-lg selection:bg-indigo-500 selection:text-white relative z-10">
              {result.improvedVersion}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-dotted border-slate-300">
            <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">{t.yourSubmission}</h4>
            <p className="text-slate-500 text-sm italic leading-relaxed">{userContent}</p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onHome}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <RefreshCcw size={20} /> {t.backDashboard}
        </button>
      </div>

      {/* Hidden ShareCard for Capture */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <ShareCard
          ref={cardRef}
          score={result.score}
          topic={topic}
          evaluation={result}
          lang={lang}
          username={username}
        />
      </div>
    </div>
  );
};

export default ResultPhase;