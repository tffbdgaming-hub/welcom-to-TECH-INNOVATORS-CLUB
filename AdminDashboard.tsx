import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserCheck, Bell, Database, Key, MessageSquare, 
  Check, X, Download, Trash2, FileText, Search
} from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, KeyLog, Notice, Comment, UpdateRequest } from '../types';
import { generateUserPDF, generateKeyLogsPDF } from '../utils/helpers';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'updates' | 'notices' | 'data' | 'keys' | 'comments'>('requests');
  const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [keyLogs, setKeyLogs] = useState<KeyLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', imageUrl: '' });

  useEffect(() => {
    // Listen for pending users
    const qPending = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsubPending = onSnapshot(qPending, (s) => setPendingUsers(s.docs.map(d => ({ ...d.data(), id: d.id } as UserData))));

    // Listen for update requests
    const unsubUpdates = onSnapshot(collection(db, 'updateRequests'), (s) => setUpdateRequests(s.docs.map(d => ({ ...d.data(), id: d.id } as UpdateRequest))));

    // Listen for all approved users
    const qAll = query(collection(db, 'users'), where('status', '==', 'approved'));
    const unsubAll = onSnapshot(qAll, (s) => setAllUsers(s.docs.map(d => ({ ...d.data(), id: d.id } as UserData))));

    // Listen for key logs
    const unsubKeys = onSnapshot(collection(db, 'keyLogs'), (s) => setKeyLogs(s.docs.map(d => ({ ...d.data(), id: d.id } as KeyLog))));

    // Listen for comments
    const unsubComments = onSnapshot(collection(db, 'comments'), (s) => setComments(s.docs.map(d => ({ ...d.data(), id: d.id } as Comment))));

    return () => {
      unsubPending(); unsubUpdates(); unsubAll(); unsubKeys(); unsubComments();
    };
  }, []);

  const handleApproveUser = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { status: 'approved' });
  };

  const handleRejectUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'notices'), { ...newNotice, timestamp: Date.now() });
    setNewNotice({ title: '', content: '', imageUrl: '' });
    alert('নোটিশ পাবলিশ করা হয়েছে!');
  };

  const handleApproveUpdate = async (req: UpdateRequest) => {
    await updateDoc(doc(db, 'users', req.userId), { ...req.requestedChanges });
    await updateDoc(doc(db, 'updateRequests', req.id), { status: 'approved' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="md:col-span-1 space-y-2">
        <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'requests' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <UserCheck className="w-5 h-5" /> <span>অ্যাকাউন্ট রিকোয়েস্ট</span>
        </button>
        <button onClick={() => setActiveTab('updates')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'updates' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <FileText className="w-5 h-5" /> <span>তথ্য আপডেট</span>
        </button>
        <button onClick={() => setActiveTab('notices')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'notices' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <Bell className="w-5 h-5" /> <span>নোটিশ পাবলিশ</span>
        </button>
        <button onClick={() => setActiveTab('data')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'data' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <Database className="w-5 h-5" /> <span>ইউজার ডাটা</span>
        </button>
        <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'keys' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <Key className="w-5 h-5" /> <span>চাবি ম্যানেজমেন্ট</span>
        </button>
        <button onClick={() => setActiveTab('comments')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'comments' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'hover:bg-white/5 text-zinc-400'}`}>
          <MessageSquare className="w-5 h-5" /> <span>মন্তব্যসমূহ</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="md:col-span-3 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 min-h-[600px]">
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">অ্যাকাউন্ট তৈরির রিকোয়েস্ট ({pendingUsers.length})</h2>
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-zinc-800/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{u.name}</p>
                  <p className="text-sm text-zinc-400">রোল: {u.role} | আইডি: {u.idNumber}</p>
                  <p className="text-xs text-zinc-500">সেশন: {u.session} | ডিপার্টমেন্ট: {u.department}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleApproveUser(u.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-zinc-950 transition-all">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleRejectUser(u.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {pendingUsers.length === 0 && <p className="text-center text-zinc-500 mt-12">কোন রিকোয়েস্ট নেই।</p>}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">তথ্য আপডেট রিকোয়েস্ট ({updateRequests.length})</h2>
            {updateRequests.map(req => (
              <div key={req.id} className="bg-zinc-800/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-emerald-500">ইউজার আইডি: {req.userId}</p>
                  <p className="text-sm text-zinc-400">অনুরোধ: {JSON.stringify(req.requestedChanges)}</p>
                  <p className="text-xs text-zinc-500">সময়: {new Date(req.timestamp).toLocaleString()}</p>
                </div>
                {req.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button onClick={() => handleApproveUpdate(req)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-zinc-950 transition-all">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={async () => await updateDoc(doc(db, 'updateRequests', req.id), { status: 'rejected' })} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {req.status !== 'pending' && (
                  <span className={`text-xs px-2 py-1 rounded-full ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                    {req.status === 'approved' ? 'গৃহীত' : 'বাতিল'}
                  </span>
                )}
              </div>
            ))}
            {updateRequests.length === 0 && <p className="text-center text-zinc-500 mt-12">কোন আপডেট রিকোয়েস্ট নেই।</p>}
          </div>
        )}

        {activeTab === 'notices' && (
          <form onSubmit={handlePublishNotice} className="space-y-4 max-w-xl">
            <h2 className="text-xl font-bold mb-6">নতুন নোটিশ পাবলিশ করুন</h2>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">শিরোনাম</label>
              <input type="text" required className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">বিস্তারিত</label>
              <textarea required rows={4} className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">ছবির লিঙ্ক (ঐচ্ছিক)</label>
              <input type="text" className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={newNotice.imageUrl} onChange={e => setNewNotice({...newNotice, imageUrl: e.target.value})} />
            </div>
            <button className="bg-emerald-500 text-zinc-950 font-bold px-6 py-2 rounded-xl hover:bg-emerald-400 transition-all">পাবলিশ করুন</button>
          </form>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">সকল ইউজার ডাটা ({allUsers.length})</h2>
            <div className="grid grid-cols-1 gap-4">
              {allUsers.map(u => (
                <div key={u.id} className="bg-zinc-800/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold">{u.name}</p>
                    <p className="text-sm text-zinc-400">রোল: {u.role} | আইডি: {u.idNumber}</p>
                  </div>
                  <button onClick={() => generateUserPDF(u)} className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-sm">
                    <Download className="w-4 h-4" /> <span>PDF ডাউনলোড</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">চাবি ম্যানেজমেন্ট লগ</h2>
              <button onClick={() => generateKeyLogsPDF(keyLogs)} className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-lg hover:bg-emerald-400 transition-all">
                <Download className="w-4 h-4" /> <span>সকল লগ ডাউনলোড</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-sm">
                    <th className="pb-4 font-medium">ইউজার</th>
                    <th className="pb-4 font-medium">রোল/আইডি</th>
                    <th className="pb-4 font-medium">পাসকি</th>
                    <th className="pb-4 font-medium">সময়</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {keyLogs.map(log => (
                    <tr key={log.id} className="border-b border-white/5">
                      <td className="py-4 font-medium text-emerald-500">{log.userIdNumber}</td>
                      <td className="py-4 text-zinc-400">{log.userRole}</td>
                      <td className="py-4 font-mono">{log.paski}</td>
                      <td className="py-4 text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">ইউজার মন্তব্যসমূহ</h2>
            {comments.map(c => (
              <div key={c.id} className="bg-zinc-800/50 border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-emerald-500">{c.userName} ({c.userIdNumber})</p>
                  <p className="text-xs text-zinc-500">{new Date(c.timestamp).toLocaleString()}</p>
                </div>
                <p className="text-zinc-300">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
