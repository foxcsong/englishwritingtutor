import React, { useState } from 'react';
import { UserConfig, AppLanguage } from '../types';
import { getTranslation } from '../translations';
import { Settings, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { testAIConfig } from '../services/aiService';

interface AIConfigModalProps {
    username: string;
    initialConfig: UserConfig | null;
    lang: AppLanguage;
    onSave: (config: UserConfig) => Promise<void>;
    onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ username, initialConfig, lang, onSave, onClose }) => {
    const t = getTranslation(lang);
    const [provider, setProvider] = useState<'openai' | 'gemini'>(initialConfig?.provider || 'gemini');
    const [model, setModel] = useState(initialConfig?.model || (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o'));
    const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');

    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (!apiKey) return;

        setTesting(true);
        setError(null);
        setSuccess(false);

        try {
            const config: UserConfig = { provider, model, apiKey };
            // 1. Test the config
            await testAIConfig(username, config);

            // 2. If test passes, save it
            await onSave(config);

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (e: any) {
            setError(e.message || "Configuration test failed");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-scale-up">
                {/* Header */}
                <div className="p-10 pb-4 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600">
                            <Settings size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800">{t.aiConfig}</h2>
                            <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-tighter">API Persistence & Validation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <p className="text-slate-500 font-medium leading-relaxed text-lg">{t.configDesc}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t.providerLabel}</label>
                            <select
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none cursor-pointer transition-all shadow-inner"
                                value={provider}
                                onChange={(e) => {
                                    const p = e.target.value as any;
                                    setProvider(p);
                                    if (p === 'gemini') setModel('gemini-2.0-flash');
                                    else setModel('gpt-4o');
                                }}
                            >
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t.modelLabel}</label>
                            <input
                                type="text"
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 shadow-inner"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="e.g. gemini-2.0-flash"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t.apiKeyLabel}</label>
                        <input
                            type="password"
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 shadow-inner"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                        />
                    </div>

                    {error && (
                        <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 text-red-600 animate-shake">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <AlertCircle size={20} className="shrink-0" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase mb-1 tracking-widest opacity-60">Test Failed</p>
                                <div className="text-sm font-bold leading-tight">{error}</div>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4 text-emerald-600 animate-fade-in">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <CheckCircle size={20} className="shrink-0" />
                            </div>
                            <div className="text-sm font-bold">验证成功！配置已安全保存。</div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={testing || !apiKey}
                            className={`w-full py-5 rounded-3xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${testing || !apiKey
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                }`}
                        >
                            {testing ? (
                                <><Loader2 className="animate-spin" size={24} /> {t.processing}</>
                            ) : (
                                t.saveConfig
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;
