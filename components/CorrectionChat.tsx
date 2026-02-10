import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles, BookOpen, Languages } from 'lucide-react';
import { ChatMessage, StudentLevel, AppLanguage } from '../types';
import { explainCorrection } from '../services/aiService';

interface CorrectionChatProps {
    username: string;
    level: StudentLevel;
    original: string;
    correction: string;
    lang: AppLanguage;
    onClose: () => void;
}

const CorrectionChat: React.FC<CorrectionChatProps> = ({ username, level, original, correction, lang, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await explainCorrection(
                username,
                level,
                original,
                correction,
                text,
                messages,
                lang
            );

            const aiMsg: ChatMessage = { role: 'assistant', content: response.reply };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = { role: 'assistant', content: "Sorry, I couldn't connect to the tutor. Please try again." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Why is this wrong?', icon: <Sparkles size={14} />, prompt: "Why is this wrong? Please explain the grammar rule." },
        { label: 'Give another example', icon: <BookOpen size={14} />, prompt: "Can you give me another example sentence using this rule?" },
        { label: 'Translate explanation', icon: <Languages size={14} />, prompt: "Please translate the explanation to Chinese." },
    ];

    return (
        <div className="mt-4 border-t border-slate-100 pt-4 bg-slate-50/50 rounded-xl p-4 animate-fade-in relative">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                    <MessageCircle size={16} /> Ask AI Tutor
                </h4>
                <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {messages.length === 0 && (
                <div className="text-xs text-slate-500 mb-4 text-center italic">
                    What would you like to know about this correction?
                </div>
            )}

            {/* Chat History */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm text-slate-400">
                            <Loader2 size={16} className="animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 0 && !loading && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(action.prompt)}
                            className="px-3 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-1.5"
                        >
                            {action.icon} {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all pr-10"
                    disabled={loading}
                />
                <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-30 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

export default CorrectionChat;
