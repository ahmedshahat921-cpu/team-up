import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Code, Image, Hash, Search, Plus, Users, Smile, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import '../styles/chat.css';

const EMOJIS = ['😀', '😂', '🥰', '😎', '😭', '😡', '👍', '👎', '🔥', '🚀', '💻', '💡', '🎉', '✅', '❌'];

export default function Chat() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef(null);

  // Load Contacts
  useEffect(() => {
    if (!user) return;
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, avatar_url')
        .neq('id', user.id);
      if (!error && data) {
        setUsers(data);
      }
    };
    loadUsers();
  }, [user]);

  // Load Messages and subscribe
  useEffect(() => {
    if (!user || !activeChannel) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          id, content, type, file_url, created_at, sender_id,
          sender:users!sender_id(full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChannel.id}),and(sender_id.eq.${activeChannel.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setMessages(data);
      }
    };
    loadMessages();

    // Subscribe
    const channel = supabase.channel('private-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.sender_id === activeChannel.id) {
          // If message is from current active chat, fetch sender details and append
          supabase.from('users').select('full_name, avatar_url').eq('id', payload.new.sender_id).single()
            .then(({ data }) => {
              const newMsg = { ...payload.new, sender: data };
              setMessages(prev => [...prev, newMsg]);
            });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeChannel) return;

    const content = input;
    const isCode = content.startsWith('```');
    setInput('');
    setShowEmojis(false);

    // Optimistic UI
    const optimisticMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: activeChannel.id,
      sender: { full_name: user.full_name, avatar_url: user.avatar_url },
      content,
      type: isCode ? 'code' : 'text',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { error } = await supabase.from('private_messages').insert({
      sender_id: user.id,
      receiver_id: activeChannel.id,
      content,
      type: isCode ? 'code' : 'text'
    });
    
    if (error) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChannel) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `chats/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') // Using avatars bucket as fallback
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const file_url = publicUrlData.publicUrl;

      // Optimistic UI
      const optimisticMsg = {
        id: Date.now().toString(),
        sender_id: user.id,
        receiver_id: activeChannel.id,
        sender: { full_name: user.full_name, avatar_url: user.avatar_url },
        content: '📷 Image',
        type: 'image',
        file_url,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // DB insert
      await supabase.from('private_messages').insert({
        sender_id: user.id,
        receiver_id: activeChannel.id,
        content: '📷 Image',
        type: 'image',
        file_url
      });

    } catch (err) {
      toast.error('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const renderContent = (msg) => {
    if (msg.type === 'code') {
      const code = msg.content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return <pre className="chat-code-block"><code>{code}</code></pre>;
    }
    if (msg.type === 'image') {
      return (
        <div style={{ maxWidth: 300, borderRadius: 8, overflow: 'hidden' }}>
          <img src={msg.file_url} alt="Sent image" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      );
    }
    const parts = msg.content.split(/(@\w+)/g);
    return <p style={{ margin: 0 }}>{parts.map((p, i) => p.startsWith('@') ? <span key={i} className="chat-mention">{p}</span> : p)}</p>;
  };

  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Messages</h2>
          </div>
          <div className="input-with-icon" style={{ padding: '0 16px', marginBottom: 12 }}>
            <Search size={16} className="input-icon" />
            <input className="input" placeholder="Search users..." style={{ fontSize: '0.85rem' }}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="chat-channel-list">
            {filteredUsers.map(u => (
              <button key={u.id} className={`chat-channel ${activeChannel?.id === u.id ? 'active' : ''}`}
                onClick={() => setActiveChannel(u)}>
                <div className="chat-channel-avatar">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} /> : <span>{getInitials(u.full_name)}</span>}
                </div>
                <div className="chat-channel-info">
                  <span className="chat-channel-name">{u.full_name}</span>
                  <span className="chat-channel-preview text-muted" style={{ fontSize: '0.75rem' }}>{u.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat */}
        <div className="chat-main">
          {activeChannel ? (
            <>
              <div className="chat-main-header">
                <div className="chat-main-header-info">
                  <h3>{activeChannel.full_name}</h3>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Private Chat</span>
                </div>
              </div>

              <div className="chat-messages">
                {messages.map((msg, i) => {
                  const isOwn = msg.sender_id === user.id;
                  return (
                    <motion.div key={msg.id}
                      className={`chat-message ${isOwn ? 'own' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      {!isOwn && (
                        <div className="chat-message-avatar avatar avatar-sm">
                          {msg.sender?.avatar_url ? <img src={msg.sender.avatar_url} alt="" /> : getInitials(msg.sender?.full_name)}
                        </div>
                      )}
                      <div className="chat-message-content">
                        {!isOwn && <span className="chat-message-sender">{msg.sender?.full_name}</span>}
                        <div className={`chat-bubble ${isOwn ? 'own' : ''}`}>
                          {renderContent(msg)}
                        </div>
                        <span className="chat-message-time">{formatTime(msg.created_at)}</span>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ position: 'relative' }}>
                <AnimatePresence>
                  {showEmojis && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: 'absolute', bottom: '100%', left: 20, background: 'var(--bg-card)', padding: 12, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', width: 200, zIndex: 10, marginBottom: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                    >
                      <button onClick={() => setShowEmojis(false)} style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
                      {EMOJIS.map(em => (
                        <button key={em} onClick={() => { setInput(i => i + em); setShowEmojis(false); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4 }}>{em}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <form className="chat-input-bar" onSubmit={handleSend}>
                  <button type="button" className="chat-input-action" onClick={() => setShowEmojis(!showEmojis)} title="Emoji"><Smile size={20} /></button>
                  <label className="chat-input-action" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Image">
                    <Image size={20} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  </label>
                  <input
                    className="chat-input"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-icon" disabled={!input.trim() || uploadingImage}>
                    {uploadingImage ? <span className="loader loader-sm" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Select a user to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
