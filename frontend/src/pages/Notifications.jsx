import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Users, FolderOpen, MessageSquare, Award, Lightbulb } from 'lucide-react';
import { api } from '../services/api';
import { useNotificationStore } from '../stores/notificationStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/notifications.css';

const typeIcons = {
  join_request: <Users size={18} />,
  request_accepted: <Check size={18} />,
  request_rejected: <Trash2 size={18} />,
  new_message: <MessageSquare size={18} />,
  skill_match: <Lightbulb size={18} />,
  endorsement: <Award size={18} />,
  project_update: <FolderOpen size={18} />,
};

const typeColors = {
  join_request: 'var(--info)',
  request_accepted: 'var(--success)',
  request_rejected: 'var(--danger)',
  new_message: 'var(--primary-light)',
  skill_match: 'var(--warning)',
  endorsement: 'var(--accent-pink)',
  project_update: 'var(--accent-cyan)',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const { setUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.get('/api/notifications');
      setNotifications(data.notifications || []);
      const unread = (data.notifications || []).filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch {
      // Demo notifications
      setNotifications([
        { id: '1', type: 'join_request', title: 'New Join Request', message: 'Sara Mohamed wants to join "AI Graduation Project"', link: '/projects', read: false, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
        { id: '2', type: 'skill_match', title: 'Skill Match Found!', message: 'A new project "Smart Campus" matches your React & Node.js skills', link: '/projects', read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: '3', type: 'request_accepted', title: 'Request Accepted!', message: 'You were accepted into "Campus Navigation App"', link: '/projects', read: true, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        { id: '4', type: 'new_message', title: 'New Message', message: 'Omar Khalil sent a message in "AI Chatbot Platform"', link: '/chat', read: true, created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
        { id: '5', type: 'endorsement', title: 'New Endorsement', message: 'Dr. Ahmed Fathy endorsed you for "React Development"', link: '/profile', read: true, created_at: new Date(Date.now() - 1000 * 3600 * 24).toISOString() },
      ]);
      setUnreadCount(2);
    }
  };

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const unread = notifications.filter(n => !n.read && n.id !== id).length;
    setUnreadCount(unread);
    try { await api.patch(`/api/notifications/${id}`, { read: true }); } catch { }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await api.patch('/api/notifications/read-all'); } catch { }
    toast.success('All notifications marked as read');
  };

  const handleClick = (n) => {
    markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filtered = filter === 'all' ? notifications :
    filter === 'unread' ? notifications.filter(n => !n.read) : notifications.filter(n => n.read);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <motion.div className="notif-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1><Bell size={28} /> Notifications</h1>
            <p className="text-secondary">{notifications.filter(n => !n.read).length} unread notifications</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        </motion.div>

        <div className="tabs" style={{ maxWidth: 320 }}>
          {['all', 'unread', 'read'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="notif-list">
          <AnimatePresence>
            {filtered.map((n, i) => (
              <motion.div
                key={n.id}
                className={`notif-item card ${n.read ? 'read' : 'unread'}`}
                onClick={() => handleClick(n)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="notif-icon" style={{ color: typeColors[n.type], background: `${typeColors[n.type]}15` }}>
                  {typeIcons[n.type] || <Bell size={18} />}
                </div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && <div className="notif-dot" />}
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Bell size={48} className="empty-state-icon" />
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
