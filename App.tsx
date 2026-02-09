import React, { useState, useEffect } from 'react';
import { UserProfile, StudentLevel, PracticeMode, EvaluationResult, HistoryRecord, UserConfig } from './types';
import { getProfile, saveProfile, updatePointsAndBadges, addHistory, getHistory, saveAIConfig, logoutUser } from './services/storageService';
import { evaluateWriting } from './services/aiService';
import { POINTS_PER_ESSAY, POINTS_PER_SENTENCE } from './constants';
import { translations } from './translations';
import LevelSelector from './components/LevelSelector';
import Dashboard from './components/Dashboard';
import TopicPhase from './components/TopicPhase';
import LearningPhase from './components/LearningPhase';
import WritingPhase from './components/WritingPhase';
import ResultPhase from './components/ResultPhase';
import { Loader2, Globe, LogOut, Settings, Key, User } from 'lucide-react';

enum AppState {
  Login,
  Welcome, // Level Selection
  Config,  // AI Settings
  Dashboard,
  TopicSelection,
  Learning,
  Writing,
  Result
}

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.Login);
  const [initializing, setInitializing] = useState(true);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Config State
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempProvider, setTempProvider] = useState<'openai' | 'gemini'>('gemini');
  const [tempModel, setTempModel] = useState('gemini-2.0-flash');

  // Session State
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentMode, setCurrentMode] = useState<PracticeMode>(PracticeMode.Essay);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [processing, setProcessing] = useState(false);

  // Initialize
  useEffect(() => {
    const storedUser = localStorage.getItem('yingyu_xiezuo_current_user');
    if (storedUser) {
      handleAuthSuccess(storedUser);
    } else {
      setInitializing(false);
    }
  }, []);

  const handleAuthSuccess = async (name: string) => {
    setInitializing(true);
    const profile = await getProfile(name);
    if (profile) {
      setUserProfile(profile);
      localStorage.setItem('yingyu_xiezuo_current_user', name);

      // Load history
      const hist = await getHistory(name);
      setHistory(hist);

      if (!profile.config) {
        setAppState(AppState.Config);
      } else if (!profile.level) {
        setAppState(AppState.Welcome);
      } else {
        setAppState(AppState.Dashboard);
      }
    }
    setInitializing(false);
  };

  const handleLogin = async () => {
    if (!username || !password) return;
    setProcessing(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        handleAuthSuccess(username);
      } else {
        setAuthError(data.error || 'Auth failed');
      }
    } catch (e) {
      setAuthError('Connection error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!userProfile || !tempApiKey) return;
    setProcessing(true);
    const config: UserConfig = {
      apiKey: tempApiKey,
      provider: tempProvider,
      model: tempModel
    };
    await saveAIConfig(userProfile.username, config);
    const updatedProfile = { ...userProfile, config };
    setUserProfile(updatedProfile);

    if (!updatedProfile.level) {
      setAppState(AppState.Welcome);
    } else {
      setAppState(AppState.Dashboard);
    }
    setProcessing(false);
  };

  const handleLogout = () => {
    logoutUser();
    setUserProfile(null);
    setHistory([]);
    setAppState(AppState.Login);
    setUsername('');
    setPassword('');
  };

  const handleLevelSelect = async (level: StudentLevel) => {
    if (!userProfile) return;
    const updatedProfile = await saveProfile({ ...userProfile, level });
    setUserProfile(updatedProfile);
    setAppState(AppState.Dashboard);
  };

  const startNewSession = () => {
    setAppState(AppState.TopicSelection);
    setCurrentTopic('');
    setEvaluation(null);
    setCurrentContent('');
  };

  const handleSubmitWriting = async (content: string) => {
    if (!userProfile?.username || !userProfile.level) return;
    setProcessing(true);
    setCurrentContent(content);

    try {
      const result = await evaluateWriting(
        userProfile.username,
        userProfile.level,
        currentMode,
        currentTopic,
        content,
        userProfile.language
      );
      setEvaluation(result);

      const { profile: updatedProfile, newBadges } = await updatePointsAndBadges(userProfile,
        currentMode === PracticeMode.Essay ? POINTS_PER_ESSAY : POINTS_PER_SENTENCE);

      const record: HistoryRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        level: userProfile.level,
        topic: currentTopic,
        mode: currentMode,
        userContent: content,
        evaluation: result
      };
      await addHistory(userProfile.username, record);

      // Update local history
      setHistory([record, ...history]);

      setUserProfile(updatedProfile);
      if (newBadges.length > 0) setTimeout(() => alert(`🎉 ${newBadges.join(', ')}`), 500);
      setAppState(AppState.Result);
    } catch (error) {
      alert("AI Evaluation failed. Please check your API Key.");
    } finally {
      setProcessing(false);
    }
  };

  if (initializing) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const currentLang = userProfile ? userProfile.language : 'cn';
  const t = translations[currentLang];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-indigo-700 flex items-center gap-2 cursor-pointer" onClick={() => userProfile?.level ? setAppState(AppState.Dashboard) : null}>
            <span className="text-2xl">✍️</span> {t.appTitle}
          </div>

          <div className="flex items-center gap-4">
            {userProfile && (
              <>
                <button onClick={() => setAppState(AppState.Config)} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors">
                  <Settings size={20} />
                </button>
                <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full">
                  <span className="text-sm font-bold text-indigo-600">{userProfile.points} pts</span>
                  <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {userProfile.username[0]}
                  </div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Login Screen */}
        {appState === AppState.Login && (
          <div className="max-w-md mx-auto mt-20 px-4 scale-in-center">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-slate-900 mb-2">{t.welcome}</h1>
              <p className="text-slate-500 font-medium">Step into a world of better writing.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.username}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder={t.namePlaceholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{t.password}</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
              {authError && <p className="text-red-500 text-sm font-medium text-center">{authError}</p>}
              <button
                onClick={handleLogin}
                disabled={processing || !username || !password}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {processing ? <Loader2 className="animate-spin mx-auto" /> : t.login}
              </button>
            </div>
          </div>
        )}

        {/* Config Screen */}
        {appState === AppState.Config && userProfile && (
          <div className="max-w-xl mx-auto mt-12 px-4 animate-fade-in">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Settings className="text-indigo-600" /> {t.aiConfig}
              </h2>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">{t.configDesc}</p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t.providerLabel}</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium appearance-none"
                      value={tempProvider}
                      onChange={(e) => {
                        const p = e.target.value as any;
                        setTempProvider(p);
                        setTempModel(p === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o');
                      }}
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t.modelLabel}</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      value={tempModel}
                      onChange={(e) => setTempModel(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t.apiKeyLabel}</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="sk-..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSaveConfig}
                  disabled={processing || !tempApiKey}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 className="animate-spin mx-auto" /> : t.saveConfig}
                </button>
                <button onClick={() => setAppState(AppState.Dashboard)} className="w-full py-2 text-slate-400 font-medium text-sm hover:text-slate-600">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {appState === AppState.Welcome && userProfile && <LevelSelector lang={userProfile.language} onSelect={handleLevelSelect} />}

        {appState === AppState.Dashboard && userProfile && (
          <div className="max-w-6xl mx-auto py-8 px-4">
            <Dashboard
              profile={userProfile}
              history={history}
              lang={userProfile.language}
              onStartNew={startNewSession}
              onSelectLevel={() => setAppState(AppState.Welcome)}
            />
          </div>
        )}

        {appState === AppState.TopicSelection && userProfile && userProfile.level && (
          <TopicPhase username={userProfile.username} level={userProfile.level} lang={userProfile.language} onConfirm={(topic) => {
            setCurrentTopic(topic);
            setAppState(AppState.Learning);
          }} />
        )}

        {appState === AppState.Learning && userProfile && userProfile.level && (
          <LearningPhase
            username={userProfile.username}
            level={userProfile.level}
            topic={currentTopic}
            lang={userProfile.language}
            onProceed={(mode) => {
              setCurrentMode(mode);
              setAppState(AppState.Writing);
            }}
          />
        )}

        {appState === AppState.Writing && userProfile && userProfile.level && (
          <WritingPhase
            level={userProfile.level}
            mode={currentMode}
            topic={currentTopic}
            lang={userProfile.language}
            onSubmit={handleSubmitWriting}
            loading={processing}
          />
        )}

        {appState === AppState.Result && userProfile && evaluation && (
          <ResultPhase
            result={evaluation}
            userContent={currentContent}
            topic={currentTopic}
            lang={userProfile.language}
            onHome={() => setAppState(AppState.Dashboard)}
          />
        )}
      </main>
    </div>
  );
};

export default App;