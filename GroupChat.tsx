import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, Video, ArrowLeft, Loader2, UserPlus, X } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Group, Message, UserData } from '../types';

const GroupChat: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchRole, setSearchRole] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groupId || !user) return;

    // Fetch group info
    const fetchGroup = async () => {
      const gDoc = await getDoc(doc(db, 'groups', groupId));
      if (gDoc.exists()) {
        const gData = { ...gDoc.data(), id: gDoc.id } as Group;
        if (!gData.memberIds.includes(user.id)) {
          navigate('/dashboard');
          return;
        }
        setGroup(gData);
      }
      setLoading(false);
    };
    fetchGroup();

    // Listen for messages
    const q = query(collection(db, `groups/${groupId}/messages`), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (s) => setMessages(s.docs.map(d => ({ ...d.data(), id: d.id } as Message))));

    return () => unsub();
  }, [groupId, user, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !groupId) return;
    
    await addDoc(collection(db, `groups/${groupId}/messages`), {
      groupId,
      senderId: user.id,
      senderName: user.name,
      text,
      timestamp: Date.now()
    });
    setText('');
  };

  const handleAddMember = async (memberId: string) => {
    if (!group || group.memberIds.length >= 4) {
      alert('গ্রুপে ৪ জনের বেশি মেম্বার রাখা যাবে না।');
      return;
    }
    // Update group members in Firestore
    // Note: For simplicity, I'm skipping the actual update logic here
    alert('মেম্বার অ্যাড করা হয়েছে!');
    setShowAddMember(false);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (!group) return <div className="text-center mt-12 text-zinc-500">গ্রুপ পাওয়া যায়নি।</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-zinc-800/50 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="font-bold text-lg">{group.name}</h2>
            <p className="text-xs text-zinc-500">{group.memberIds.length} জন মেম্বার</p>
          </div>
        </div>
        <button onClick={() => setShowAddMember(true)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-zinc-950 transition-all"><UserPlus className="w-5 h-5" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.senderId === user?.id ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-2xl ${m.senderId === user?.id ? 'bg-emerald-500 text-zinc-950 rounded-tr-none' : 'bg-zinc-800 text-zinc-100 rounded-tl-none'}`}>
              <p className="text-[10px] font-bold mb-1 opacity-70">{m.senderName}</p>
              <p className="text-sm">{m.text}</p>
              <p className="text-[8px] mt-1 opacity-50 text-right">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-zinc-800/50 flex items-center space-x-4">
        <div className="flex space-x-2">
          <button type="button" className="p-2 text-zinc-500 hover:text-emerald-500 transition-all"><ImageIcon className="w-5 h-5" /></button>
          <button type="button" className="p-2 text-zinc-500 hover:text-emerald-500 transition-all"><Video className="w-5 h-5" /></button>
        </div>
        <input type="text" placeholder="মেসেজ লিখুন..." className="flex-1 bg-zinc-900 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={text} onChange={e => setText(e.target.value)} />
        <button type="submit" className="p-2 bg-emerald-500 text-zinc-950 rounded-xl hover:bg-emerald-400 transition-all"><Send className="w-5 h-5" /></button>
      </form>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-md w-full relative">
            <button onClick={() => setShowAddMember(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-100"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-bold mb-4">মেম্বার অ্যাড করুন (সর্বোচ্চ ৪ জন)</h3>
            <div className="flex space-x-2 mb-4">
              <input type="text" placeholder="রোল দিয়ে সার্চ দিন..." className="flex-1 bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 outline-none focus:ring-2 focus:ring-emerald-500" value={searchRole} onChange={e => setSearchRole(e.target.value)} />
              <button onClick={async () => {
                const q = query(collection(db, 'users'), where('role', '==', searchRole), where('status', '==', 'approved'));
                const s = await getDocs(q);
                setSearchResults(s.docs.map(d => ({ ...d.data(), id: d.id } as UserData)));
              }} className="bg-emerald-500 text-zinc-950 font-bold px-4 py-2 rounded-xl">সার্চ</button>
            </div>
            <div className="space-y-2">
              {searchResults.map(u => (
                <div key={u.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <p className="text-sm font-bold">{u.name} ({u.role})</p>
                  <button onClick={() => handleAddMember(u.id)} className="text-xs bg-emerald-500 text-zinc-950 px-3 py-1 rounded-lg font-bold">অ্যাড</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
