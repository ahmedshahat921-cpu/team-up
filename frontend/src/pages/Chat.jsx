import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Code, Image, Hash, Search, Plus, Users, Smile } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import '../styles/chat.css';

const demoChannels = [
  { id: '1', name: 'AI Chatbot Platform', type: 'group', unread: 3 },
  { id: '2', name: 'Campus Navigation', type: 'group', unread: 0 },
  { id: '3', name: 'Sara Mohamed', type: 'private', unread: 1 },
  { id: '4', name: 'Omar Khalil', type: 'private', unread: 0 },
];

const demoMessages = [
  { id: '1', sender: { full_name: 'Ahmed Hassan', avatar_url: null }, content: 'Hey team! I just pushed the new API changes.', type: 'text', created_at: '2026-04-24T10:30:00Z' },
  { id: '2', sender: { full_name: 'Sara Mohamed', avatar_url: null }, content: 'Great work! I\'ll review the PR today.', type: 'text', created_at: '2026-04-24T10:32:00Z' },
  { id: '3', sender: { full_name: 'Omar Khalil', avatar_url: null }, content: '```javascript\nconst api = {\n  baseUrl: "/api/v1",\n  headers: { "Content-Type": "application/json" }\n};\n```', type: 'code', created_at: '2026-04-24T10:35:00Z' },
  { id: '4', sender: { full_name: 'Ahmed Hassan', avatar_url: null }, content: '@Sara can you also check the auth middleware?', type: 'text', created_at: '2026-04-24T10:38:00Z' },
];

export default function Chat() {
  const { user } = useAuthStore();
  const [channels, setChannels] = useState(demoChannels);
  const [activeChannel, setActiveChannel] = useState(demoChannels[0]);
  const [messages, setMessages] = useState(demoMessages);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const isCode = input.startsWith('```');
    const newMsg = {
      id: Date.now().toString(),
      sender: { full_name: user?.full_name || 'You', avatar_url: user?.avatar_url },
      content: input,
      type: isCode ? 'code' : 'text',
      created_at: new Date().toISOString(),
    };
    setMessages([...messages, newMsg]);
    setInput('');
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const renderContent = (msg) => {
    if (msg.type === 'code') {
      const code = msg.content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return <pre className="chat-code-block"><code>{code}</code></pre>;
    }
    // Handle @mentions
    const parts = msg.content.split(/(@\w+)/g);
    return <p>{parts.map((p, i) => p.startsWith('@') ? <span key={i} className="chat-mention">{p}</span> : p)}</p>;
  };

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Messages</h2>
            <button className="btn btn-icon btn-secondary btn-sm"><Plus size={18} /></button>
          </div>
          <div className="input-with-icon" style={{ padding: '0 16px', marginBottom: 12 }}>
            <Search size={16} className="input-icon" />
            <input className="input" placeholder="Search chats..." style={{ fontSize: '0.85rem' }}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="chat-channel-list">
            {filteredChannels.map(ch => (
              <button key={ch.id} className={`chat-channel ${activeChannel?.id === ch.id ? 'active' : ''}`}
                onClick={() => setActiveChannel(ch)}>
                <div className="chat-channel-avatar">
                  {ch.type === 'group' ? <Hash size={18} /> : <span>{getInitials(ch.name)}</span>}
                </div>
                <div className="chat-channel-info">
                  <span className="chat-channel-name">{ch.name}</span>
                  <span className="chat-channel-preview">Last message...</span>
                </div>
                {ch.unread > 0 && <span className="chat-channel-badge">{ch.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat */}
        <div className="chat-main">
          <div className="chat-main-header">
            <div className="chat-main-header-info">
              <h3>{activeChannel?.name}</h3>
              <span className="text-muted"><Users size={14} /> 4 members</span>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => {
              const isOwn = msg.sender.full_name === (user?.full_name || 'You');
              return (
                <motion.div key={msg.id}
                  className={`chat-message ${isOwn ? 'own' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {!isOwn && (
                    <div className="chat-message-avatar avatar avatar-sm">
                      {getInitials(msg.sender.full_name)}
                    </div>
                  )}
                  <div className="chat-message-content">
                    {!isOwn && <span className="chat-message-sender">{msg.sender.full_name}</span>}
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

          <form className="chat-input-bar" onSubmit={handleSend}>
            <button type="button" className="chat-input-action" title="Attach file"><Paperclip size={20} /></button>
            <button type="button" className="chat-input-action" title="Code block"><Code size={20} /></button>
            <button type="button" className="chat-input-action" title="Image"><Image size={20} /></button>
            <input
              className="chat-input"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-icon" disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
