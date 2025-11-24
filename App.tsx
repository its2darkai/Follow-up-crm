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
  getMarketIntel, MarketIntel, getMarketDeepDive 
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


// --- MAIN APP ---
export default function FollowUpApp() {
  const [user, setUser] = useState<User | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'leads' | 'analytics' | 'market'>('home');
  
  const [dailyBriefing, setDailyBriefing] = useState('');
  const [phone, setPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.NEW_PROSPECT);
  const [type, setType] = useState<CallType>(CallType.WORK);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [existingLeadCheck, setExistingLeadCheck] = useState<InteractionLog | null>(null);
  
  const [selectedLead, setSelectedLead] = useState<InteractionLog | null>(null);
  const [missedLeadsModalOpen, setMissedLeadsModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [adminEditId, setAdminEditId] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Admin Transfer State
  const [assigneeEmail, setAssigneeEmail] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Role>(Role.AGENT);
  const [editingTeamUser, setEditingTeamUser] = useState<string | null>(null);

  const [knowledge, setKnowledge] = useState<CompanyKnowledge | null>(null);
  
  // Analytics & Market States
  const [selectedAgentEmail, setSelectedAgentEmail] = useState('ALL');
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [marketIntel, setMarketIntel] = useState<MarketIntel | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  useEffect(() => {
    const current = getCurrentUser();
    if (current) setUser(current);
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const all = await getLogs();
    if (user.role === Role.ADMIN) {
      setLogs(all);
    } else {
      setLogs(all.filter(l => l.agentEmail.toLowerCase() === user.email.toLowerCase()));
    }
  }, [user]);

  useEffect(() => {
    if (user && !showLeaderboard) fetchLogs();
  }, [user, showLeaderboard, fetchLogs]);

  useEffect(() => {
    if (user && !showLeaderboard) {
       const today = logs.filter(l => l.followUpDate === format(new Date(), 'yyyy-MM-dd') && !l.isCompleted).length;
       const missed = logs.filter(l => isBefore(parseISO(l.followUpDate), startOfToday()) && !l.isCompleted).length;
       generateDailyBriefing(user.name, today, missed).then(setDailyBriefing);
    }
  }, [user, showLeaderboard, logs]);

  // Live Duplicate Check
  useEffect(() => {
    const check = async () => {
       if (phone.replace(/\D/g, '').length > 5 && !adminEditId) {
          const exists = await checkPhoneExists(phone);
          setExistingLeadCheck(exists);
       } else {
          setExistingLeadCheck(null);
       }
    };
    const timeoutId = setTimeout(check, 800);
    return () => clearTimeout(timeoutId);
  }, [phone, adminEditId]);

  // Analytics Calculation
  const analyticsLogs = useMemo(() => {
     if (selectedAgentEmail === 'ALL') return logs;
     return logs.filter(l => l.agentEmail.toLowerCase() === selectedAgentEmail.toLowerCase());
  }, [logs, selectedAgentEmail]);
  
  useEffect(() => {
    if (activeTab === 'analytics' && analyticsLogs.length > 0) {
       let agentName = "Global Team";
       if (selectedAgentEmail !== 'ALL') {
          const u = teamMembers.find(m => m.email.toLowerCase() === selectedAgentEmail.toLowerCase());
          if (u) agentName = u.name;
       } else if (user?.role !== Role.ADMIN) {
          agentName = user?.name || 'You';
       }
       generatePerformanceAnalysis(analyticsLogs, agentName).then(setAnalysis);
    }
  }, [activeTab, analyticsLogs, selectedAgentEmail]);

  const handleLoadMarket = async () => {
    if (marketIntel) return;
    setLoadingMarket(true);
    const data = await getMarketIntel();
    setMarketIntel(data);
    setLoadingMarket(false);
  };
  
  useEffect(() => {
    if (activeTab === 'market') handleLoadMarket();
  }, [activeTab]);

  const handleSaveLog = async () => {
    if (!phone || !clientName) return alert("Phone and Name required");
    if (existingLeadCheck && !adminEditId) return alert(`Cannot save. Lead managed by ${existingLeadCheck.agentName}.`);
    
    const requiresFollowUp = [LeadStatus.NEW_PROSPECT, LeadStatus.FOLLOW_UP, LeadStatus.SECOND_VOICE].includes(status);
    if (requiresFollowUp && (!followUpDate || !notes)) return alert("Date and Notes required for follow-ups");

    // Determine payload owner
    let finalAgentName = user!.name;
    let finalAgentEmail = user!.email;

    // If Admin is transferring
    if (adminEditId && user?.role === Role.ADMIN && assigneeEmail) {
        const assignedUser = teamMembers.find(m => m.email === assigneeEmail);
        if (assignedUser) {
            finalAgentName = assignedUser.name;
            finalAgentEmail = assignedUser.email;
        }
    }

    const payload = {
        agentName: finalAgentName,
        agentEmail: finalAgentEmail,
        clientName,
        phone,
        description: notes,
        leadStatus: status,
        callType: type,
        followUpDate: followUpDate || '',
        followUpTime: followUpTime || '',
        isCompleted: [LeadStatus.NOT_INTERESTED, LeadStatus.PAID].includes(status),
        secondVoiceRequested: status === LeadStatus.SECOND_VOICE
    };

    try {
        if (adminEditId) {
            await updateLog(adminEditId, payload);
            setAdminEditId(null);
            setAssigneeEmail('');
        } else {
            await saveLog(payload);
            if (status === LeadStatus.PAID) confetti();
        }
        setPhone(''); setClientName(''); setNotes(''); setStatus(LeadStatus.NEW_PROSPECT);
        fetchLogs();
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleRefineNotes = async () => {
    if (!notes) return;
    const p = await refineNotes(notes);
    setNotes(p);
  };

  const loadTeam = async () => {
    const t = await getAllUsers();
    setTeamMembers(t);
  };

  useEffect(() => {
    // Admin needs team list for dropdown in analytics even if modal closed
    if (user?.role === Role.ADMIN) loadTeam();
  }, [user]);

  const handleAddOrUpdateUser = async () => {
      if (!newMemberEmail || !newMemberName) return;
      try {
          if (editingTeamUser) {
             await adminUpdateUser(editingTeamUser, { name: newMemberName, role: newMemberRole });
          } else {
             await createUser({ name: newMemberName, email: newMemberEmail, role: newMemberRole });
          }
          setEditingTeamUser(null);
          setNewMemberEmail(''); setNewMemberName('');
          loadTeam();
      } catch (e: any) {
          alert(e.message);
      }
  };

  const loadKnowledge = async () => {
      const k = await getCompanyKnowledge();
      setKnowledge(k);
  };
  
  useEffect(() => {
      if (knowledgeModalOpen) loadKnowledge();
  }, [knowledgeModalOpen]);

  const handleUpdateLogWrapper = async (id: string, updates: any) => {
    await updateLogStatus(id, updates);
    fetchLogs();
  };

  // Hot Leads Logic
  const hotLeads = useMemo(() => {
     return analyticsLogs.filter(l => 
        (l.leadStatus === LeadStatus.SECOND_VOICE || l.leadStatus === LeadStatus.FOLLOW_UP) &&
        !l.isCompleted &&
        differenceInDays(parseISO(l.followUpDate), new Date()) <= 3 &&
        differenceInDays(parseISO(l.followUpDate), new Date()) >= -1
     ).slice(0, 5);
  }, [analyticsLogs]);

  // Cold Leads Logic
  const coldLeads = useMemo(() => {
     return analyticsLogs.filter(l => 
        l.leadStatus === LeadStatus.NEW_PROSPECT &&
        differenceInDays(new Date(), new Date(l.createdAt)) > 5
     ).length;
  }, [analyticsLogs]);

  if (!user) return <AuthScreen onLogin={setUser} />;
  if (showLeaderboard) return <LeaderboardScreen onComplete={() => setShowLeaderboard(false)} />;

  const filtered = logs.filter(l => 
    (l.clientName.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)) &&
    (filterStatus === 'All' || l.leadStatus === filterStatus)
  );
  
  const todayLogs = logs.filter(l => isToday(parseISO(l.followUpDate)) && !l.isCompleted);
  const missedLeads = logs.filter(l => isBefore(parseISO(l.followUpDate), startOfToday()) && !l.isCompleted);

  // Notifications Array
  const allNotifications = [
    ...missedLeads.map(l => ({ type: 'Missed', data: l, priority: 1 })),
    ...todayLogs.map(l => ({ type: 'Today', data: l, priority: 2 })),
    ...hotLeads.map(l => ({ type: 'Hot', data: l, priority: 3 }))
  ].sort((a,b) => a.priority - b.priority);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       {/* HEADER - FIXED Z-INDEX LAYERING FOR NOTIFICATIONS */}
       <div className="relative z-50">
           <header className="bg-slate-900 text-white pt-8 pb-24 px-6 shadow-3d relative">
             <div className="max-w-5xl mx-auto flex justify-between items-center relative z-20">
               <div className="flex items-center gap-4">
                   {/* NOTIFICATION CENTER (TOP LEFT) */}
                   <div className="relative">
                      <button 
                        onClick={() => setNotificationOpen(!notificationOpen)} 
                        className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 relative transition-all active:scale-95"
                      >
                         <Bell size={24} className="text-white"/>
                         {allNotifications.length > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                         )}
                      </button>
                      {notificationOpen && (
                         <div className="absolute top-14 left-0 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 z-[100] text-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                               <h4 className="font-bold text-sm text-slate-700">Notifications</h4>
                               <span className="text-xs bg-slate-200 px-2 py-1 rounded-full font-bold">{allNotifications.length}</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                               {allNotifications.length === 0 ? (
                                  <p className="p-8 text-center text-sm text-slate-400 font-medium">All caught up! 🎉</p>
                               ) : (
                                  allNotifications.map((n, i) => (
                                     <div 
                                        key={i} 
                                        onClick={() => { setSelectedLead(n.data); setNotificationOpen(false); }}
                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 items-start ${n.type === 'Missed' ? 'bg-rose-50/50' : ''}`}
                                     >
                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'Missed' ? 'bg-rose-500' : n.type === 'Hot' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                                        <div>
                                           <p className="font-bold text-sm text-slate-800">{n.data.clientName}</p>
                                           <p className="text-xs text-slate-500 font-medium mt-0.5">{n.type === 'Missed' ? `Missed: ${n.data.followUpDate}` : n.type === 'Hot' ? '🔥 Hot Lead Detected' : '📅 Scheduled Today'}</p>
                                        </div>
                                     </div>
                                  ))
                               )}
                            </div>
                         </div>
                      )}
                   </div>

                   {/* PROFILE */}
                   <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setProfileModalOpen(true)}>
                      <img src={user.photoURL} className="w-14 h-14 rounded-full border-2 border-indigo-400 bg-slate-800 object-cover group-hover:scale-105 transition-transform" />
                      <div>
                         <h1 className="text-2xl font-black tracking-tight">Follow Up</h1>
                         <p className="text-slate-400 text-sm font-medium">{user.name} ({user.role})</p>
                      </div>
                   </div>
               </div>
               
               <div className="flex gap-2">
                  {missedLeads.length > 0 && <Button3D variant="danger" icon={FileWarning} onClick={() => setMissedLeadsModalOpen(true)}>{missedLeads.length}</Button3D>}
                  {user.role === Role.ADMIN && (
                    <>
                      <Button3D variant="primary" icon={BrainCircuit} onClick={() => setKnowledgeModalOpen(true)}>AI Brain</Button3D>
                      <Button3D variant="secondary" icon={Shield} onClick={() => setTeamModalOpen(true)}>Team</Button3D>
                    </>
                  )}
                  <Button3D variant="ghost" onClick={() => { logoutUser(); setUser(null); }}><LogOut size={20}/></Button3D>
               </div>
             </div>
             
             {/* Background Decoration */}
             <div className="absolute inset-0 bg-slate-900 z-0"></div>
           </header>
       </div>

       <main className="max-w-5xl mx-auto px-6 -mt-16 relative z-10">
          <div className="flex gap-4 mb-6 overflow-x-auto py-2 no-scrollbar">
             {[
               {id: 'home', label: 'Dashboard', icon: LayoutDashboard},
               {id: 'leads', label: 'All Leads', icon: Users},
               {id: 'analytics', label: 'Analytics', icon: BarChart3},
               {id: 'market', label: 'Market Intel', icon: Globe}
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => setActiveTab(t.id as any)}
                 className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${activeTab === t.id ? 'bg-white text-slate-900 ring-2 ring-indigo-500 translate-y-[-2px]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
               >
                 <t.icon size={18}/> {t.label}
               </button>
             ))}
          </div>

          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card3D className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white border-indigo-900">
                  <div className="flex gap-4 items-start">
                     <Bot size={32} className="text-indigo-200" />
                     <div>
                       <h3 className="font-bold text-lg mb-1">Daily Briefing</h3>
                       <p className="text-indigo-100 text-sm leading-relaxed">{dailyBriefing || "Loading insights..."}</p>
                     </div>
                  </div>
               </Card3D>

               <section>
                 <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><Clock className="text-indigo-600"/> Today's Focus</h2>
                 <div className="flex gap-4 overflow-x-auto py-4 -mx-2 px-2 no-scrollbar">
                    {todayLogs.map(log => (
                       <Card3D key={log.id} className="min-w-[280px] border-l-8 border-l-indigo-500" onClick={() => setSelectedLead(log)}>
                          <h3 className="font-bold text-lg">{log.clientName}</h3>
                          <p className="text-sm text-slate-500">{log.followUpTime} • {log.phone}</p>
                       </Card3D>
                    ))}
                    {todayLogs.length === 0 && <div className="w-full p-8 text-center border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold">All Clear!</div>}
                 </div>
               </section>

               <Card3D className="border-t-8 border-t-emerald-500">
                  <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><PlusCircle className="text-emerald-600"/> Lead Entry {adminEditId && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded">EDIT MODE</span>}</h2>
                  
                  {/* LIVE PHONE CHECK WARNING */}
                  {existingLeadCheck && !adminEditId && (
                     <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-xl animate-in slide-in-from-left-2">
                        <div className="flex items-center gap-2 text-rose-800 font-bold">
                           <AlertOctagon size={20}/>
                           Duplicate Lead Detected!
                        </div>
                        <p className="text-sm text-rose-700 mt-1">
                           This phone number is already managed by <span className="font-black underline">{existingLeadCheck.agentName}</span>.
                        </p>
                        <p className="text-xs text-rose-600 mt-1">Please contact Admin to transfer.</p>
                     </div>
                  )}

                  {/* ADMIN LEAD TRANSFER DROPDOWN (Only visible in edit mode for admin) */}
                  {user.role === Role.ADMIN && adminEditId && (
                    <div className="mb-4 bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                         <div className="flex items-center gap-2 mb-2">
                             <Shuffle size={16} className="text-indigo-600"/>
                             <label className="text-sm font-bold text-indigo-900">Transfer/Assign Agent</label>
                         </div>
                         <select 
                            className="w-full p-2 rounded-lg border border-indigo-300 font-bold text-sm"
                            value={assigneeEmail}
                            onChange={(e) => setAssigneeEmail(e.target.value)}
                         >
                            <option value="">-- Keep Current Owner --</option>
                            {teamMembers.map(m => <option key={m.email} value={m.email}>{m.name} ({m.email})</option>)}
                         </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <Input3D label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                     <Input3D label="Name" value={clientName} onChange={e => setClientName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <Select3D label="Stage" options={Object.values(LeadStatus).map(s => ({label:s, value:s}))} value={status} onChange={e => setStatus(e.target.value as any)} />
                     <Select3D label="Type" options={Object.values(CallType).map(s => ({label:s, value:s}))} value={type} onChange={e => setType(e.target.value as any)} />
                  </div>
                  <div className="mb-4">
                     <label className="text-sm font-bold text-slate-700 flex justify-between">Notes <button onClick={handleRefineNotes} className="text-indigo-600 text-xs flex items-center gap-1"><Sparkles size={10}/> AI Polish</button></label>
                     <textarea className="w-full border-2 border-slate-300 rounded-xl p-3 h-20" value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  {[LeadStatus.NEW_PROSPECT, LeadStatus.FOLLOW_UP, LeadStatus.SECOND_VOICE].includes(status) && (
                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 rounded-xl border-2 border-slate-100">
                       <Input3D type="date" label="Next Date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="mb-0" />
                       <Input3D type="time" label="Time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} className="mb-0" />
                    </div>
                  )}
                  <Button3D className="w-full" onClick={handleSaveLog} disabled={!!existingLeadCheck && !adminEditId}>
                    {adminEditId ? "Update Lead" : existingLeadCheck ? "Duplicate Locked" : "Save Lead"}
                  </Button3D>
               </Card3D>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex gap-4 mb-4">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-3 text-slate-400" />
                   <input type="text" className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 font-bold" placeholder="Search leads by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
                 <select className="px-4 py-3 rounded-xl border-2 border-slate-200 font-bold bg-white text-slate-700 cursor-pointer" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                   <option value="All">All Statuses</option>
                   {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>

               <div className="space-y-3">
                  {filtered.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 font-bold bg-white rounded-2xl border-2 border-dashed border-slate-200">
                          No leads found matching your criteria.
                      </div>
                  ) : filtered.map(log => (
                     <div 
                        key={log.id} 
                        onClick={() => setSelectedLead(log)} 
                        className="bg-white rounded-xl border-2 border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center overflow-hidden"
                     >
                        {/* COLOR STRIP */}
                        <div className={`h-2 md:h-auto md:w-2 self-stretch ${
                            log.leadStatus === LeadStatus.PAID ? 'bg-emerald-500' :
                            log.leadStatus === LeadStatus.NOT_INTERESTED ? 'bg-slate-300' :
                            log.leadStatus === LeadStatus.NEW_PROSPECT ? 'bg-blue-400' :
                            log.leadStatus === LeadStatus.SECOND_VOICE ? 'bg-purple-500' :
                            'bg-amber-400'
                        }`}></div>

                        <div className="p-4 flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            {/* INFO */}
                            <div className="md:col-span-4">
                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-700">{log.clientName}</h3>
                                <p className="text-slate-500 text-sm font-medium flex items-center gap-2"><Phone size={12}/> {log.phone}</p>
                            </div>

                            {/* STATUS & AGENT */}
                            <div className="md:col-span-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                    log.leadStatus === LeadStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                                    log.leadStatus === LeadStatus.NOT_INTERESTED ? 'bg-slate-100 text-slate-600' :
                                    'bg-indigo-50 text-indigo-700'
                                }`}>
                                    {log.leadStatus}
                                </span>
                                {user.role === Role.ADMIN && (
                                   <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                      <UserIcon size={10}/> {log.agentName}
                                   </span>
                                )}
                            </div>

                            {/* DATE & ACTIONS */}
                            <div className="md:col-span-4 flex justify-between items-center">
                                <div className="text-right">
                                   <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Next Action</p>
                                   <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                      {log.isCompleted ? <CheckCircle2 size={14} className="text-emerald-500"/> : <CalendarClock size={14} className="text-amber-500"/>}
                                      {log.isCompleted ? 'Completed' : log.followUpDate || 'No Date'}
                                   </p>
                                </div>
                                {user.role === Role.ADMIN && (
                                   <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); setAdminEditId(log.id); setPhone(log.phone); setClientName(log.clientName); setNotes(log.description); setActiveTab('home'); }} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"><Pencil size={18}/></button>
                                      <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteLog(log.id).then(fetchLogs); }} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg"><Trash2 size={18}/></button>
                                   </div>
                                )}
                            </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'analytics' && (
             <div className="animate-in fade-in duration-300">
                {/* ... existing analytics code ... */}
                {/* ADMIN INSPECTOR DROPDOWN */}
                {user.role === Role.ADMIN && (
                  <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm">
                     <div className="flex items-center gap-2">
                        <Shield className="text-indigo-600"/>
                        <span className="font-bold text-slate-700">Inspector Mode:</span>
                     </div>
                     <select 
                       className="bg-slate-100 border-2 border-slate-200 text-slate-900 font-bold px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                       value={selectedAgentEmail}
                       onChange={e => setSelectedAgentEmail(e.target.value)}
                     >
                        <option value="ALL">Global Team Overview</option>
                        {teamMembers.map(m => <option key={m.email} value={m.email}>{m.name}</option>)}
                     </select>
                  </div>
                )}

                {/* DASHBOARD */}
                <Card3D className="bg-slate-900 border-slate-950 text-white mb-6 p-8 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                     {/* HEALTH GAUGE */}
                     <div className="relative w-40 h-24 flex items-end justify-center shrink-0">
                        <div className="absolute w-40 h-20 bg-slate-800 rounded-t-full top-0 overflow-hidden">
                          <div className="w-full h-full origin-bottom transition-all duration-1000 ease-out" 
                               style={{ transform: `rotate(${(analysis?.healthScore || 0) * 1.8 - 180}deg)`, background: 'conic-gradient(from 180deg, #ef4444 0deg, #eab308 90deg, #22c55e 180deg)' }}></div>
                        </div>
                        <div className="absolute w-32 h-16 bg-slate-900 rounded-t-full bottom-0 flex items-end justify-center pb-2">
                           <span className="text-3xl font-black">{analysis?.healthScore || 0}</span>
                        </div>
                        <p className="absolute -bottom-8 text-xs font-bold text-slate-400 uppercase">Health Score</p>
                     </div>

                     {/* AI COACH TEXT */}
                     <div className="flex-1">
                        <h3 className="flex items-center gap-2 font-bold text-indigo-400 mb-2">
                            <Bot size={16}/> 
                            {selectedAgentEmail === 'ALL' ? 'Team Performance Coach' : 'Agent Performance Review'}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{analysis?.review || 'Analyzing workflow data...'}"</p>
                        
                        <div className="flex gap-4 mt-4">
                           <div className="text-xs">
                             <p className="font-bold text-emerald-400 mb-1">Strengths</p>
                             {analysis?.strengths.map(s => <p key={s} className="text-slate-400">• {s}</p>)}
                           </div>
                           <div className="text-xs">
                             <p className="font-bold text-rose-400 mb-1">Weaknesses</p>
                             {analysis?.weaknesses.map(w => <p key={w} className="text-slate-400">• {w}</p>)}
                           </div>
                        </div>
                     </div>
                  </div>
                </Card3D>

                {/* FUNNEL & METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   <Card3D className="bg-white">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Filter size={18}/> Conversion Funnel</h3>
                      <div className="space-y-2">
                         <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full bg-slate-200" style={{width: '100%'}}></div>
                            <span className="relative z-10 font-bold text-sm text-slate-600">Total Leads</span>
                            <span className="relative z-10 font-black">{analyticsLogs.length}</span>
                         </div>
                         <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center relative overflow-hidden mx-4">
                            <div className="absolute left-0 top-0 h-full bg-indigo-200" style={{width: `${(analyticsLogs.filter(l => l.leadStatus !== LeadStatus.NEW_PROSPECT).length / (analyticsLogs.length || 1)) * 100}%`}}></div>
                            <span className="relative z-10 font-bold text-sm text-indigo-800">Engaged</span>
                            <span className="relative z-10 font-black text-indigo-900">{analyticsLogs.filter(l => l.leadStatus !== LeadStatus.NEW_PROSPECT).length}</span>
                         </div>
                         <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center relative overflow-hidden mx-8">
                            <div className="absolute left-0 top-0 h-full bg-emerald-300" style={{width: `${(analyticsLogs.filter(l => l.leadStatus === LeadStatus.PAID).length / (analyticsLogs.length || 1)) * 100}%`}}></div>
                            <span className="relative z-10 font-bold text-sm text-emerald-800">PAID</span>
                            <span className="relative z-10 font-black text-emerald-900">{analyticsLogs.filter(l => l.leadStatus === LeadStatus.PAID).length}</span>
                         </div>
                      </div>
                   </Card3D>
                   
                   <div className="grid grid-rows-2 grid-cols-2 gap-4">
                      {/* REAL METRICS NOW */}
                      <Card3D className="bg-emerald-50 border-emerald-200 p-3 flex flex-col justify-center">
                         <p className="text-xs font-bold text-emerald-600 uppercase">Conversion Rate</p>
                         <p className="text-2xl font-black text-emerald-800">
                           {analyticsLogs.length > 0 ? Math.round((analyticsLogs.filter(l => l.leadStatus === LeadStatus.PAID).length / analyticsLogs.length) * 100) : 0}%
                         </p>
                      </Card3D>
                      <Card3D className="bg-indigo-50 border-indigo-200 p-3 flex flex-col justify-center">
                         <p className="text-xs font-bold text-indigo-600 uppercase">Pipeline Vol</p>
                         <p className="text-2xl font-black text-indigo-800">
                           {analyticsLogs.filter(l => [LeadStatus.NEW_PROSPECT, LeadStatus.FOLLOW_UP, LeadStatus.SECOND_VOICE].includes(l.leadStatus)).length}
                         </p>
                      </Card3D>
                      <Card3D className="bg-rose-50 border-rose-200 p-3 flex flex-col justify-center">
                         <p className="text-xs font-bold text-rose-600 uppercase">Lost Opp.</p>
                         <p className="text-2xl font-black text-rose-800">
                           {analyticsLogs.length > 0 ? Math.round((analyticsLogs.filter(l => l.leadStatus === LeadStatus.NOT_INTERESTED).length / analyticsLogs.length) * 100) : 0}%
                         </p>
                      </Card3D>
                       <Card3D className="bg-amber-50 border-amber-200 p-3 flex flex-col justify-center">
                         <p className="text-xs font-bold text-amber-600 uppercase">Money on Table</p>
                         <p className="text-2xl font-black text-amber-800">
                            {analyticsLogs.filter(l => l.leadStatus === LeadStatus.NEW_PROSPECT && differenceInDays(new Date(), new Date(l.createdAt)) > 3).length}
                            <span className="text-xs font-medium text-amber-600 ml-1">stalled</span>
                         </p>
                      </Card3D>
                   </div>
                </div>

                {/* AGENT DEEP DIVE SECTION */}
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><ArrowRight/> Workflow Deep Dive</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                   {/* HOT LEADS RADAR */}
                   <Card3D className="border-t-4 border-t-emerald-500">
                      <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2"><ThermometerSun size={18}/> Hot Radar</h4>
                      {hotLeads.length > 0 ? (
                        <div className="space-y-3">
                           {hotLeads.map(l => (
                              <div key={l.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => setSelectedLead(l)}>
                                 <p className="font-bold text-sm text-slate-800">{l.clientName}</p>
                                 <p className="text-xs text-emerald-600 flex justify-between">
                                    <span>{l.leadStatus}</span>
                                    <span>{l.followUpDate}</span>
                                 </p>
                              </div>
                           ))}
                        </div>
                      ) : <p className="text-sm text-slate-400 italic">No super-hot leads detected.</p>}
                   </Card3D>

                   {/* COLD STORAGE */}
                   <Card3D className="border-t-4 border-t-cyan-500">
                      <h4 className="font-bold text-cyan-700 mb-3 flex items-center gap-2"><Snowflake size={18}/> Cold Storage</h4>
                      <div className="text-center py-6">
                         <p className="text-4xl font-black text-slate-300">{coldLeads}</p>
                         <p className="text-sm text-slate-500 font-bold mt-2">Leads untouched > 5 days</p>
                         <p className="text-xs text-slate-400 mt-1">Recommendation: Bulk SMS or Re-assign.</p>
                      </div>
                   </Card3D>

                   {/* UPCOMING PIPELINE */}
                   <Card3D className="border-t-4 border-t-indigo-500">
                      <h4 className="font-bold text-indigo-700 mb-3 flex items-center gap-2"><Calendar size={18}/> Upcoming Pipeline</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {analyticsLogs.filter(l => !l.isCompleted && isBefore(new Date(), parseISO(l.followUpDate))).slice(0, 5).map(l => (
                           <div key={l.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                              <span className="font-medium text-slate-600">{l.clientName}</span>
                              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold">{l.followUpDate}</span>
                           </div>
                        ))}
                        {analyticsLogs.filter(l => !l.isCompleted && isBefore(new Date(), parseISO(l.followUpDate))).length === 0 && (
                           <p className="text-sm text-slate-400 italic">Pipeline is empty.</p>
                        )}
                      </div>
                   </Card3D>
                </div>

                {/* ROSTER TABLE (ONLY WHEN VIEWING ALL) */}
                {selectedAgentEmail === 'ALL' && (
                  <Card3D>
                     <h3 className="font-bold text-slate-900 mb-4">Team Roster Stats</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                              <tr>
                                 <th className="px-4 py-3">Agent</th>
                                 <th className="px-4 py-3">Role</th>
                                 <th className="px-4 py-3 text-right">Leads</th>
                                 <th className="px-4 py-3 text-right">Sales</th>
                                 <th className="px-4 py-3 text-right">Conv. Rate</th>
                              </tr>
                           </thead>
                           <tbody>
                              {teamMembers.map(m => {
                                 const mLogs = logs.filter(l => l.agentEmail === m.email);
                                 const mSales = mLogs.filter(l => l.leadStatus === LeadStatus.PAID).length;
                                 const mRate = mLogs.length ? Math.round((mSales / mLogs.length) * 100) : 0;
                                 
                                 return (
                                    <tr key={m.email} className="border-b border-slate-100 hover:bg-slate-50">
                                       <td className="px-4 py-3 font-bold text-slate-900">{m.name}</td>
                                       <td className="px-4 py-3 text-slate-500">{m.role}</td>
                                       <td className="px-4 py-3 text-right font-medium">{mLogs.length}</td>
                                       <td className="px-4 py-3 text-right font-bold text-emerald-600">{mSales}</td>
                                       <td className="px-4 py-3 text-right font-bold">{mRate}%</td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </Card3D>
                )}
             </div>
          )}

          {activeTab === 'market' && (
             <div className="animate-in fade-in duration-300 space-y-6">
                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-3d mb-6 flex justify-between items-center">
                   <div>
                     <h2 className="text-2xl font-black flex items-center gap-2"><Globe className="text-emerald-400"/> Indian Market Intel</h2>
                     <p className="text-slate-400 text-sm">Real-time updates powered by Google Search</p>
                   </div>
                   {loadingMarket && <div className="animate-spin text-emerald-400"><RefreshCw/></div>}
                </div>

                {loadingMarket && !marketIntel ? (
                   <div className="text-center py-20 text-slate-400 font-bold">Scanning BSE/NSE Data...</div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* TODAY */}
                      <Card3D className="bg-white border-l-8 border-l-rose-500">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Zap className="text-rose-500"/> Today's Headlines</h3>
                         <ul className="space-y-3">
                            {marketIntel?.today?.map((item, i) => (
                               <li key={i} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                                  {item}
                                  <button className="block text-xs font-bold text-indigo-600 mt-1 hover:underline" onClick={() => getMarketDeepDive(item).then(alert)}>Explain for Client</button>
                               </li>
                            ))}
                         </ul>
                      </Card3D>

                      {/* WEEKLY */}
                      <Card3D className="bg-white border-l-8 border-l-amber-500">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar className="text-amber-500"/> This Week</h3>
                         <ul className="space-y-3">
                            {marketIntel?.thisWeek?.map((item, i) => (
                               <li key={i} className="text-sm border-b border-slate-100 pb-2 last:border-0">{item}</li>
                            ))}
                         </ul>
                      </Card3D>

                      {/* MONTHLY */}
                      <Card3D className="bg-white border-l-8 border-l-indigo-500">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="text-indigo-500"/> Monthly Macro</h3>
                         <ul className="space-y-3">
                            {marketIntel?.thisMonth?.map((item, i) => (
                               <li key={i} className="text-sm border-b border-slate-100 pb-2 last:border-0">{item}</li>
                            ))}
                         </ul>
                      </Card3D>

                      {/* PREDICTIONS */}
                      <Card3D className="bg-slate-900 border-slate-950 text-white">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="text-emerald-400"/> Future Outlook (3-12M)</h3>
                         <ul className="space-y-3">
                            {marketIntel?.predictions?.map((item, i) => (
                               <li key={i} className="text-sm border-b border-slate-800 pb-2 last:border-0 text-slate-300">{item}</li>
                            ))}
                         </ul>
                      </Card3D>
                   </div>
                )}
             </div>
          )}
       </main>
       
       <SalesCopilot />

       {missedLeadsModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setMissedLeadsModalOpen(false)}>
            <Card3D className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold">Missed Leads</h2>
                 <button onClick={() => setMissedLeadsModalOpen(false)}><X/></button>
               </div>
               <div className="space-y-2">
                  {missedLeads.map(l => (
                     <div key={l.id} 
                          className="p-3 bg-rose-50 rounded border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors"
                          onClick={() => { setSelectedLead(l); setMissedLeadsModalOpen(false); }}>
                        <p className="font-bold">{l.clientName}</p>
                        <p className="text-xs text-rose-600">Due: {l.followUpDate}</p>
                     </div>
                  ))}
               </div>
            </Card3D>
         </div>
       )}

       {teamModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setTeamModalOpen(false)}>
           <Card3D className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black flex items-center gap-2"><Shield className="text-indigo-600"/> Team Management</h2>
                 <button onClick={() => setTeamModalOpen(false)}><X/></button>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
                 <h3 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2"><Info size={16}/> How to Invite Agents</h3>
                 <ol className="text-xs text-indigo-700 list-decimal ml-4 space-y-1 mb-3">
                    <li>Add their email below to authorize them.</li>
                    <li>Send them the link to this app.</li>
                    <li>Tell them to click <b>"First Time Setup"</b> and create their own password.</li>
                 </ol>
                 <Button3D variant="secondary" className="w-full text-xs py-2" icon={Copy} onClick={() => {
                    navigator.clipboard.writeText(`Welcome to the team!\n\n1. Go to: ${window.location.href}\n2. Click "First Time Setup"\n3. Enter your email and create a password.`);
                    alert("Invite message copied to clipboard!");
                 }}>Copy Invite Message</Button3D>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 mb-6">
                <h3 className="font-bold text-sm mb-3 uppercase text-slate-500">{editingTeamUser ? 'Edit Member' : 'Add New Member'}</h3>
                <div className="grid grid-cols-2 gap-4">
                   <Input3D label="Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                   <Input3D label="Email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} disabled={!!editingTeamUser} />
                </div>
                <Select3D label="Role" options={[{label:'Agent', value:Role.AGENT}, {label:'Admin', value:Role.ADMIN}]} value={newMemberRole} onChange={e => setNewMemberRole(e.target.value as any)} />
                <div className="flex gap-2">
                   <Button3D onClick={handleAddOrUpdateUser} className="flex-1">{editingTeamUser ? 'Update User' : 'Add Member'}</Button3D>
                   {editingTeamUser && <Button3D variant="ghost" onClick={() => { setEditingTeamUser(null); setNewMemberEmail(''); setNewMemberName(''); }}>Cancel</Button3D>}
                </div>
              </div>

              <div className="space-y-3">
                 <h3 className="font-bold text-sm text-slate-500 uppercase mb-2">Team Roster ({teamMembers.length})</h3>
                 {teamMembers.map(m => (
                    <div key={m.email} className="flex justify-between items-center p-3 bg-white border-2 border-slate-100 rounded-xl">
                       <div className="flex items-center gap-3">
                          <img src={m.photoURL} className="w-8 h-8 rounded-full bg-slate-100" />
                          <div>
                             <p className="font-bold text-sm">{m.name}</p>
                             <p className="text-xs text-slate-400">{m.email} • {m.role}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => { setEditingTeamUser(m.uid); setNewMemberEmail(m.email); setNewMemberName(m.name); setNewMemberRole(m.role); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"><Pencil size={16}/></button>
                          {m.email !== user.email && (
                             <button onClick={async () => { if(confirm(`Remove ${m.name}?`)) { await deleteUser(m.uid); loadTeam(); } }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={16}/></button>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </Card3D>
         </div>
       )}

       {knowledgeModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setKnowledgeModalOpen(false)}>
            <Card3D className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black flex items-center gap-2"><BrainCircuit className="text-indigo-600"/> AI Brain Configuration</h2>
                 <button onClick={() => setKnowledgeModalOpen(false)}><X/></button>
               </div>
               
               <div className="mb-8 bg-indigo-50 p-4 rounded-xl border-2 border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                     <BookOpen className="text-indigo-600" size={20}/>
                     <h3 className="font-bold text-indigo-900">Master Source Material (NotebookLM Style)</h3>
                  </div>
                  <p className="text-xs text-indigo-700 mb-3">
                     Paste your FULL product brochures, sales scripts, pricing PDFs, and training manuals here. 
                     The AI will read this entire block to answer questions and handle objections accurately.
                  </p>
                  <textarea 
                    className="w-full h-64 p-4 rounded-xl border-2 border-indigo-200 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                    placeholder="PASTE EVERYTHING HERE..."
                    value={knowledge?.masterDocumentText || ''}
                    onChange={e => setKnowledge(prev => prev ? {...prev, masterDocumentText: e.target.value} : null)}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <Input3D label="Product Name" value={knowledge?.productName || ''} onChange={e => setKnowledge(prev => prev ? {...prev, productName: e.target.value} : null)} />
                  <Input3D label="Pricing Structure" value={knowledge?.pricing || ''} onChange={e => setKnowledge(prev => prev ? {...prev, pricing: e.target.value} : null)} />
               </div>
               <div className="mb-4">
                  <label className="font-bold text-sm text-slate-700 mb-1 block">Unique Selling Points</label>
                  <textarea className="w-full border-2 border-slate-300 rounded-xl p-3 h-20" value={knowledge?.uniqueSellingPoints || ''} onChange={e => setKnowledge(prev => prev ? {...prev, uniqueSellingPoints: e.target.value} : null)} />
               </div>
               <div className="mb-6">
                  <label className="font-bold text-sm text-slate-700 mb-1 block">The "Golden Pitch"</label>
                  <textarea className="w-full border-2 border-slate-300 rounded-xl p-3 h-20" value={knowledge?.salesPitch || ''} onChange={e => setKnowledge(prev => prev ? {...prev, salesPitch: e.target.value} : null)} />
               </div>

               <Button3D className="w-full" onClick={() => { if(knowledge) { saveCompanyKnowledge(knowledge); setKnowledgeModalOpen(false); } }} icon={Save}>Save Knowledge Base</Button3D>
            </Card3D>
         </div>
       )}
       
       {selectedLead && (
           <LeadDetailsModal 
               lead={selectedLead} 
               logs={logs} 
               onClose={() => setSelectedLead(null)} 
               onUpdate={handleUpdateLogWrapper} 
           />
       )}
       
       {profileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setProfileModalOpen(false)}>
             <Card3D className="w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-black mb-4">Edit Profile</h2>
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-indigo-100 mb-4 relative group cursor-pointer" onClick={() => {
                    const url = prompt("Enter new Image URL (e.g. from Unsplash or DiceBear):", user.photoURL);
                    if(url) updateUserProfile(user.uid, { photoURL: url }).then(u => { if(u) setUser(u); });
                }}>
                   <img src={user.photoURL} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs">Change</div>
                </div>
                <Input3D label="Name" value={user.name} onChange={e => updateUserProfile(user.uid, { name: e.target.value }).then(u => { if(u) setUser(u); })} />
                <Button3D className="w-full mt-4" onClick={() => setProfileModalOpen(false)}>Close</Button3D>
             </Card3D>
          </div>
       )}

    </div>
  );
}