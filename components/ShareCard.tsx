import React from 'react';
import { EvaluationResult, AppLanguage } from '../types';
import { getTranslation } from '../translations';
import { Trophy, Star, Quote, Award } from 'lucide-react';

interface ShareCardProps {
    score: number;
    topic: string;
    evaluation: EvaluationResult;
    lang: AppLanguage;
    username: string;
}

// ForwardRef is needed for html-to-image to capture this specific DOM element
const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>(({ score, topic, evaluation, lang, username }, ref) => {
    const t = getTranslation(lang);

    // Determine gradient based on score
    const getGradient = () => {
        if (score >= 90) return "from-amber-200 to-yellow-400"; // Gold
        if (score >= 80) return "from-slate-200 to-slate-400";   // Silver
        if (score >= 60) return "from-orange-200 to-orange-400"; // Bronze
        return "from-blue-200 to-indigo-400";                   // Participation
    };

    const getEmoji = () => {
        if (score >= 90) return "🏆";
        if (score >= 80) return "🥈";
        if (score >= 60) return "🥉";
        return "💪";
    };

    return (
        <div ref={ref} className="w-[400px] bg-white rounded-3xl overflow-hidden shadow-2xl relative">
            {/* Decorative Background Pattern */}
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-br ${getGradient()} opacity-20`} />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute top-20 -left-10 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-50" />

            <div className="relative p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-1">
                    <div className="flex justify-center mb-2">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradient()} flex items-center justify-center text-3xl shadow-lg rotate-3`}>
                            {getEmoji()}
                        </div>
                    </div>
                    <h2 className="text-indigo-900 font-bold text-lg tracking-wide uppercase opacity-70">English Writing Master</h2>
                    <h1 className="text-3xl font-black text-slate-900">{score} <span className="text-base font-medium text-slate-400">/ 100</span></h1>
                </div>

                {/* Topic */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Topic</h3>
                    <p className="text-slate-700 font-medium line-clamp-2 leading-tight">
                        {topic}
                    </p>
                </div>

                {/* Feedback Snippet */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Quote className="text-indigo-300 shrink-0 mt-1" size={16} />
                        <p className="text-sm text-slate-600 italic leading-relaxed">
                            "{evaluation.generalFeedback.slice(0, 120)}{evaluation.generalFeedback.length > 120 ? '...' : ''}"
                        </p>
                    </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-indigo-400 font-bold uppercase mb-1">Corrections</div>
                        <div className="text-xl font-bold text-indigo-700">{evaluation.detailedCorrections.length}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-purple-400 font-bold uppercase mb-1">Level</div>
                        <div className="text-xl font-bold text-purple-700">A+</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {username[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{username}</span>
                            <span className="text-[10px] text-slate-400">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-50">
                        <Award size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-bold text-indigo-900 tracking-wider">WRITING MASTER</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;
