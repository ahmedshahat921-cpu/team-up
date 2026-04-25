import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, CheckCircle, XCircle, Users, Lightbulb, FolderOpen, Clock, Plus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const demoRequests = [
  { id: '1', student: { full_name: 'Ahmed Hassan', skills: ['React', 'Node.js'], reputation: 4.5 }, project: 'AI Chatbot Platform', message: 'I would love to work under your supervision for this project.', status: 'pending', created_at: '2026-04-23' },
  { id: '2', student: { full_name: 'Sara Mohamed', skills: ['Python', 'ML', 'Data Science'], reputation: 4.8 }, project: 'Smart Attendance System', message: 'Interested in researching face recognition approaches.', status: 'pending', created_at: '2026-04-22' },
  { id: '3', student: { full_name: 'Karim Ali', skills: ['Flutter', 'Firebase'], reputation: 3.9 }, project: 'Campus Navigation App', message: 'Would you consider supervising our mobile app project?', status: 'pending', created_at: '2026-04-21' },
];

const demoSupervised = [
  { id: '1', title: 'Deep Learning for Medical Imaging', status: 'in_progress', members: 4, progress: 65 },
  { id: '2', title: 'Blockchain-based Voting System', status: 'in_progress', members: 3, progress: 40 },
];

export default function ProfessorDashboard() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState(demoRequests);
  const [showPostIdea, setShowPostIdea] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', required_skills: '' });

  const handleRequest = (id, action) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    toast.success(`Request ${action}!`);
  };

  const handlePostIdea = (e) => {
    e.preventDefault();
    toast.success('Idea posted to Idea Vault!');
    setShowPostIdea(false);
    setNewIdea({ title: '', description: '', required_skills: '' });
  };

  return (
    <div className="page">
      <div className="container">
        <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeUp}>
          <h1><GraduationCap size={28} style={{ verticalAlign: 'middle' }} /> Supervisor Dashboard</h1>
          <p>Manage supervision requests, post ideas, and track your supervised projects.</p>
        </motion.div>

        {/* Stats */}
        <div className="dash-stats" style={{ marginBottom: 32 }}>
          {[
            { icon: <Clock size={22} />, label: 'Pending Requests', value: requests.filter(r => r.status === 'pending').length, color: 'var(--warning)' },
            { icon: <FolderOpen size={22} />, label: 'Supervised Projects', value: demoSupervised.length, color: 'var(--primary)' },
            { icon: <Lightbulb size={22} />, label: 'Ideas Posted', value: 5, color: 'var(--accent-orange)' },
            { icon: <Users size={22} />, label: 'Total Students', value: 12, color: 'var(--info)' },
          ].map((s, i) => (
            <motion.div key={s.label} className="card dash-stat-card" initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
              <div className="stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </motion.div>
          ))}
        </div>

        <div className="dash-grid">
          {/* Requests */}
          <motion.div className="card" initial="hidden" animate="visible" variants={fadeUp} custom={5}>
            <div className="card-header-row">
              <h2><Clock size={20} /> Supervision Requests</h2>
            </div>
            <AnimatePresence>
              {requests.filter(r => r.status === 'pending').map(req => (
                <motion.div key={req.id} className="card" layout exit={{ opacity: 0, x: -100, height: 0 }}
                  style={{ padding: 16, marginBottom: 12, background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem' }}>{req.student.full_name}</h4>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>for: {req.project}</span>
                    </div>
                    <span style={{ color: 'var(--warning)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⭐ {req.student.reputation}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>{req.message}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {req.student.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleRequest(req.id, 'accepted')}>
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRequest(req.id, 'rejected')}>
                      <XCircle size={16} /> Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {requests.filter(r => r.status === 'pending').length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <CheckCircle size={40} style={{ color: 'var(--success)', marginBottom: 8 }} />
                <h3>All caught up!</h3>
                <p>No pending requests.</p>
              </div>
            )}
          </motion.div>

          {/* Supervised Projects */}
          <motion.div className="card" initial="hidden" animate="visible" variants={fadeUp} custom={6}>
            <div className="card-header-row">
              <h2><FolderOpen size={20} /> Supervised Projects</h2>
            </div>
            {demoSupervised.map(p => (
              <div key={p.id} style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', marginBottom: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: 8 }}>{p.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}><Users size={14} style={{ verticalAlign: 'middle' }} /> {p.members} members</span>
                  <span className="badge badge-info">{p.status.replace('_', ' ')}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.progress}%`, background: 'var(--primary)', borderRadius: 4, transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.progress}% complete</span>
              </div>
            ))}

            <button className="btn btn-outline" onClick={() => setShowPostIdea(true)} style={{ width: '100%', marginTop: 8 }}>
              <Lightbulb size={16} /> Post an Idea
            </button>
          </motion.div>
        </div>

        {/* Post Idea Modal */}
        {showPostIdea && (
          <div className="modal-overlay" onClick={() => setShowPostIdea(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Post a Project Idea</h2>
                <button className="modal-close" onClick={() => setShowPostIdea(false)}>×</button>
              </div>
              <form onSubmit={handlePostIdea}>
                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label>Title</label>
                  <input className="input" placeholder="Idea title..." value={newIdea.title} onChange={e => setNewIdea({...newIdea, title: e.target.value})} required />
                </div>
                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label>Description</label>
                  <textarea className="input" placeholder="Describe the project idea..." value={newIdea.description} onChange={e => setNewIdea({...newIdea, description: e.target.value})} required />
                </div>
                <div className="input-group" style={{ marginBottom: 24 }}>
                  <label>Required Skills</label>
                  <input className="input" placeholder="Python, ML, React..." value={newIdea.required_skills} onChange={e => setNewIdea({...newIdea, required_skills: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Idea</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
