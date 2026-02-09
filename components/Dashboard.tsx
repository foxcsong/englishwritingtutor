import React from 'react';
import { UserProfile, AppLanguage, HistoryRecord } from '../types';
import { BADGES } from '../constants';
import { getTranslation } from '../translations';
import { Trophy, History, Star, BookOpen, PenTool, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  profile: UserProfile;
  history: HistoryRecord[];
  lang: AppLanguage;
  onStartNew: () => void;
  onSelectLevel: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, history, lang, onStartNew, onSelectLevel }) => {
  const t = getTranslation(lang);
  const lastHistory = history.slice(0, 5); // Last 5 items

  // Prepare data for the chart (last 10 scores)
  const chartData = history
    .slice(0, 10)
    .reverse()
    .map((h, i) => ({
      name: `Ex ${i + 1}`,
      score: h.evaluation.score,
    }));

  const levelDisplay = profile.level ? (t.levelNames as any)[profile.level] : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">
          {t.greeting}, <span className="text-indigo-600">{profile.username}</span>! 👋
        </h1>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center space-x-5 border border-slate-100 hover:shadow-md transition-shadow">
          <div className="bg-amber-100 p-4 rounded-2xl text-amber-600">
            <Star size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.totalPoints}</p>
            <h3 className="text-3xl font-black text-slate-800">{profile.points}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center space-x-5 border border-slate-100 hover:shadow-md transition-shadow">
          <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.badgesEarned}</p>
            <h3 className="text-3xl font-black text-slate-800">{profile.badges.length} <span className="text-slate-300 text-lg">/ {BADGES.length}</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 flex items-center space-x-5 border border-slate-100 hover:shadow-md transition-shadow">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.exercisesCompleted}</p>
            <h3 className="text-3xl font-black text-slate-800">{history.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Action & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <PenTool size={160} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Current Focus</p>
                  <h2 className="text-3xl font-black">{levelDisplay || 'Not Selected'}</h2>
                </div>
                <button onClick={onSelectLevel} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all backdrop-blur-md">
                  {t.changeLevel}
                </button>
              </div>
              <button
                onClick={onStartNew}
                className="w-full py-5 bg-white text-indigo-700 rounded-2xl text-xl font-black shadow-lg hover:shadow-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <PenTool size={24} />
                {t.startNew}
              </button>
            </div>
          </div>

          {/* Score Chart */}
          {chartData.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 h-80">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <History className="text-indigo-500" size={20} /> {t.perfHistory}
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-slate-100/50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">{t.noHistory}</p>
            </div>
          )}
        </div>

        {/* Recent History & Badges */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> {t.badgesEarned}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {BADGES.map((badge) => {
                const isUnlocked = profile.badges.includes(badge.id);
                return (
                  <div key={badge.id} className="relative group">
                    <div className={`aspect-square rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-500 ${isUnlocked ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-20 grayscale'}`}>
                      <span role="img" aria-label={badge.name}> {badge.icon}</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-40 bg-slate-900/90 backdrop-blur-md text-white text-[10px] rounded-xl p-3 text-center z-20 shadow-xl">
                      <p className="font-black mb-1 text-xs">{lang === 'cn' ? badge.name : badge.name}</p>
                      <p className="opacity-70 leading-relaxed">{badge.description}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/90"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <History size={18} className="text-indigo-500" /> {t.recentHistory}
            </h3>
            <div className="space-y-4">
              {lastHistory.length === 0 ? (
                <div className="py-6 text-center text-slate-300 italic text-sm">No recent activity</div>
              ) : (
                lastHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.topic}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {new Date(item.date).toLocaleDateString()} • {item.mode?.split(' ')[0] || ''}
                      </p>
                    </div>
                    <div className={`ml-4 h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-black border-2 ${item.evaluation.score >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : item.evaluation.score >= 60 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                      {item.evaluation.score}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;