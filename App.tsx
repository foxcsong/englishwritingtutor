import React, { useState, useEffect } from 'react';
import { UserProfile, StudentLevel, PracticeMode, EvaluationResult, HistoryRecord, UserConfig, AppLanguage } from './types';
import { getProfile, saveProfile, updatePointsAndBadges, addHistory, getHistory, saveAIConfig, logoutUser } from './services/storageService';
import { evaluateWriting } from './services/aiService';
import { POINTS_PER_ESSAY, POINTS_PER_SENTENCE } from './constants';
import { translations, getTranslation } from './translations';
import LevelSelector from './components/LevelSelector';
import Dashboard from './components/Dashboard';
import TopicPhase from './components/TopicPhase';
import LearningPhase from './components/LearningPhase';
import WritingPhase from './components/WritingPhase';
import ResultPhase from './components/ResultPhase';
import AIConfigModal from './components/AIConfigModal';
import AdminPanel from './components/AdminPanel';
import { Loader2, Globe, LogOut, Settings, Key, User, ShieldCheck } from 'lucide-react';

enum AppState {
  Login,
  Welcome, // Level Selection
  Config,  // AI Settings
  Dashboard,
  TopicSelection,
  Learning,
  Writing,
  Result,
  Admin
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
    try {
      let profile = await getProfile(name);

      if (!profile || !profile.username) {
        // Initialize a default profile for new users or corrupted data
        profile = {
          username: name,
          language: 'cn',
          level: null,
          points: 0,
          badges: [],
          config: null
        };
      }

      setUserProfile(profile);
      localStorage.setItem('yingyu_xiezuo_current_user', name);

      // Load history
      try {
        const hist = await getHistory(name);
        setHistory(Array.isArray(hist) ? hist : []);
      } catch (e) {
        setHistory([]);
      }

      if (!profile.config) {
        setAppState(AppState.Config);
      } else if (!profile.level) {
        setAppState(AppState.Welcome);
      } else {
        setAppState(AppState.Dashboard);
      }
    } catch (error) {
      console.error("Auth success logic failed", error);
      setAuthError("Failed to initialize user session.");
    } finally {
      setInitializing(false);
    }
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
      if (res.ok) {
        await handleAuthSuccess(username);
      } else {
        const data = await res.json().catch(() => ({ error: 'Auth failed' }));
        setAuthError(data.error || 'Auth failed');
      }
    } catch (e) {
      setAuthError('Connection error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveConfig = async (config: UserConfig) => {
    if (!userProfile) return;
    try {
      await saveAIConfig(userProfile.username, config);
      const updatedProfile = { ...userProfile, config };
      setUserProfile(updatedProfile);

      if (!updatedProfile.level) {
        setAppState(AppState.Welcome);
      } else {
        setAppState(AppState.Dashboard);
      }
    } catch (e) {
      throw e; // Rethrow to let the modal handle error UI
    }
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
    try {
      const updatedProfile = await saveProfile({ ...userProfile, level });
      setUserProfile(updatedProfile);
      setAppState(AppState.Dashboard);
    } catch (e) {
      alert("Failed to save level selection.");
    }
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

  const currentLang: AppLanguage = userProfile?.language === 'en' ? 'en' : 'cn';
  const t = getTranslation(currentLang);

  if (initializing) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

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
                  <span className="text-sm font-bold text-indigo-600">{userProfile.points || 0} pts</span>
                  <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {(userProfile.username || 'U')[0]}
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
        {/* Render fallback if userProfile is missing but we're not in login state or admin */}
        {!userProfile && appState !== AppState.Login && appState !== AppState.Admin ? (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">Session error. Please login again.</p>
            <button onClick={handleLogout} className="text-indigo-600 font-bold">Back to Login</button>
          </div>
        ) : (
          <>
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

                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setAppState(AppState.Admin)}
                      className="text-xs text-slate-300 hover:text-indigo-400 font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                      <ShieldCheck size={12} /> Admin Access
                    </button>
                  </div>
                </div>
              </div>
            )}

            {appState === AppState.Admin && (
              <AdminPanel onBack={() => {
                if (userProfile) setAppState(AppState.Dashboard);
                else setAppState(AppState.Login);
              }} />
            )}

            {/* Config Modal */}
            {appState === AppState.Config && userProfile && (
              <AIConfigModal
                username={userProfile.username}
                initialConfig={userProfile.config}
                lang={currentLang}
                onSave={handleSaveConfig}
                onClose={() => {
                  if (userProfile.config) setAppState(AppState.Dashboard);
                  else setAppState(AppState.Login);
                }}
              />
            )}

            {appState === AppState.Welcome && userProfile && <LevelSelector lang={currentLang} onSelect={handleLevelSelect} />}

            {appState === AppState.Dashboard && userProfile && (
              <div className="max-w-6xl mx-auto py-8 px-4">
                <Dashboard
                  profile={userProfile}
                  history={history}
                  lang={currentLang}
                  onStartNew={startNewSession}
                  onSelectLevel={() => setAppState(AppState.Welcome)}
                  onOpenConfig={() => setAppState(AppState.Config)}
                />
              </div>
            )}

            {appState === AppState.TopicSelection && userProfile && userProfile.level && (
              <TopicPhase username={userProfile.username} level={userProfile.level} lang={currentLang} onConfirm={(topic) => {
                setCurrentTopic(topic);
                setAppState(AppState.Learning);
              }} />
            )}

            {appState === AppState.Learning && userProfile && userProfile.level && (
              <LearningPhase
                username={userProfile.username}
                level={userProfile.level}
                topic={currentTopic}
                lang={currentLang}
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
                lang={currentLang}
                onSubmit={handleSubmitWriting}
                loading={processing}
              />
            )}

            {appState === AppState.Result && userProfile && evaluation && (
              <ResultPhase
                result={evaluation}
                userContent={currentContent}
                topic={currentTopic}
                lang={currentLang}
                username={userProfile.username}
                onHome={() => setAppState(AppState.Dashboard)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;