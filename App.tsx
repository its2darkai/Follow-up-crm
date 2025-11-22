
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, Search, PlusCircle, LogOut, Phone, Megaphone, Calendar, CheckCircle2,
  Clock, Briefcase, User as UserIcon, Filter, X, Trash2, Trophy, TrendingUp, Crown, BarChart3,
  AlertTriangle, FileWarning, ClipboardList, Settings, Camera, Pencil, Info, Shield, UserPlus,
  Percent, Activity, Sparkles, Bot, Medal, MessageSquare, Mail, Copy, Columns, List, Gauge,
  Zap, Sword, BrainCircuit, BookOpen, Save
} from 'lucide-react';
import { format, isToday, isBefore, differenceInDays, isSameDay, isSameMonth, isSameWeek } from 'date-fns';
// @ts-ignore
import confetti from 'canvas-confetti';

import { User, Role, InteractionLog, LeadStatus, CallType, CompanyKnowledge } from './types';
import { 
  loginUser, registerUser, logoutUser, getCurrentUser, getLogs, checkPhoneExists, saveLog, 
  seedData, updateLogStatus, deleteLog, getAllUsers, updateUserProfile, updateLog, 
  createUser, deleteUser, adminUpdateUser, getCompanyKnowledge, saveCompanyKnowledge
} from './services/storage';
import { refineNotes, generateLeadInsights, AIInsights, generateDailyBriefing, generateMessageDraft, analyzeWinProbability, WinProbabilty, generateObjectionHandler } from './services/ai';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let user;
      if (isLogin) {
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
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`flex-1 pb-2 font-bold text-sm ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
              onClick={() => setIsLogin(false)}
            >
              First Time Setup
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <Input3D label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input3D label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            
            {!isLogin && (
               <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium">
                 Note: Your email must be authorized by an Admin before you can register.
               </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <Button3D type="submit" className="w-full mt-2" loading={loading}>
              {isLogin ? 'Secure Login' : 'Create Account'}
            </Button3D>
          </form>
        </Card3D>
      </div>
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
    seedData();
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
              
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 mb-6">
                <h3 className="font-bold text-sm mb-3 uppercase text-slate-500">{editingTeamUser ? 'Edit Member' : 'Add New Member'}</h3>
                <div className="grid grid-cols-2 gap-4">
                   <Input3D label="Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                   <Input3D label="Email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} disabled={!!editingTeamUser} />
                </div>
                <Select3D label="Role" options={[{label:'Agent', value:Role.AGENT}, {label:'Admin', value:Role.ADMIN}]} value={newMemberRole} onChange={e => setNewMemberRole(e.target.value as any)} />
                <div className="flex gap-2">
                   <Button3D onClick={handleAddOrUpdateUser} className="flex-1">{editingTeamUser ? 'Update User' : 'Add to Team'}</Button3D>
                   {editingTeamUser && <Button3D variant="ghost" onClick={() => { setEditingTeamUser(null); setNewMemberName(''); setNewMemberEmail(''); }}>Cancel</Button3D>}
                </div>
              </div>

              <h3 className="font-bold text-sm mb-3 uppercase text-slate-500">Roster</h3>
              <div className="space-y-2">
                 {teamMembers.map(m => (
                    <div key={m.uid} className="flex items-center justify-between p-3 bg-white border-2 border-slate-100 rounded-xl">
                       <div className="flex items-center gap-3">
                          <img src={m.photoURL} className="w-10 h-10 rounded-full bg-slate-100" />
                          <div>
                             <p className="font-bold text-slate-900">{m.name} {m.uid === user.uid && <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded">YOU</span>}</p>
                             <p className="text-xs text-slate-500">{m.email} • {m.role}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => { setEditingTeamUser(m.uid); setNewMemberName(m.name); setNewMemberEmail(m.email); setNewMemberRole(m.role); }} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><Pencil size={16}/></button>
                          {m.uid !== user.uid && <button onClick={() => { if(confirm('Remove user?')) deleteUser(m.uid).then(loadTeam); }} className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200"><Trash2 size={16}/></button>}
                       </div>
                    </div>
                 ))}
              </div>
           </Card3D>
         </div>
       )}

       {/* 3. KNOWLEDGE BASE (BRAIN) */}
       {knowledgeModalOpen && knowledge && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setKnowledgeModalOpen(false)}>
            <Card3D className="w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black flex items-center gap-2"><BrainCircuit className="text-indigo-600"/> AI Brain Configuration</h2>
                 <button onClick={() => setKnowledgeModalOpen(false)}><X/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-100">
                     <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><BookOpen size={20}/> Master Source Material (NotebookLM Style)</h3>
                     <p className="text-sm text-indigo-700 mb-3">Paste your entire sales brochure, script, pricing PDF text, and product manual here. The AI will read this before answering ANY question.</p>
                     <textarea 
                       className="w-full h-64 border-2 border-indigo-200 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="Paste full text content here..."
                       value={knowledge.masterDocumentText}
                       onChange={e => setKnowledge({...knowledge, masterDocumentText: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <Input3D label="Product Name" value={knowledge.productName} onChange={e => setKnowledge({...knowledge, productName: e.target.value})} />
                     <Input3D label="Pricing Summary" value={knowledge.pricing} onChange={e => setKnowledge({...knowledge, pricing: e.target.value})} />
                  </div>
                  <div>
                     <label className="font-bold text-sm mb-1 block">The Golden Pitch</label>
                     <textarea className="w-full border-2 border-slate-300 rounded-xl p-3 h-24" value={knowledge.salesPitch} onChange={e => setKnowledge({...knowledge, salesPitch: e.target.value})} />
                  </div>
               </div>

               <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button3D onClick={async () => { await saveCompanyKnowledge(knowledge); setKnowledgeModalOpen(false); }} className="w-full" icon={Save}>Save Knowledge Base</Button3D>
               </div>
            </Card3D>
         </div>
       )}

       {/* 4. PROFILE MODAL */}
       {profileModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setProfileModalOpen(false)}>
            <Card3D className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black">My Profile</h2>
                 <button onClick={() => setProfileModalOpen(false)}><X/></button>
               </div>
               <div className="flex flex-col items-center mb-6">
                  <img src={user.photoURL} className="w-24 h-24 rounded-full border-4 border-slate-200 mb-4 object-cover" />
                  <Input3D label="Photo URL" value={user.photoURL || ''} onChange={e => setUser({...user, photoURL: e.target.value})} />
                  <p className="text-xs text-slate-400">Paste a direct image link (Imgur, etc.)</p>
               </div>
               <Input3D label="Display Name" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
               <Button3D onClick={async () => { await updateUserProfile(user.uid, { name: user.name, photoURL: user.photoURL }); setProfileModalOpen(false); }} className="w-full mt-4">Save Profile</Button3D>
            </Card3D>
         </div>
       )}

    </div>
  );
}
