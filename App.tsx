import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Users, Search, PlusCircle, LogOut, Phone, Megaphone, Calendar, CheckCircle2,
  Clock, Briefcase, User as UserIcon, Filter, X, Trash2, Trophy, TrendingUp, Crown, BarChart3,
  AlertTriangle, FileWarning, ClipboardList, Settings, Camera, Pencil, Info, Shield, UserPlus,
  Percent, Activity, Sparkles, Bot, Medal, MessageSquare, Mail, Copy, Columns, List, Gauge,
  Zap, Sword, BrainCircuit, BookOpen, Save, RefreshCw, HelpCircle, LockKeyhole, Send, Minimize2, PhoneMissed,
  Newspaper, Globe, TrendingDown, ThermometerSun, Snowflake, ArrowRight, Bell, Shuffle, AlertOctagon,
  Target, Lightbulb, History, MoreHorizontal, CalendarClock
} from 'lucide-react';
import { format, isToday, isBefore, differenceInDays, isSameDay, isSameMonth, isSameWeek, addDays, parseISO as dateFnsParseISO } from 'date-fns';
// @ts-ignore
import confetti from 'canvas-confetti';

import { User, Role, InteractionLog, LeadStatus, CallType, CompanyKnowledge } from './types';
import { 
  loginUser, registerUser, logoutUser, getCurrentUser, getLogs, saveLog, 
  updateLogStatus, deleteLog, getAllUsers, updateUserProfile, updateLog, 
  createUser, deleteUser, adminUpdateUser, getCompanyKnowledge, saveCompanyKnowledge, ensureMasterAdmin, resetUserPassword, registerNewAdmin, checkPhoneExists
} from './services/storage';
import { 
  refineNotes, generateDailyBriefing, chatWithSalesAssistant, generateCallStrategy, 
  generateNoAnswerMessage, CallStrategy, generatePerformanceAnalysis, PerformanceAnalysis, 
  getMarketIntel, MarketIntel, getMarketDeepDive, chatWithLeadStrategyAssistant
} from './services/ai';
import { Card3D, Button3D, Input3D, Select3D } from './components/UI';

// --- POLYFILLS ---
const parseISO = (str: string) => {
  if (!str) return new Date(NaN);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(str);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// --- SALES COPILOT WIDGET ---
const SalesCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: "Hi! I'm your Sales Assistant. Ask me about the product or paste a client's WhatsApp message to get a reply!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const aiResponse = await chatWithSalesAssistant(userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 md:w-96 bg-white border-2 border-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-10 duration-300">
           <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                 <Sparkles className="text-amber-400" size={20} />
                 <h3 className="font-bold">Sales Copilot</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-slate-800 p-1 rounded"><Minimize2 size={18}/></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-3 rounded-xl text-sm font-medium ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                      {m.text}
                   </div>
                </div>
              ))}
              {loading && (
                 <div className="flex justify-start">
                   <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-bl-none shadow-sm">
                     <div className="flex gap-1">
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                       <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     </div>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           <div className="p-3 bg-white border-t border-slate-200 shrink-0 flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ask query or paste msg..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend} 
                disabled={loading || !input.trim()}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
           </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-white"
        >
           <Bot size={28} />
           <span className="absolute top-0 right-0 w-4 h-4 bg-amber-400 rounded-full border-2 border-indigo-600"></span>
        </button>
      )}
    </div>
  );
};

// --- LEADERBOARD SCREEN ---
const LeaderboardScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<InteractionLog[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const allUsers = await getAllUsers();
      const allLogs = await getLogs();
      setUsers(allUsers);
      setLogs(allLogs);
    };
    loadData();
  }, []);

  const leaderboard = useMemo(() => {
    if (users.length === 0) return [];
    const stats = users.map(user => {
      const userLogs = logs.filter(l => l.agentEmail.toLowerCase() === user.email.toLowerCase());
      const sales = userLogs.filter(l => l.leadStatus === LeadStatus.PAID).length;
      return { user, sales };
    });
    return stats.sort((a, b) => b.sales - a.sales);
  }, [users, logs]);

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="text-center mb-12 z-10">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">CHAMPIONS <span className="text-indigo-600">LEAGUE</span></h1>
        <p className="text-slate-500 font-medium uppercase tracking-widest">Top Performers This Month</p>
      </div>

      <div className="flex items-end justify-center gap-4 mb-12 w-full max-w-3xl z-10">
        {top3[1] && (
          <div className="flex flex-col items-center w-1/3">
             <div className="w-20 h-20 rounded-full border-4 border-slate-300 shadow-lg overflow-hidden mb-3 relative bg-white">
               <img src={top3[1].user.photoURL} className="w-full h-full object-cover" />
               <div className="absolute bottom-0 w-full bg-slate-400 text-white text-xs font-bold text-center py-1">#2</div>
             </div>
             <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 border-2 border-slate-300 rounded-t-2xl p-4 text-center shadow-md h-32 flex flex-col justify-end">
                <h3 className="font-bold text-slate-800 truncate">{top3[1].user.name}</h3>
                <p className="text-2xl font-black text-slate-600">{top3[1].sales}</p>
             </div>
          </div>
        )}
        {top3[0] && (
          <div className="flex flex-col items-center w-1/3 -mb-6 relative">
             <Crown size={48} className="text-amber-400 absolute -top-14 drop-shadow-lg animate-bounce" fill="currentColor" />
             <div className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-xl overflow-hidden mb-3 relative bg-white z-10">
               <img src={top3[0].user.photoURL} className="w-full h-full object-cover" />
             </div>
             <div className="w-full bg-gradient-to-t from-amber-100 to-white border-2 border-amber-400 rounded-t-2xl p-6 text-center shadow-[0_0_30px_rgba(251,191,36,0.3)] h-48 flex flex-col justify-end relative z-0">
                <h3 className="font-extrabold text-slate-900 text-lg truncate">{top3[0].user.name}</h3>
                <p className="text-4xl font-black text-amber-500">{top3[0].sales}</p>
             </div>
          </div>
        )}
        {top3[2] && (
          <div className="flex flex-col items-center w-1/3">
             <div className="w-20 h-20 rounded-full border-4 border-orange-300 shadow-lg overflow-hidden mb-3 relative bg-white">
               <img src={top3[2].user.photoURL} className="w-full h-full object-cover" />
               <div className="absolute bottom-0 w-full bg-orange-400 text-white text-xs font-bold text-center py-1">#3</div>
             </div>
             <div className="w-full bg-gradient-to-t from-orange-100 to-white border-2 border-orange-300 rounded-t-2xl p-4 text-center shadow-md h-24 flex flex-col justify-end">
                <h3 className="font-bold text-slate-800 truncate">{top3[2].user.name}</h3>
                <p className="text-2xl font-black text-orange-600">{top3[2].sales}</p>
             </div>
          </div>
        )}
      </div>

      <Button3D onClick={onComplete} className="w-64 z-20" icon={LogOut}>Enter CRM</Button3D>
    </div>
  );
};

// --- AUTH SCREEN ---
const AuthScreen: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    
    try {
      let user;
      if (showEmergency) {
         user = await registerNewAdmin(email, password);
      } else if (isLogin) {
         user = await loginUser(email, password);
      } else {
         user = await registerUser(email, password);
      }
      localStorage.setItem('crm_current_user', JSON.stringify(user));
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminInit = async () => {
    try {
        setLoading(true);
        const msg = await ensureMasterAdmin();
        setSuccessMsg(msg);
        setEmail('admin@followup.com');
        setError('');
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
      if (!email) {
          setError("Please enter your email address first.");
          return;
      }
      try {
          await resetUserPassword(email);
          setSuccessMsg(`Password reset email sent to ${email}. Check your inbox (and spam).`);
          setError('');
      } catch (e: any) {
          setError(e.message);
      }
  };

  if (showEmergency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50 p-6">
        <div className="w-full max-w-md">
           <Card3D className="bg-white border-rose-200">
             <div className="text-center mb-6">
               <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-2">
                 <LockKeyhole className="text-rose-600" size={32} />
               </div>
               <h2 className="text-2xl font-black text-rose-700">Emergency Admin</h2>
               <p className="text-sm text-slate-500">Create a new Admin account to bypass lockout.</p>
             </div>
             <form onSubmit={handleSubmit}>
               <Input3D label="Your Real Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
               <Input3D label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
               
               {error && <div className="text-rose-600 font-bold text-sm mb-4">{error}</div>}
               
               <Button3D type="submit" variant="danger" className="w-full" loading={loading}>Force Create Admin</Button3D>
               <button type="button" onClick={() => setShowEmergency(false)} className="w-full mt-4 text-sm font-bold text-slate-500 hover:text-slate-800">Cancel</button>
             </form>
           </Card3D>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
           <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto shadow-3d mb-4 flex items-center justify-center rotate-3 hover:rotate-6 transition-transform">
             <Phone className="text-white" size={40} />
           </div>
           <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Follow Up</h1>
           <p className="text-slate-500 font-medium mt-2">Secure Agent Access</p>
        </div>

        <Card3D className="bg-white">
          <div className="flex border-b border-slate-100 mb-4">
            <button 
              className={`flex-1 pb-2 font-bold text-sm ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
            >
              Login
            </button>
            <button 
              className={`flex-1 pb-2 font-bold text-sm ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
            >
              First Time Setup
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <Input3D label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input3D label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            
            {!isLogin && (
               <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium">
                 Use this tab ONLY if you are new and setting your password for the first time.
               </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            <Button3D type="submit" className="w-full mt-2" loading={loading}>
              {isLogin ? 'Secure Login' : 'Create Account'}
            </Button3D>

            <div className="mt-6 flex flex-col gap-3 text-center border-t border-slate-100 pt-4">
                 <button type="button" onClick={handleForgotPassword} className="text-slate-500 text-xs font-bold hover:text-indigo-600">
                    Forgot Password?
                 </button>
                 
                 <div className="flex justify-between items-center gap-2">
                    <button type="button" onClick={handleAdminInit} className="text-xs bg-slate-100 text-slate-500 px-3 py-2 rounded-lg font-bold hover:bg-slate-200 flex-1">
                        Repair Database
                    </button>
                    <button type="button" onClick={() => setShowEmergency(true)} className="text-xs bg-rose-50 text-rose-600 px-3 py-2 rounded-lg font-bold hover:bg-rose-100 flex-1 border border-rose-200">
                        Locked out?
                    </button>
                 </div>
            </div>
          </form>
        </Card3D>
      </div>
    </div>
  );
};

// --- LEAD DETAILS COMPONENT (REDESIGNED) ---
const LeadDetailsModal: React.FC<{ lead: InteractionLog, logs: InteractionLog[], onClose: () => void, onUpdate: (id: string, updates: any) => Promise<void> }> = ({ lead, logs, onClose, onUpdate }) => {
  const [callStrategy, setCallStrategy] = useState<CallStrategy | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  
  const [showNoAnswerUI, setShowNoAnswerUI] = useState(false);
  const [noAnswerMsg, setNoAnswerMsg] = useState('');
  const [regenIntent, setRegenIntent] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // --- STRATEGY CHAT STATE ---
  const [strategyChatMessages, setStrategyChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [strategyChatInput, setStrategyChatInput] = useState('');
  const [strategyChatLoading, setStrategyChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingStrategy(true);
      const s = await generateCallStrategy(logs.filter(l => l.phone === lead.phone));
      setCallStrategy(s);
      setLoadingStrategy(false);
    };
    load();
  }, [lead, logs]);

  const handleGenerateNoAnswer = async () => {
    setGeneratingDraft(true);
    setShowNoAnswerUI(true);
    const msg = await generateNoAnswerMessage(lead.clientName, logs.filter(l => l.phone === lead.phone), regenIntent);
    setNoAnswerMsg(msg);
    setGeneratingDraft(false);
    setRegenIntent('');
  };

  const handleStrategyChatSend = async () => {
     if (!strategyChatInput.trim()) return;
     const msg = strategyChatInput;
     setStrategyChatInput('');
     setStrategyChatMessages(prev => [...prev, {role: 'user', text: msg}]);
     setStrategyChatLoading(true);
     
     const response = await chatWithLeadStrategyAssistant(msg, logs.filter(l => l.phone === lead.phone), lead.clientName);
     
     setStrategyChatMessages(prev => [...prev, {role: 'ai', text: response}]);
     setStrategyChatLoading(false);
     
     // Scroll to bottom
     setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-5xl h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
          {/* HEADER */}
          <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-center">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserIcon size={24} className="text-white"/>
               </div>
               <div>
                  <h2 className="text-3xl font-black tracking-tight">{lead.clientName}</h2>
                  <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                     <span className="flex items-center gap-1"><Phone size={14}/> {lead.phone}</span>
                     <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${lead.leadStatus === LeadStatus.PAID ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>{lead.leadStatus}</span>
                  </div>
               </div>
             </div>
             <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"><X/></button>
          </div>

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            
            {/* LEFT: HISTORY (35%) */}
            <div className="md:col-span-4 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden">
               <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-white sticky top-0">
                  <History className="text-indigo-600" size={18}/>
                  <h3 className="font-black text-slate-700 uppercase tracking-wider text-xs">Interaction Timeline</h3>
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="space-y-6 relative border-l-2 border-slate-200 ml-2 pl-6">
                    {logs.filter(l => l.phone === lead.phone).sort((a,b) => b.createdAt - a.createdAt).map((log, idx) => (
                        <div key={log.id} className="relative">
                          <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx===0 ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-300'}`}></div>
                          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{log.leadStatus}</span>
                                <span className="text-xs text-slate-400 font-medium">{log.followUpDate}</span>
                              </div>
                              <p className="text-slate-700 text-sm leading-relaxed">{log.description}</p>
                              <p className="text-xs text-slate-400 mt-3 font-bold flex items-center gap-1">
                                <UserIcon size={10}/> {log.agentName}
                              </p>
                          </div>
                        </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* RIGHT: STRATEGY & ACTIONS (65%) */}
            <div className="md:col-span-8 bg-white flex flex-col h-full overflow-hidden">
               
               {/* STRATEGY CARD */}
               <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                  <div className="mb-8">
                     <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><Target className="text-indigo-600"/> Strategic Battle Card</h3>
                     
                     {loadingStrategy ? (
                         <div className="grid gap-4 animate-pulse">
                            <div className="h-24 bg-slate-100 rounded-xl"></div>
                            <div className="h-32 bg-slate-100 rounded-xl"></div>
                         </div>
                     ) : callStrategy ? (
                         <div className="space-y-6">
                            {/* THE STORY SO FAR */}
                            <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
                               <h4 className="font-bold text-indigo-900 text-sm mb-2 uppercase tracking-wide flex items-center gap-2"><BookOpen size={16}/> The Story So Far</h4>
                               <p className="text-slate-700 leading-relaxed text-lg font-medium">"{callStrategy.situationSummary}"</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {/* WINNING MOVES */}
                               <div>
                                  <h4 className="font-bold text-slate-900 text-sm mb-3 uppercase tracking-wide flex items-center gap-2"><Sword size={16}/> Winning Moves</h4>
                                  <div className="space-y-3">
                                     {callStrategy.talkingPoints.map((tp, i) => (
                                        <div key={i} className="bg-white border-2 border-slate-100 p-3 rounded-lg shadow-sm flex gap-3 items-start">
                                           <div className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{i+1}</div>
                                           <p className="text-slate-700 text-sm font-medium">{tp}</p>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                               
                               {/* TEMPERAMENT */}
                               <div>
                                  <h4 className="font-bold text-slate-900 text-sm mb-3 uppercase tracking-wide flex items-center gap-2"><ThermometerSun size={16}/> Client Temperament</h4>
                                  <div className="bg-gradient-to-r from-slate-100 to-white border border-slate-200 p-5 rounded-xl text-center">
                                      <p className="text-3xl font-black text-slate-800 tracking-tight">{callStrategy.psychologicalVibe}</p>
                                      <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                                          <div className="h-full bg-indigo-500 w-2/3"></div>
                                      </div>
                                  </div>
                               </div>
                            </div>

                            {/* TACTICAL CHAT (NEW) */}
                            <div className="mt-6 bg-slate-900 rounded-xl p-4 text-white">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare size={18} className="text-emerald-400"/>
                                    <h4 className="font-bold text-sm uppercase tracking-wide">Tactical Chat (Ask Specifics)</h4>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4 h-40 overflow-y-auto mb-3 custom-scrollbar">
                                   {strategyChatMessages.length === 0 ? (
                                       <p className="text-slate-500 text-xs text-center italic mt-10">Ask me anything about this lead...<br/>(e.g., "What if he says price is too high?")</p>
                                   ) : (
                                       <div className="space-y-3">
                                          {strategyChatMessages.map((msg, i) => (
                                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                  <div className={`p-2 rounded-lg text-xs max-w-[85%] font-medium ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-900 rounded-bl-none'}`}>
                                                      {msg.text}
                                                  </div>
                                              </div>
                                          ))}
                                          {strategyChatLoading && (
                                              <div className="flex justify-start">
                                                  <div className="bg-white/10 p-2 rounded-lg rounded-bl-none"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div></div>
                                              </div>
                                          )}
                                          <div ref={chatEndRef}></div>
                                       </div>
                                   )}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                       type="text" 
                                       className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                       placeholder="Type your tactical question..."
                                       value={strategyChatInput}
                                       onChange={(e) => setStrategyChatInput(e.target.value)}
                                       onKeyDown={(e) => e.key === 'Enter' && handleStrategyChatSend()}
                                    />
                                    <button 
                                      onClick={handleStrategyChatSend} 
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 rounded-lg"
                                      disabled={strategyChatLoading || !strategyChatInput.trim()}
                                    >
                                       <Send size={16}/>
                                    </button>
                                </div>
                            </div>

                         </div>
                     ) : (
                         <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                            AI Strategy Unavailable
                         </div>
                     )}
                  </div>
                  
                  {/* NO ANSWER UI (Contextual) */}
                  {showNoAnswerUI && (
                    <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 animate-in slide-in-from-bottom-5">
                       <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2"><MessageSquare size={18}/> Drafted "Missed Call" Follow-up</h4>
                       
                       {generatingDraft ? (
                          <div className="flex items-center gap-3 text-amber-700 font-bold p-4"><div className="animate-spin">⏳</div> Analyzing history & drafting personal message...</div>
                       ) : (
                          <>
                             <div className="relative">
                               <textarea 
                                  className="w-full p-4 rounded-xl border border-amber-200 bg-white text-base font-medium text-slate-700 shadow-inner focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                                  rows={3}
                                  value={noAnswerMsg}
                                  onChange={(e) => setNoAnswerMsg(e.target.value)}
                               />
                               <button 
                                 className="absolute right-2 bottom-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                                 onClick={() => { navigator.clipboard.writeText(noAnswerMsg); alert("Copied!"); }}
                               >
                                 Copy Text
                               </button>
                             </div>
                             
                             <div className="mt-3 flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Want to say something else? (e.g. 'Mention the deadline')" 
                                  className="flex-1 bg-white border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400"
                                  value={regenIntent}
                                  onChange={(e) => setRegenIntent(e.target.value)}
                                />
                                <button onClick={handleGenerateNoAnswer} className="bg-amber-200 hover:bg-amber-300 text-amber-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
                                   <RefreshCw size={14}/> Rewrite
                                </button>
                             </div>
                          </>
                       )}
                    </div>
                  )}

               </div>

               {/* ACTION FOOTER */}
               <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <Button3D variant="success" icon={CheckCircle2} onClick={() => { onUpdate(lead.id, { leadStatus: LeadStatus.PAID, isCompleted: true }); onClose(); confetti(); }}>Close Deal (Paid)</Button3D>
                     <Button3D variant="danger" icon={X} onClick={() => { onUpdate(lead.id, { leadStatus: LeadStatus.NOT_INTERESTED, isCompleted: true }); onClose(); }}>Not Interested</Button3D>
                     <Button3D variant="secondary" icon={Megaphone} onClick={() => { onUpdate(lead.id, { leadStatus: LeadStatus.SECOND_VOICE, secondVoiceRequested: true }); onClose(); }}>Request 2nd Voice</Button3D>
                     <Button3D variant={showNoAnswerUI ? 'primary' : 'secondary'} icon={PhoneMissed} onClick={handleGenerateNoAnswer}>No Answer?</Button3D>
                  </div>
               </div>
            </div>

          </div>
      </div>
    </div>
  );
};

// --- ADD LEAD MODAL ---
const AddLeadModal = ({ onClose, onSave }: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        const currentUser = getCurrentUser();
        if(!currentUser) throw new Error("No user");

        await saveLog({
            agentName: currentUser.name,
            agentEmail: currentUser.email,
            clientName: name,
            phone: phone,
            description: desc,
            leadStatus: LeadStatus.NEW_PROSPECT,
            callType: CallType.WORK,
            followUpDate: format(new Date(), 'yyyy-MM-dd'),
            followUpTime: '09:00',
            isCompleted: false,
            secondVoiceRequested: false
        });
        onSave();
        onClose();
    } catch(err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <Card3D className="w-full max-w-lg bg-white relative">
            <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X/></button>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Add New Lead</h2>
            <form onSubmit={handleSubmit}>
                <Input3D label="Client Name" value={name} onChange={e => setName(e.target.value)} required />
                <Input3D label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
                <div className="mb-4">
                    <label className="text-sm font-bold text-slate-700 mb-1 ml-1">Initial Notes</label>
                    <textarea 
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:border-slate-900 transition-colors"
                        rows={3}
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        required
                    />
                </div>
                {error && <div className="mb-4 text-rose-600 font-bold text-sm bg-rose-50 p-2 rounded">{error}</div>}
                <Button3D type="submit" loading={loading} className="w-full">Create Lead</Button3D>
            </form>
        </Card3D>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('dashboard');
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedLead, setSelectedLead] = useState<InteractionLog | null>(null);
  
  // Dashboard specific
  const [briefing, setBriefing] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all'|'today'>('all');

  // Market specific
  const [marketData, setMarketData] = useState<MarketIntel | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  // Knowledge specific
  const [knowledge, setKnowledge] = useState<CompanyKnowledge | null>(null);
  const [editingKnowledge, setEditingKnowledge] = useState(false);

  // Analytics specific
  const [analytics, setAnalytics] = useState<PerformanceAnalysis | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Admin specific
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const refreshLogs = async () => {
    const data = await getLogs();
    setLogs(data);
  };

  useEffect(() => {
    const init = async () => {
      const u = getCurrentUser();
      if (u) {
        setUser(u);
        const data = await getLogs();
        setLogs(data);
        setShowLeaderboard(true);
        
        // Load briefing
        const todayCount = data.filter(l => l.agentEmail === u.email && isToday(new Date(l.followUpDate))).length;
        const msg = await generateDailyBriefing(u.name, todayCount, 0);
        setBriefing(msg);
      }
      setLoading(false);
    };
    init();
  }, []);

  // View Handlers
  const handleViewChange = async (v: string) => {
    setView(v);
    if (v === 'market' && !marketData) {
        setLoadingMarket(true);
        const m = await getMarketIntel();
        setMarketData(m);
        setLoadingMarket(false);
    }
    if (v === 'knowledge' && !knowledge) {
        const k = await getCompanyKnowledge();
        setKnowledge(k);
    }
    if (v === 'analytics' && user) {
        setLoadingAnalytics(true);
        const a = await generatePerformanceAnalysis(logs.filter(l => l.agentEmail === user.email), user.name);
        setAnalytics(a);
        setLoadingAnalytics(false);
    }
    if (v === 'admin' && user?.role === Role.ADMIN) {
        const u = await getAllUsers();
        setAllUsers(u);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setShowLeaderboard(false);
  };

  const handleUpdateLog = async (id: string, updates: Partial<InteractionLog>) => {
    await updateLogStatus(id, updates);
    await refreshLogs();
  };

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-400">Loading App...</div>;

  if (!user) return <AuthScreen onLogin={(u) => { setUser(u); refreshLogs(); setShowLeaderboard(true); }} />;

  if (showLeaderboard) return <LeaderboardScreen onComplete={() => setShowLeaderboard(false)} />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
       {/* SIDEBAR */}
       <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all">
          <div className="p-6 flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
               <Phone className="text-white" size={16}/>
             </div>
             <span className="font-black text-lg tracking-tight hidden md:inline">Follow Up</span>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
             {[
               { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
               { id: 'analytics', icon: BarChart3, label: 'My Performance' },
               { id: 'market', icon: Globe, label: 'Market Intel' },
               { id: 'knowledge', icon: BookOpen, label: 'Knowledge Base' },
             ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === item.id ? 'bg-indigo-600 shadow-lg text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                   <item.icon size={20} />
                   <span className="hidden md:inline font-medium">{item.label}</span>
                </button>
             ))}

             {user.role === Role.ADMIN && (
                <button 
                  onClick={() => handleViewChange('admin')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'admin' ? 'bg-indigo-600 shadow-lg text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                   <Users size={20} />
                   <span className="hidden md:inline font-medium">Admin Panel</span>
                </button>
             )}
          </nav>

          <div className="p-4 border-t border-slate-800">
             <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-rose-400 hover:bg-slate-800 rounded-xl transition-colors">
                <LogOut size={20} />
                <span className="hidden md:inline font-bold">Logout</span>
             </button>
          </div>
       </div>

       {/* MAIN CONTENT */}
       <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* DASHBOARD VIEW */}
          {view === 'dashboard' && (
             <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <header className="mb-8 flex justify-between items-end">
                   <div>
                      <h1 className="text-3xl font-black text-slate-900 mb-2">Hello, {user.name.split(' ')[0]} 👋</h1>
                      <p className="text-slate-500 font-medium max-w-2xl">{briefing || "Ready to crush some sales targets?"}</p>
                   </div>
                   <Button3D icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>Add Lead</Button3D>
                </header>

                <div className="mb-6 flex gap-2 border-b border-slate-200 pb-1">
                   <button onClick={() => setFilter('all')} className={`pb-2 px-2 font-bold text-sm ${filter==='all' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>All Leads</button>
                   <button onClick={() => setFilter('today')} className={`pb-2 px-2 font-bold text-sm ${filter==='today' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Today's Tasks</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {logs
                     .filter(l => l.agentEmail === user.email)
                     .filter(l => filter === 'today' ? isToday(new Date(l.followUpDate)) : true)
                     .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                     .map(log => (
                       <Card3D key={log.id} onClick={() => setSelectedLead(log)} className="hover:border-indigo-200 group">
                          <div className="flex justify-between items-start mb-3">
                             <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                {log.leadStatus}
                             </div>
                             {isToday(new Date(log.followUpDate)) && <div className="text-rose-500 font-bold text-xs flex items-center gap-1"><Clock size={12}/> Today</div>}
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 mb-1">{log.clientName}</h3>
                          <p className="text-slate-500 text-sm mb-4 line-clamp-2">{log.description}</p>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-100 pt-3">
                             <span>{log.phone}</span>
                             <span>{log.followUpDate}</span>
                          </div>
                       </Card3D>
                   ))}
                </div>
             </div>
          )}

          {/* ANALYTICS VIEW */}
          {view === 'analytics' && (
             <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <h1 className="text-3xl font-black text-slate-900 mb-8">Performance Review</h1>
                {loadingAnalytics ? <div className="animate-pulse">Analyzing...</div> : analytics ? (
                   <div className="max-w-4xl space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <Card3D className="bg-white text-center">
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Health Score</div>
                            <div className={`text-6xl font-black ${analytics.healthScore > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{analytics.healthScore}</div>
                         </Card3D>
                         <Card3D className="md:col-span-2 bg-slate-900 text-white border-slate-900">
                             <h3 className="font-bold text-indigo-400 mb-2">AI Manager Feedback</h3>
                             <p className="text-lg leading-relaxed">{analytics.review}</p>
                         </Card3D>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card3D className="bg-emerald-50 border-emerald-200">
                            <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><TrendingUp/> Strengths</h3>
                            <ul className="space-y-2">
                               {analytics.strengths.map((s, i) => <li key={i} className="text-emerald-700 font-medium flex gap-2"><CheckCircle2 size={16}/> {s}</li>)}
                            </ul>
                         </Card3D>
                         <Card3D className="bg-rose-50 border-rose-200">
                            <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><AlertTriangle/> Areas to Improve</h3>
                            <ul className="space-y-2">
                               {analytics.weaknesses.map((s, i) => <li key={i} className="text-rose-700 font-medium flex gap-2"><Target size={16}/> {s}</li>)}
                            </ul>
                         </Card3D>
                      </div>
                   </div>
                ) : <div className="text-center p-10 text-slate-400">No data available.</div>}
             </div>
          )}

          {/* MARKET INTEL VIEW */}
          {view === 'market' && (
             <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3"><Globe className="text-indigo-600"/> Market Intelligence</h1>
                {loadingMarket ? <div className="text-xl font-bold text-slate-400 animate-pulse">Scanning Global Markets...</div> : marketData ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                      <Card3D className="bg-indigo-600 text-white border-indigo-800">
                         <h3 className="font-bold text-indigo-200 mb-4 uppercase tracking-wide">Today's Headlines</h3>
                         <ul className="space-y-4">
                            {marketData.today.map((n,i) => (
                               <li key={i} className="flex gap-3 items-start">
                                  <span className="bg-white/20 px-2 rounded text-sm font-bold">{i+1}</span>
                                  <span className="font-medium leading-tight">{n}</span>
                               </li>
                            ))}
                         </ul>
                      </Card3D>
                      <Card3D className="bg-white">
                         <h3 className="font-bold text-slate-400 mb-4 uppercase tracking-wide">Weekly Trends</h3>
                         <ul className="space-y-3">
                            {marketData.thisWeek.map((n,i) => <li key={i} className="text-slate-700 font-medium border-l-4 border-indigo-100 pl-3">{n}</li>)}
                         </ul>
                      </Card3D>
                      <Card3D className="md:col-span-2 bg-slate-900 text-white border-slate-900">
                         <h3 className="font-bold text-amber-400 mb-4 uppercase tracking-wide flex items-center gap-2"><Sparkles/> Future Predictions</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {marketData.predictions.map((n,i) => <div key={i} className="bg-white/10 p-4 rounded-xl">{n}</div>)}
                         </div>
                      </Card3D>
                   </div>
                ) : <div className="text-center p-10 text-slate-400">Market data unavailable. Check API Key.</div>}
             </div>
          )}

          {/* KNOWLEDGE BASE VIEW */}
          {view === 'knowledge' && (
             <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                   <h1 className="text-3xl font-black text-slate-900">Knowledge Base</h1>
                   {user.role === Role.ADMIN && (
                     <Button3D onClick={() => { 
                         if(editingKnowledge && knowledge) saveCompanyKnowledge(knowledge); 
                         setEditingKnowledge(!editingKnowledge); 
                     }}>
                         {editingKnowledge ? 'Save Changes' : 'Edit Knowledge'}
                     </Button3D>
                   )}
                </div>
                
                {knowledge ? (
                   <div className="max-w-3xl space-y-6">
                      <Card3D className="bg-amber-50 border-amber-200">
                         <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold uppercase text-xs tracking-wider"><BrainCircuit size={14}/> Master Brain</div>
                         {editingKnowledge ? (
                            <textarea className="w-full h-64 p-4 rounded-xl border-2 border-amber-300 focus:outline-none" value={knowledge.masterDocumentText} onChange={e => setKnowledge({...knowledge, masterDocumentText: e.target.value})} placeholder="Paste full brochures, pricing PDFs text here..."/>
                         ) : (
                            <p className="text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto">{knowledge.masterDocumentText || "No master document uploaded."}</p>
                         )}
                      </Card3D>

                      <div className="grid gap-6">
                          {['productName', 'pricing', 'uniqueSellingPoints', 'objectionRules'].map((key) => (
                             <div key={key}>
                                <label className="block text-sm font-bold text-slate-400 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                                {editingKnowledge ? (
                                    <input className="w-full p-3 border-2 border-slate-200 rounded-xl font-medium" value={(knowledge as any)[key]} onChange={e => setKnowledge({...knowledge, [key]: e.target.value})} />
                                ) : (
                                    <div className="p-4 bg-white border-2 border-slate-100 rounded-xl font-medium text-slate-800">{(knowledge as any)[key]}</div>
                                )}
                             </div>
                          ))}
                      </div>
                   </div>
                ) : <div>Loading...</div>}
             </div>
          )}

          {/* ADMIN VIEW */}
          {view === 'admin' && (
             <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <h1 className="text-3xl font-black text-slate-900 mb-8">User Management</h1>
                <Card3D>
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b-2 border-slate-100 text-slate-400 text-sm uppercase tracking-wider">
                            <th className="pb-3 pl-2">User</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3">Status</th>
                         </tr>
                      </thead>
                      <tbody className="text-slate-700 font-medium">
                         {allUsers.map(u => (
                            <tr key={u.email} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                               <td className="py-4 pl-2">
                                  <div className="font-bold text-slate-900">{u.name}</div>
                                  <div className="text-xs text-slate-400">{u.email}</div>
                               </td>
                               <td className="py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{u.role}</span></td>
                               <td className="py-4">{u.uid === 'pending_registration' ? <span className="text-amber-500 font-bold text-xs">Pending</span> : <span className="text-emerald-500 font-bold text-xs">Active</span>}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </Card3D>
             </div>
          )}

          <SalesCopilot />
          {selectedLead && <LeadDetailsModal lead={selectedLead} logs={logs} onClose={() => setSelectedLead(null)} onUpdate={handleUpdateLog} />}
          {isAddModalOpen && <AddLeadModal onClose={() => setIsAddModalOpen(false)} onSave={refreshLogs} />}
       </div>
    </div>
  );
};

export default App;
