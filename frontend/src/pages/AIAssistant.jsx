import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Sparkles, Lightbulb, Users, FolderOpen, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import '../styles/ai-assistant.css';

const quickPrompts = [
  { icon: <Users size={16} />, text: 'Find teammates for my project', prompt: 'I need to find teammates who have complementary skills for my graduation project. Can you help me find the best matches?' },
  { icon: <FolderOpen size={16} />, text: 'Suggest a graduation project', prompt: 'Suggest 3 innovative graduation project ideas for Computer Science students at AASTMT that involve AI and web development.' },
  { icon: <Lightbulb size={16} />, text: 'What skills should I learn?', prompt: 'Based on current tech trends, what skills should a Computer Science student learn to be competitive in the job market?' },
  { icon: <Sparkles size={16} />, text: 'Help me write a project proposal', prompt: 'Help me write a professional project proposal for a university graduation project. I want to build a team collaboration platform.' },
];

export default function AIAssistant() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your **TeamUp AI Assistant**, powered by Google Gemini.\n\nI can help you with:\n- 🔍 Finding teammates with specific skills\n- 💡 Suggesting graduation project ideas\n- 📝 Writing project proposals\n- 🎯 Career advice & skill recommendations\n- 📊 Analyzing team compatibility\n\nWhat would you like help with?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/api/ai/chat', {
        message: text.trim(),
        context: {
          userName: user?.full_name,
          userRole: user?.role,
          userSkills: user?.skills || [],
          university: user?.university || 'AASTMT',
        },
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.reply || 'I apologize, I couldn\'t generate a response. Please try again.',
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please make sure the backend is running and the Gemini API key is configured. Try again!',
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([messages[0]]);
    toast.success('Chat cleared');
  };

  const renderMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="page ai-page">
      <div className="container" style={{ maxWidth: 900 }}>
        <motion.div className="ai-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="ai-header-icon">
            <Bot size={28} />
          </div>
          <div>
            <h1>AI Assistant</h1>
            <p className="text-secondary">Powered by Google Gemini • Your smart teammate finder</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={clearChat} style={{ marginLeft: 'auto' }}>
            <Trash2 size={14} /> Clear
          </button>
        </motion.div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <motion.div className="ai-quick-prompts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                className="quick-prompt-card card"
                onClick={() => sendMessage(qp.prompt)}
              >
                <span className="quick-prompt-icon">{qp.icon}</span>
                <span>{qp.text}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Chat Messages */}
        <div className="ai-chat-container card">
          <div className="ai-messages">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`ai-message ${msg.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="ai-message-avatar">
                    {msg.role === 'assistant' ? (
                      <div className="ai-avatar"><Bot size={18} /></div>
                    ) : (
                      <div className="user-avatar">{user?.full_name?.[0] || 'U'}</div>
                    )}
                  </div>
                  <div className="ai-message-content">
                    <div className="ai-message-role">
                      {msg.role === 'assistant' ? 'TeamUp AI' : user?.full_name || 'You'}
                    </div>
                    <div
                      className="ai-message-text"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div className="ai-message assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="ai-message-avatar">
                  <div className="ai-avatar"><Bot size={18} /></div>
                </div>
                <div className="ai-message-content">
                  <div className="ai-message-role">TeamUp AI</div>
                  <div className="ai-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form className="ai-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="ai-input"
              placeholder="Ask me anything about finding teammates, projects, or skills..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="ai-send-btn"
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
