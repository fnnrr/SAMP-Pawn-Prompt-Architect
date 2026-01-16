
import React, { useState, useEffect } from 'react';
import { 
  ScriptType, 
  SampVersion, 
  DatabaseType, 
  CommandProcessor, 
  PromptConfig,
  User
} from './types';
import { ICONS } from './constants';
import { refinePromptWithAI } from './services/gemini';

interface HistoryItem {
  id: string;
  prompt: string;
  config: PromptConfig;
  timestamp: string;
}

const PROJECT_TEMPLATES = [
  {
    title: "RP Core",
    description: "Modular architecture for roleplay servers.",
    features: "Threaded MySQL R41+, Dynamic Furniture, BCrypt, YSI-5.",
    type: ScriptType.GAMEMODE,
    database: DatabaseType.MYSQL
  },
  {
    title: "DM Script",
    description: "Combat logic and match management.",
    features: "Lag-comp hit detection, Dynamic Arenas, Elo-Rating DB.",
    type: ScriptType.GAMEMODE,
    database: DatabaseType.SQLITE
  }
];

const Modal = ({ isOpen, onClose, title, children, icon: Icon }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, icon?: any }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-[#0b1121] border border-slate-800 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
          <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tighter">
            <span className="text-orange-500">{Icon ? <Icon /> : <ICONS.Zap />}</span>
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-all bg-slate-800/50 p-1.5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-6 overflow-auto text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">{label}</label>
    {children}
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [config, setConfig] = useState<PromptConfig>({
    type: ScriptType.GAMEMODE,
    version: SampVersion.OPEN_MP,
    database: DatabaseType.MYSQL,
    commandProcessor: CommandProcessor.PAWN_CMD,
    features: '',
    useYSI: true,
    useStreamer: true,
    authorName: 'Developer'
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isRefining, setIsRefining] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeModal, setActiveModal] = useState<'templates' | 'auth' | 'history' | 'profile' | 'chat' | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, sender: 'user' | 'system', text: string, timestamp: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [premiumCode, setPremiumCode] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('samp_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setConfig(prev => ({ ...prev, authorName: parsedUser.username }));
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSyncing(true);

    try {
      // Endpoint must match netlify.toml / functions directory structure
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth', mode: authMode, ...authForm })
      });

      const result = await response.json();

      if (!response.ok) {
        setAuthError(result.error || 'Authentication failed.');
        setIsSyncing(false);
        return;
      }

      if (authMode === 'signup') {
        setAuthMode('login');
        setAuthError('Identity Created. Verify Access below.');
        setIsSyncing(false);
      } else {
        const sessionUser: User = {
          username: result.user.username,
          email: result.user.email,
          isPremium: false,
          generationsToday: 0,
          lastGenerationDate: new Date().toISOString(),
          cloudSynced: true
        };
        
        setUser(sessionUser);
        setHistory(result.history || []);
        localStorage.setItem('samp_user', JSON.stringify(sessionUser));
        setActiveModal(null);
      }
    } catch (err) {
      setAuthError('Connection Lost: Neon Backend unreachable. Ensure DATABASE_URL is set.');
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = () => {
    setUser(null);
    setHistory([]);
    localStorage.removeItem('samp_user');
    setActiveModal(null);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    
    setIsSendingChat(true);
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages([...chatMessages, userMsg]);
    setChatInput('');

    try {
      // Send chat message and code via backend
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat_send',
          username: user.username,
          message: chatInput,
          code: generatedPrompt,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        const systemMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'system' as const,
          text: '✓ Code delivered successfully.',
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, systemMsg]);
      }
    } catch (err) {
      console.error("Chat send failed:", err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'system' as const,
        text: '✗ Failed to send. Try again.',
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!premiumCode.trim() || !user) return;
    
    setIsSendingChat(true);
    try {
      const response = await fetch('/.netlify/functions/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem_premium',
          username: user.username,
          code: premiumCode
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        const systemMsg = {
          id: Date.now().toString(),
          sender: 'system' as const,
          text: `✓ Premium activated! Unlimited generations unlocked.`,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages([systemMsg]);
        setPremiumCode('');
        setUser(prev => prev ? {...prev, isPremium: true, premiumCode} : null);
      } else {
        const errorMsg = {
          id: Date.now().toString(),
          sender: 'system' as const,
          text: `✗ ${result.error || 'Invalid or already used code.'}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages([errorMsg]);
      }
    } catch (err) {
      console.error("Redeem failed:", err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleGenerate = async () => {
    const prompt = `### EXPERT PAWN ARCHITECT: SYSTEM SPECIFICATION
**Lead Engineer:** ${config.authorName}
**Environment:** ${config.version}
**Project:** ${config.type}

**I. CORE TECH:**
- **Persistence:** ${config.database} (Threaded R41+ / SQLite).
- **Execution:** ${config.commandProcessor}
- **Utility:** ${config.useYSI ? 'YSI 5.x Suite (y_hooks, y_timers, y_iterate)' : 'Legacy'}
- **Streaming:** ${config.useStreamer ? 'Incognito Streamer' : 'Standard'}

**II. FEATURES:**
${config.features || "Standard core initialization with player persistence."}

**III. CONSTRAINTS:**
1. **Thread Safety:** All DB I/O MUST be threaded (mysql_tquery).
2. **Memory Alignment:** Use 'static enum' for all player-scoped variables.
3. **Data Integrity:** Strict SQL parameterization and range-checking.
4. **Modularity:** Use Y_Hooks for all callbacks.

**IV. OUTPUT:**
Generate complete, production-ready PAWN source code.`;
    
    setGeneratedPrompt(prompt);

    if (user) {
      try {
        await fetch('/.netlify/functions/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'save_prompt', 
            username: user.username, 
            prompt, 
            config 
          })
        });
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          prompt,
          config: { ...config },
          timestamp: new Date().toLocaleString()
        };
        setHistory([newItem, ...history].slice(0, 50));
      } catch (e) {
        console.error("Cloud sync failed.");
      }
    }
  };

  const handleRefine = async () => {
    if (!generatedPrompt) return;
    setIsRefining(true);
    const refined = await refinePromptWithAI(generatedPrompt);
    setGeneratedPrompt(refined);
    setIsRefining(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050811] p-4 md:p-8 flex flex-col items-center">
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0"></div>
      
      <header className="w-full max-w-5xl mb-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl flex items-center justify-center shadow-lg rotate-1 border border-orange-500/20">
            <ICONS.Code />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Architect <span className="text-orange-500">ID</span></h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`} />
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em]">{user ? 'Secure' : 'Local'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex gap-6 items-center">
            <button onClick={() => setActiveModal('templates')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all cursor-pointer">Designs</button>
            <button onClick={() => setActiveModal('history')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all cursor-pointer">Archive</button>
            {user && <button onClick={() => setActiveModal('chat')} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-all cursor-pointer">Chat Support</button>}
          </nav>
          
          <div className="h-8 w-[1px] bg-slate-800" />
          
          <button 
            onClick={() => user ? setActiveModal('profile') : setActiveModal('auth')}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border ${user ? 'bg-slate-900/50 border-slate-800 text-white hover:bg-slate-900' : 'bg-orange-600 border-orange-500 text-white hover:bg-orange-500 shadow-lg active:scale-95'}`}
          >
            <div className="text-left hidden xs:block">
              <p className="text-[8px] font-black opacity-40 uppercase tracking-[0.2em] leading-none mb-1">{user ? 'Handle' : 'Identity'}</p>
              <p className="text-xs font-black tracking-tight leading-none">{user ? user.username : 'Sign In'}</p>
            </div>
            <ICONS.User />
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-[#0e1423]/80 backdrop-blur-3xl border border-slate-800/50 rounded-[2rem] p-6 shadow-xl">
            <h2 className="text-[10px] font-black mb-6 text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full" /> Config
            </h2>
            
            <div className="space-y-4">
              <InputField label="Category">
                <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none w-full text-white appearance-none hover:bg-slate-900 font-bold" value={config.type} onChange={(e) => setConfig({...config, type: e.target.value as ScriptType})}>
                  {Object.values(ScriptType).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </InputField>
              
              <InputField label="Execution">
                <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs w-full text-white appearance-none outline-none font-bold" value={config.commandProcessor} onChange={(e) => setConfig({...config, commandProcessor: e.target.value as CommandProcessor})}>
                  {Object.values(CommandProcessor).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </InputField>

              <InputField label="Database">
                <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs w-full text-white appearance-none outline-none font-bold" value={config.database} onChange={(e) => setConfig({...config, database: e.target.value as DatabaseType})}>
                  {Object.values(DatabaseType).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </InputField>
            </div>

            <button onClick={handleGenerate} className="w-full bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 mt-8 active:scale-[0.96] uppercase tracking-[0.2em] text-[10px]">
              <ICONS.Zap /> Deploy Spec
            </button>
          </div>
        </section>

        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#0e1423]/80 backdrop-blur-3xl border border-slate-800/50 rounded-[2rem] p-6 shadow-xl">
            <h2 className="text-[10px] font-black mb-4 text-white uppercase tracking-[0.3em]">Requirements Definition</h2>
            <textarea 
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 focus:ring-2 focus:ring-orange-500/20 outline-none resize-none placeholder:text-slate-800 font-mono" 
              placeholder="e.g. 'Faction system with JSON-serialized object storage...'" 
              value={config.features} 
              onChange={(e) => setConfig({...config, features: e.target.value})} 
            />
          </div>

          <div className="bg-[#0e1423]/80 backdrop-blur-3xl border border-slate-800/50 rounded-[2.5rem] flex flex-col h-[550px] overflow-hidden shadow-xl relative">
            <div className="bg-slate-800/20 backdrop-blur-md px-6 py-4 border-b border-slate-800/50 flex items-center justify-between z-10">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-[0.3em]">Terminal Port</span>
              <div className="flex gap-3">
                <button onClick={handleRefine} disabled={!generatedPrompt || isRefining} className="bg-blue-600 hover:bg-blue-500 text-[9px] font-black uppercase tracking-widest text-white px-4 py-2 rounded-xl disabled:opacity-50 transition-all active:scale-95">
                  {isRefining ? 'Optimizing...' : 'Refine'}
                </button>
                <button onClick={() => copyToClipboard(generatedPrompt)} disabled={!generatedPrompt} className="bg-slate-700 hover:bg-slate-600 text-[9px] font-black uppercase tracking-widest text-white px-4 py-2 rounded-xl transition-all active:scale-95">
                   {copyStatus === 'copied' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 font-mono text-[11px] text-slate-400 leading-relaxed bg-[#050811]/50 custom-scrollbar scroll-smooth">
              {generatedPrompt ? (
                <div className="whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">{generatedPrompt}</div>
              ) : (
                <div className="text-slate-900 italic flex flex-col items-center justify-center h-full gap-6 opacity-30 select-none">
                  <ICONS.Code />
                  <span className="tracking-[0.5em] font-black uppercase text-[10px]">Awaiting Data</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Modal isOpen={activeModal === 'auth'} onClose={() => {setActiveModal(null); setAuthError('');}} title="Architect Auth" icon={ICONS.User}>
        <div className="flex bg-slate-800/20 p-1.5 rounded-2xl mb-6 border border-slate-800/50">
          <button onClick={() => {setAuthMode('signup'); setAuthError('');}} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.3em] rounded-xl transition-all ${authMode === 'signup' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500'}`}>Signup</button>
          <button onClick={() => {setAuthMode('login'); setAuthError('');}} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.3em] rounded-xl transition-all ${authMode === 'login' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500'}`}>Login</button>
        </div>

        {authError && <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] font-black rounded-xl">
          {authError}
        </div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <InputField label="Handle">
            <input required className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs w-full text-white outline-none" placeholder="Architecture ID" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} />
          </InputField>
          {authMode === 'signup' && (
            <InputField label="Email">
              <input required type="email" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs w-full text-white outline-none" placeholder="dev@neon.sync" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            </InputField>
          )}
          <InputField label="Key">
            <input required type="password" placeholder="••••••••" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs w-full text-white outline-none" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
          </InputField>
          <button disabled={isSyncing} className="w-full bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg mt-6 active:scale-[0.97] transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3">
            {isSyncing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (authMode === 'signup' ? 'Register' : 'Verify')}
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'history'} onClose={() => setActiveModal(null)} title="Archives">
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-center py-10 text-slate-700 text-[9px] font-black uppercase tracking-widest">No Cloud Records.</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-orange-500/30 transition-all">
                <div className="truncate">
                  <p className="text-orange-500 text-[8px] font-black uppercase mb-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                  <p className="text-white text-[11px] font-bold truncate">Spec Archive #{idx + 1}</p>
                </div>
                <button onClick={() => { setGeneratedPrompt(item.prompt); setActiveModal(null); }} className="bg-slate-800 hover:bg-orange-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all">Load</button>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} title="Identity" icon={ICONS.Database}>
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-orange-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black text-white shadow-xl mb-4">
            {user?.username.charAt(0)}
          </div>
          <h4 className="text-2xl font-black text-white">{user?.username}</h4>
          <p className="text-slate-600 text-[10px] font-mono mb-6">{user?.email}</p>
          <button onClick={logout} className="w-full bg-red-950/20 text-red-500 font-black py-4 rounded-2xl border border-red-500/10 transition-all text-[10px] uppercase tracking-widest">Logout</button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'templates'} onClose={() => setActiveModal(null)} title="Templates">
        <div className="grid grid-cols-1 gap-4">
          {PROJECT_TEMPLATES.map((tpl, i) => (
            <button key={i} onClick={() => { setConfig({...config, ...tpl}); setActiveModal(null); }} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl text-left hover:border-orange-500/50 transition-all group">
              <h4 className="text-white font-black text-sm mb-2 group-hover:text-orange-500">{tpl.title}</h4>
              <p className="text-slate-500 text-[10px] leading-relaxed">{tpl.description}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'chat'} onClose={() => setActiveModal(null)} title="Chat Support">
        <div className="flex flex-col gap-4 h-96">
          <div className="flex-1 overflow-auto space-y-3 bg-slate-950/50 p-4 rounded-xl custom-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-700 text-[10px] text-center">
                <p>Send code via chat or redeem a premium key below.</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-xl text-[10px] ${msg.sender === 'user' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    <p>{msg.text}</p>
                    <span className="text-[8px] opacity-70 mt-1 block">{msg.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send code message..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="submit"
                disabled={isSendingChat || !generatedPrompt}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all"
              >
                Send
              </button>
            </form>

            <div className="border-t border-slate-800 pt-4">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Redeem Premium Code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={premiumCode}
                  onChange={(e) => setPremiumCode(e.target.value)}
                  placeholder="Enter premium key..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  onClick={handleRedeemCode}
                  disabled={isSendingChat || !premiumCode.trim()}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all"
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <footer className="w-full max-w-5xl mt-12 py-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-700 text-[9px] font-black uppercase tracking-[0.4em] relative z-10">
        <p>&copy; 2024 SAMP ARCHITECT • NEON V2.7</p>
        <div className="flex gap-8">
          <button onClick={() => setActiveModal('templates')} className="hover:text-orange-500">Docs</button>
          <button onClick={() => setActiveModal('profile')} className="hover:text-orange-500">Cloud</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
