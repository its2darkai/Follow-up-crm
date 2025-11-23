
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Users, Search, PlusCircle, LogOut, Phone, Megaphone, Calendar, CheckCircle2,
  Clock, Briefcase, User as UserIcon, Filter, X, Trash2, Trophy, TrendingUp, Crown, BarChart3,
  AlertTriangle, FileWarning, ClipboardList, Settings, Camera, Pencil, Info, Shield, UserPlus,
  Percent, Activity, Sparkles, Bot, Medal, MessageSquare, Mail, Copy, Columns, List, Gauge,
  Zap, Sword, BrainCircuit, BookOpen, Save, RefreshCw, HelpCircle, LockKeyhole, Send, Minimize2, PhoneMissed
} from 'lucide-react';
import { format, isToday, isBefore, differenceInDays, isSameDay, isSameMonth, isSameWeek } from 'date-fns';
// @ts-ignore
import confetti from 'canvas-confetti';

import { User, Role, InteractionLog, LeadStatus, CallType, CompanyKnowledge } from './types';
import { 
  loginUser, registerUser, logoutUser, getCurrentUser, getLogs, checkPhoneExists, saveLog, 
  updateLogStatus, deleteLog, getAllUsers, updateUserProfile, updateLog, 
  createUser, deleteUser, adminUpdateUser, getCompanyKnowledge, saveCompanyKnowledge, ensureMasterAdmin, resetUserPassword, registerNewAdmin
} from './services/storage';
import { refineNotes, generateLeadInsights, AIInsights, generateDailyBriefing, generateMessageDraft, analyzeWinProbability, WinProbabilty, generateObjectionHandler, chatWithSalesAssistant, generateCallStrategy, CallStrategy, generateNoAnswerMessage } from './services/ai';
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 md:w-96 bg-white border-2 border-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-10 duration-300">
           {/* Header */}
           <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                 <Sparkles className="text-amber-400" size={20} />
                 <h3 className="font-bold">Sales Copilot</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-slate-800 p-1 rounded"><Minimize2 size={18}/></button>
           </div>
           
           {/* Chat Area */}
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

           {/* Input Area */}
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

// --- LEAD DETAILS COMPONENT ---
const LeadDetailsModal: React.FC<{ lead: InteractionLog, logs: InteractionLog[], onClose: () => void, onUpdate: (id: string, updates: any) => Promise<void> }> = ({ lead, logs, onClose, onUpdate }) => {
  const [callStrategy, setCallStrategy] = useState<CallStrategy | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  
  // No Answer Logic
  const [showNoAnswerUI, setShowNoAnswerUI] = useState(false);
  const [noAnswerMsg, setNoAnswerMsg] = useState('');
  const [regenIntent, setRegenIntent] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // Load Strategy on Mount
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6" onClick={onClose}>
      <Card3D className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-b-none sm:rounded-2xl animate-in slide-in-from-bottom-10 duration-300" onClick={(e) => e.stopPropagation()} noPadding>
          <div className="bg-slate-900 text-white p-6 sticky top-0 z-10 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-black">{lead.clientName}</h2>
                <p className="text-slate-400 flex items-center gap-2"><Phone size={14}/> {lead.phone} <span className="w-1 h-1 rounded-full bg-slate-600"></span> {lead.leadStatus}</p>
            </div>
            <button onClick={onClose} className="p-1 bg-slate-800 rounded hover:bg-slate-700"><X/></button>
          </div>

          <div className="p-6 space-y-6">
            {/* CALL PREP STRATEGY */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100 rounded-xl p-5 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-3 opacity-5"><BrainCircuit size={80} className="text-indigo-900"/></div>
                <div className="relative z-10">
                  <h3 className="font-black text-indigo-900 mb-3 flex items-center gap-2"><Sparkles size={18}/> Call Strategy Prep</h3>
                  
                  {loadingStrategy ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                        <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
                      </div>
                  ) : callStrategy ? (
                      <div className="space-y-4">
                        <div className="bg-white/80 p-3 rounded-lg border border-indigo-50">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Situation Recap</p>
                            <p className="text-slate-800 font-medium text-sm">{callStrategy.situationSummary}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/80 p-3 rounded-lg border border-indigo-50">
                              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Talking Points</p>
                              <ul className="list-disc ml-4 text-sm text-slate-700 space-y-1">
                                  {callStrategy.talkingPoints.map((tp, i) => <li key={i}>{tp}</li>)}
                              </ul>
                            </div>
                            <div className="bg-white/80 p-3 rounded-lg border border-indigo-50">
                              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Psychological Vibe</p>
                              <p className="text-slate-800 font-bold text-lg">{callStrategy.psychologicalVibe}</p>
                            </div>
                        </div>
                      </div>
                  ) : <p>Strategy unavailable.</p>}
                </div>
            </div>

            {/* HISTORY TIMELINE */}
            <div>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><List size={18}/> Interaction History</h3>
                <div className="space-y-0 relative border-l-2 border-slate-200 ml-3 pl-6 pb-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {logs.filter(l => l.phone === lead.phone).sort((a,b) => b.createdAt - a.createdAt).map((log, idx) => (
                      <div key={log.id} className="mb-6 relative">
                        <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx===0 ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-sm bg-slate-100 px-2 py-1 rounded text-slate-600">{log.leadStatus}</span>
                              <span className="text-xs text-slate-400 font-medium">{log.followUpDate}</span>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed">{log.description}</p>
                            <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">{log.agentName}</p>
                        </div>
                      </div>
                  ))}
                </div>
            </div>

            {/* NO ANSWER / ACTIONS */}
            <div className="border-t-2 border-slate-100 pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Button3D variant="success" icon={CheckCircle2} onClick={() => { onUpdate(lead.id, { leadStatus: LeadStatus.PAID, isCompleted: true }); onClose(); confetti(); }}>Mark PAID</Button3D>
                    <Button3D variant="danger" icon={X} onClick={() => { onUpdate(lead.id, { leadStatus: LeadStatus.NOT_INTERESTED, isCompleted: true }); onClose(); }}>Not Interested</Button3D>
                    <Button3D variant="secondary" icon={Megaphone} onClick={() => { onUpdate(lead.id, { leadStatus: LeadStatus.SECOND_VOICE, secondVoiceRequested: true }); onClose(); }}>Request 2nd Voice</Button3D>
                    <Button3D variant="secondary" icon={PhoneMissed} onClick={handleGenerateNoAnswer}>Client didn't pick up?</Button3D>
                </div>

                {showNoAnswerUI && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 animate-in fade-in zoom-in-95 duration-200">
                      <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><MessageSquare size={16}/> No Answer Strategy</h4>
                      
                      {generatingDraft ? (
                         <div className="p-4 text-center text-amber-600 font-bold animate-pulse">Analyzing history & drafting message...</div>
                      ) : (
                         <>
                           <textarea 
                              className="w-full p-3 rounded-lg border-2 border-amber-200 bg-white text-sm mb-3 focus:outline-none focus:border-amber-400"
                              rows={3}
                              value={noAnswerMsg}
                              onChange={(e) => setNoAnswerMsg(e.target.value)}
                           />
                           <div className="flex gap-2 mb-4">
                              <Button3D variant="primary" className="flex-1 py-2 text-sm" icon={Copy} onClick={() => { navigator.clipboard.writeText(noAnswerMsg); alert("Copied to clipboard!"); }}>Copy Message</Button3D>
                           </div>

                           <div className="flex gap-2 items-center border-t border-amber-200 pt-3">
                              <input 
                                type="text" 
                                placeholder="E.g. Offer 10% discount..." 
                                className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm"
                                value={regenIntent}
                                onChange={(e) => setRegenIntent(e.target.value)}
                              />
                              <button onClick={handleGenerateNoAnswer} className="text-xs font-bold bg-amber-200 text-amber-800 px-3 py-2 rounded-lg hover:bg-amber-300">
                                Regenerate
                              </button>
                           </div>
                         </>
                      )}
                  </div>
                )}
            </div>
          </div>
      </Card3D>
    </div>
  );
};


// --- MAIN APP ---
export default function FollowUpApp() {
  const [user, setUser] = useState<User | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  
  // Core Data
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'leads' | 'analytics'>('home');
  
  // UI States 
  const [dailyBriefing, setDailyBriefing] = useState('');
  const [phone, setPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.NEW_PROSPECT);
  const [type, setType] = useState<CallType>(CallType.WORK);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  
  // Modals
  const [selectedLead, setSelectedLead] = useState<InteractionLog | null>(null);
  const [missedLeadsModalOpen, setMissedLeadsModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [adminEditId, setAdminEditId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [filterStatus, setFilterStatus] = useState('All');

  // Team Management State
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Role>(Role.AGENT);
  const [editingTeamUser, setEditingTeamUser] = useState<string | null>(null);

  // Knowledge Base State
  const [knowledge, setKnowledge] = useState<CompanyKnowledge | null>(null);

  // Initialize
  useEffect(() => {
    // Only try to auto-login from cache, do NOT auto-seed silently anymore
    const current = getCurrentUser();
    if (current) setUser(current);
  }, []);

  // Fetch Data
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

  // --- HANDLERS ---

  const handleSaveLog = async () => {
    if (!phone || !clientName) return alert("Phone and Name required");
    
    const requiresFollowUp = [LeadStatus.NEW_PROSPECT, LeadStatus.FOLLOW_UP, LeadStatus.SECOND_VOICE].includes(status);
    if (requiresFollowUp && (!followUpDate || !notes)) return alert("Date and Notes required for follow-ups");

    const payload = {
        agentName: user!.name,
        agentEmail: user!.email,
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

    if (adminEditId) {
        await updateLog(adminEditId, payload);
        setAdminEditId(null);
    } else {
        await saveLog(payload);
        if (status === LeadStatus.PAID) confetti();
    }

    setPhone(''); setClientName(''); setNotes(''); setStatus(LeadStatus.NEW_PROSPECT);
    fetchLogs();
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
    if (teamModalOpen) loadTeam();
  }, [teamModalOpen]);

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

  // View Rendering
  if (!user) return <AuthScreen onLogin={setUser} />;
  if (showLeaderboard) return <LeaderboardScreen onComplete={() => setShowLeaderboard(false)} />;

  const filtered = logs.filter(l => 
    (l.clientName.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)) &&
    (filterStatus === 'All' || l.leadStatus === filterStatus)
  );
  
  const todayLogs = logs.filter(l => isToday(parseISO(l.followUpDate)) && !l.isCompleted);
  const missedLeads = logs.filter(l => isBefore(parseISO(l.followUpDate), startOfToday()) && !l.isCompleted);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       {/* HEADER */}
       <header className="bg-slate-900 text-white pt-8 pb-24 px-6 shadow-3d relative overflow-hidden">
         <div className="max-w-5xl mx-auto flex justify-between items-center relative z-10">
           <div className="flex items-center gap-4 cursor-pointer" onClick={() => setProfileModalOpen(true)}>
              <img src={user.photoURL} className="w-14 h-14 rounded-full border-2 border-indigo-400 bg-slate-800 object-cover" />
              <div>
                 <h1 className="text-2xl font-black">Follow Up</h1>
                 <p className="text-slate-400 text-sm">{user.name} ({user.role})</p>
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
       </header>

       <main className="max-w-5xl mx-auto px-6 -mt-16 relative z-20">
          {/* TABS */}
          <div className="flex gap-4 mb-6 overflow-x-auto py-2 no-scrollbar">
             {[
               {id: 'home', label: 'Dashboard', icon: LayoutDashboard},
               {id: 'leads', label: 'All Leads', icon: Users},
               {id: 'analytics', label: 'Analytics', icon: BarChart3}
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => setActiveTab(t.id as any)}
                 className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${activeTab === t.id ? 'bg-white text-slate-900 ring-2 ring-indigo-500' : 'bg-slate-800 text-slate-400'}`}
               >
                 <t.icon size={18}/> {t.label}
               </button>
             ))}
          </div>

          {activeTab === 'home' && (
            <div className="space-y-8">
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
                  <Button3D className="w-full" onClick={handleSaveLog}>{adminEditId ? "Update Lead" : "Save Lead"}</Button3D>
               </Card3D>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6">
               <div className="flex gap-4 mb-4">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-3 text-slate-400" />
                   <input type="text" className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 font-bold" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
                 <select className="px-4 py-3 rounded-xl border-2 border-slate-200 font-bold bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                   <option value="All">All Status</option>
                   {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>

               {filtered.map(log => (
                  <Card3D key={log.id} onClick={() => setSelectedLead(log)} className="flex justify-between items-center">
                     <div>
                       <h3 className="font-bold text-lg">{log.clientName}</h3>
                       <p className="text-sm text-slate-500">{log.phone} • {log.leadStatus}</p>
                     </div>
                     {user.role === Role.ADMIN && (
                       <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setAdminEditId(log.id); setPhone(log.phone); setClientName(log.clientName); setNotes(log.description); setActiveTab('home'); }} className="p-2 hover:bg-slate-100 rounded"><Pencil size={16} className="text-slate-400"/></button>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteLog(log.id).then(fetchLogs); }} className="p-2 hover:bg-rose-50 rounded"><Trash2 size={16} className="text-rose-400"/></button>
                       </div>
                     )}
                  </Card3D>
               ))}
            </div>
          )}

          {activeTab === 'analytics' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card3D className="bg-white">
                   <p className="text-xs font-bold text-slate-400 uppercase">Total Sales (Month)</p>
                   <p className="text-4xl font-black text-slate-900">{logs.filter(l => l.leadStatus === LeadStatus.PAID && isSameMonth(parseISO(l.followUpDate), new Date())).length}</p>
                </Card3D>
                <Card3D className="bg-white">
                   <p className="text-xs font-bold text-slate-400 uppercase">Calls (Today)</p>
                   <p className="text-4xl font-black text-indigo-600">{logs.filter(l => isToday(parseISO(l.followUpDate))).length}</p>
                </Card3D>
                <Card3D className="bg-white">
                   <p className="text-xs font-bold text-slate-400 uppercase">Pipeline</p>
                   <p className="text-4xl font-black text-emerald-600">{logs.filter(l => l.leadStatus === LeadStatus.NEW_PROSPECT).length}</p>
                </Card3D>
             </div>
          )}
       </main>
       
       {/* FLOATING SALES COPILOT */}
       <SalesCopilot />

       {/* MODALS */}
       
       {/* 1. MISSED LEADS */}
       {missedLeadsModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setMissedLeadsModalOpen(false)}>
            <Card3D className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold">Missed Leads</h2>
                 <button onClick={() => setMissedLeadsModalOpen(false)}><X/></button>
               </div>
               <div className="space-y-2">
                  {missedLeads.map(l => (
                     <div key={l.id} className="p-3 bg-rose-50 rounded border border-rose-100">
                        <p className="font-bold">{l.clientName}</p>
                        <p className="text-xs text-rose-600">Due: {l.followUpDate}</p>
                     </div>
                  ))}
               </div>
            </Card3D>
         </div>
       )}

       {/* 2. TEAM MANAGEMENT (ADMIN) */}
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

       {/* 3. KNOWLEDGE BASE (ADMIN) */}
       {knowledgeModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setKnowledgeModalOpen(false)}>
            <Card3D className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black flex items-center gap-2"><BrainCircuit className="text-indigo-600"/> AI Brain Configuration</h2>
                 <button onClick={() => setKnowledgeModalOpen(false)}><X/></button>
               </div>
               
               {/* MASTER DOCUMENT SECTION */}
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
       
       {/* 4. LEAD DETAILS / ACTION MODAL */}
       {selectedLead && (
           <LeadDetailsModal 
               lead={selectedLead} 
               logs={logs} 
               onClose={() => setSelectedLead(null)} 
               onUpdate={handleUpdateLogWrapper} 
           />
       )}
       
       {/* 5. PROFILE MODAL */}
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
