import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowUp, X, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function FloatingWidgets() {
  const [showScroll, setShowScroll] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Hi! I am TeamUp AI. Need help finding a project or team?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const checkScroll = () => {
      setShowScroll(window.scrollY > 300);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const context = {
        userName: user?.full_name,
        userRole: user?.role,
        userSkills: user?.skills,
        university: user?.university,
      };

      const res = await api.post('/api/ai/chat', { message: userMsg.content, context, history });
      setMessages(prev => [...prev, { role: 'ai', content: res.reply || 'I am sorry, I encountered an error.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Could not connect to AI. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="floating-widgets">
      <AnimatePresence>
        {/* Back to Top */}
        {showScroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="widget-btn back-to-top"
            onClick={scrollToTop}
          >
            <ArrowUp size={20} />
          </motion.button>
        )}

        {/* Floating Chat Window */}
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="floating-chat-window card"
          >
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="avatar avatar-sm"><Bot size={16} /></div>
                <strong>TeamUp AI</strong>
              </div>
              <button onClick={() => setChatOpen(false)} className="close-btn"><X size={18} /></button>
            </div>
            
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  <div className="msg-content">{m.content}</div>
                </div>
              ))}
              {loading && <div className="msg ai"><div className="msg-content typing">...</div></div>}
            </div>

            <form onSubmit={handleSend} className="chat-input">
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Ask me anything..." 
                className="input"
              />
              <button type="submit" disabled={loading} className="btn btn-primary btn-icon">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="widget-btn chatbot-toggle"
        onClick={() => setChatOpen(!chatOpen)}
        style={{ background: chatOpen ? 'var(--danger)' : 'var(--primary)' }}
      >
        {chatOpen ? <X size={24} /> : <Bot size={24} />}
      </motion.button>
    </div>
  );
}
