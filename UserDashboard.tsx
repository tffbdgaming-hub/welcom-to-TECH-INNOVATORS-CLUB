import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Search, Bell, Users, Send, MessageSquare, 
  Download, Edit3, Loader2, Plus, Image as ImageIcon, Video, X
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserData, Notice, Comment, Group, KeyLog } from '../types';
import { generatePaski } from '../utils/helpers';
import { Link } from 'react-router-dom';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'paski' | 'search' | 'notices' | 'groups'>('paski');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [paski, setPaski] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<UserData[]>([]);

  useEffect(() => {
    // Listen for notices
    const unsubNotices = onSnapshot(collection(db, 'notices'), (s) => setNotices(s.docs.map(d => ({ ...d.data(), id: d.id } as Notice))));
    
    // Listen for user's groups
    if (user) {
      const qGroups = query(collection(db, 'groups'), where('memberIds', 'array-contains', user.id));
      const unsubGroups = onSnapshot(qGroups, (s) => setUserGroups(s.docs.map(d => ({ ...d.data(), id: d.id } as Group))));
      return () => { unsubNotices(); unsubGroups(); };
    }
    return () => unsubNotices();
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim() || groupMembers.length === 0) return;
    if (groupMembers.length > 3) { // 3 others + self = 4
      alert('গ্রুপে ৪ জনের বেশি মেম্বার রাখা যাবে না।');
      return;
    }

    const memberIds = [user.id, ...groupMembers.map(m => m.id)];
    await addDoc(collection(db, 'groups'), {
      name: newGroupName,
      memberIds,
      createdAt: Date.now()
    });
    
    setNewGroupName('');
    setGroupMembers([]);
    setShowCreateGroup(false);
    alert('গ্রুপ তৈরি হয়েছে!');
  };

  const handleGeneratePaski = async () => {
    if (!user) return;
    setLoading(true);
    const newPaski = generatePaski(12);
    setPaski(newPaski);
    
    // Log to admin
    await addDoc(collection(db, 'keyLogs'), {
      userId: user.id,
      userRole: user.role,
      userIdNumber: user.idNumber,
      paski: newPaski,
      timestamp: Date.now()
    });
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const qName = query(collection(db, 'users'), where('name', '==', searchQuery), where('status', '==', 'approved'));
      const qRole = query(collection(db, 'users'), where('role', '==', searchQuery), where('status', '==', 'approved'));
      const qSession = query(collection(db, 'users'), where('session', '==', searchQuery), where('status', '==', 'approved'));
      
      const [sName, sRole, sSession] = await Promise.all([getDocs(qName), getDocs(qRole), getDocs(qSession)]);
      const results = [...sName.docs, ...sRole.docs, ...sSession.docs].map(d => ({ ...d.data(), id: d.id } as UserData));
      
      // Remove duplicates
      const uniqueResults = results.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setSearchResults(uniqueResults);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!user || !updateText.trim()) return;
    await addDoc(collection(db, 'updateRequests'), {
      userId: user.id,
      requestedChanges: { updateNote: updateText }, // Simplified for demo
      status: 'pending',
      timestamp: Date.now()
    });
    setUpdateText('');
    alert('আপডেট রিকোয়েস্ট পাঠানো হয়েছে!');
  };

  const handleCommentSubmit = async (noticeId: string) => {
    if (!user || !commentText[noticeId]?.trim()) return;
    await addDoc(collection(db, 'comments'), {
      noticeId,
      userId: user.id,
      userName: user.name,
      userIdNumber: user.idNumber,
      text: commentText[noticeId],
      timestamp: Date.now()
    });
    setCommentText({ ...commentText, [noticeId]: '' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="md:col-span-1 space-y-2">
        <button onClick={() => setActiveTab('paski')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'paski' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <Key className="w-5 h-5" /> <span>পাসকি জেনারেট</span>
        </button>
        <button onClick={() => setActiveTab('search')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'search' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <Search className="w-5 h-5" /> <span>ডাটা সার্চ</span>
        </button>
        <button onClick={() => setActiveTab('notices')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'notices' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <Bell className="w-5 h-5" /> <span>নোটিশ বোর্ড</span>
        </button>
        <button onClick={() => setActiveTab('groups')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'groups' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <Users className="w-5 h-5" /> <span>গ্রুপ চ্যাট</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="md:col-span-3 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 min-h-[600px]">
        {activeTab === 'paski' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <h2 className="text-2xl font-bold text-center">ক্লাব চাবির পাসকি জেনারেট করুন</h2>
            <div className="w-64 h-64 border-4 border-dashed border-white/10 rounded-full flex items-center justify-center relative">
              {paski ? (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <p className="text-sm text-zinc-500 mb-2 uppercase tracking-widest">আপনার পাসকি</p>
                  <p className="text-3xl font-mono font-bold text-emerald-500">{paski}</p>
                </motion.div>
              ) : (
                <Key className="w-16 h-16 text-zinc-800" />
              )}
            </div>
            <button onClick={handleGeneratePaski} disabled={loading} className="bg-emerald-500 text-zinc-950 font-bold px-8 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center space-x-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span>নতুন পাসকি জেনারেট করুন</span>
            </button>
            <p className="text-zinc-500 text-sm max-w-xs text-center">প্রতিবার পাসকি জেনারেট করার সময় এটি এডমিন লগ-এ সেভ হবে।</p>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">ফাইন্ড ইওর ডাটা</h2>
            <div className="flex space-x-2">
              <input type="text" placeholder="নাম, সেশন বা রোল দিয়ে সার্চ দিন..." className="flex-1 bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button onClick={handleSearch} className="bg-emerald-500 text-zinc-950 font-bold px-6 py-2 rounded-xl hover:bg-emerald-400 transition-all flex items-center space-x-2">
                <Search className="w-5 h-5" /> <span>সার্চ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {searchResults.map(u => (
                <div key={u.id} className="bg-zinc-800/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">{u.name}</p>
                    <p className="text-sm text-zinc-400">রোল: {u.role} | সেশন: {u.session}</p>
                  </div>
                  <button onClick={() => setSelectedUser(u)} className="text-emerald-500 text-sm hover:underline">বিস্তারিত দেখুন</button>
                </div>
              ))}
            </div>

            {selectedUser && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-md w-full relative">
                  <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-100"><X className="w-6 h-6" /></button>
                  <h3 className="text-xl font-bold mb-4">{selectedUser.name}-এর তথ্য</h3>
                  <div className="space-y-2 text-sm text-zinc-400 mb-6">
                    <p>রোল: {selectedUser.role}</p>
                    <p>আইডি: {selectedUser.idNumber}</p>
                    <p>বাবার নাম: {selectedUser.fatherName}</p>
                    <p>মায়ের নাম: {selectedUser.motherName}</p>
                    <p>সেশন: {selectedUser.session}</p>
                    <p>ডিপার্টমেন্ট: {selectedUser.department}</p>
                  </div>
                  {selectedUser.id === user?.id && (
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      <p className="text-sm font-bold">তথ্য আপডেট রিকোয়েস্ট পাঠান</p>
                      <textarea placeholder="কি আপডেট করতে চান লিখুন..." className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={updateText} onChange={e => setUpdateText(e.target.value)} />
                      <button onClick={handleUpdateSubmit} className="w-full bg-emerald-500 text-zinc-950 font-bold py-2 rounded-xl hover:bg-emerald-400 transition-all">সাবমিট করুন</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold">ক্লাব নোটিশ বোর্ড</h2>
            {notices.map(n => (
              <div key={n.id} className="bg-zinc-800/50 border border-white/5 rounded-2xl overflow-hidden">
                {n.imageUrl && <img src={n.imageUrl} alt={n.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />}
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{n.title}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{n.content}</p>
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex space-x-2 mb-4">
                      <input type="text" placeholder="মন্তব্য লিখুন..." className="flex-1 bg-zinc-900 border border-white/5 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={commentText[n.id] || ''} onChange={e => setCommentText({...commentText, [n.id]: e.target.value})} />
                      <button onClick={() => handleCommentSubmit(n.id)} className="p-2 bg-emerald-500 text-zinc-950 rounded-xl hover:bg-emerald-400 transition-all"><Send className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">আপনার গ্রুপসমূহ</h2>
              <button 
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg hover:bg-emerald-400 transition-all"
              >
                <Plus className="w-4 h-4" /> <span>নতুন গ্রুপ</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {userGroups.map(g => (
                <Link key={g.id} to={`/group/${g.id}`} className="bg-zinc-800/50 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-zinc-800 transition-all">
                  <div>
                    <p className="font-bold">{g.name}</p>
                    <p className="text-xs text-zinc-500">{g.memberIds.length} জন মেম্বার</p>
                  </div>
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                </Link>
              ))}
              {userGroups.length === 0 && <p className="text-center text-zinc-500 mt-12">আপনি এখনো কোন গ্রুপে নেই।</p>}
            </div>

            {showCreateGroup && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-md w-full relative">
                  <button onClick={() => setShowCreateGroup(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-100"><X className="w-6 h-6" /></button>
                  <h3 className="text-xl font-bold mb-4">নতুন গ্রুপ খুলুন</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">গ্রুপের নাম</label>
                      <input type="text" className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">মেম্বার অ্যাড করুন (রোল দিয়ে সার্চ দিন)</label>
                      <div className="flex space-x-2 mb-2">
                        <input type="text" id="memberSearch" placeholder="রোল..." className="flex-1 bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button 
                          onClick={async () => {
                            const role = (document.getElementById('memberSearch') as HTMLInputElement).value;
                            if (!role) return;
                            const q = query(collection(db, 'users'), where('role', '==', role), where('status', '==', 'approved'));
                            const s = await getDocs(q);
                            const found = s.docs.map(d => ({ ...d.data(), id: d.id } as UserData));
                            if (found.length > 0 && !groupMembers.find(m => m.id === found[0].id) && found[0].id !== user?.id) {
                              setGroupMembers([...groupMembers, found[0]]);
                            }
                          }}
                          className="bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs"
                        >
                          অ্যাড
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {groupMembers.map(m => (
                          <div key={m.id} className="bg-white/5 px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                            <span>{m.name} ({m.role})</span>
                            <button onClick={() => setGroupMembers(groupMembers.filter(gm => gm.id !== m.id))}><X className="w-3 h-3 text-red-500" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={handleCreateGroup}
                      disabled={!newGroupName || groupMembers.length === 0}
                      className="w-full bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
                    >
                      গ্রুপ তৈরি করুন
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
