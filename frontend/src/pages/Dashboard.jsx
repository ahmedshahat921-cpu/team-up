import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, FolderOpen, MessageSquare, CheckCircle, Clock, TrendingUp,
  ArrowRight, Plus, Bell, Star, Lightbulb
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import '../styles/dashboard.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  }),
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ projects: 0, tasks: 0, messages: 0, members: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.get('/api/dashboard');
      setStats(data.stats || stats);
      setRecentProjects(data.recentProjects || []);
      setUpcomingTasks(data.upcomingTasks || []);
    } catch (err) {
      // Use demo data if backend unavailable
      setStats({ projects: 3, tasks: 12, messages: 48, members: 8 });
      setRecentProjects([
        { id: '1', title: 'AI Chatbot Platform', status: 'in_progress', required_skills: ['React', 'Python', 'NLP'], member_count: 4 },
        { id: '2', title: 'Campus Navigation App', status: 'open', required_skills: ['Flutter', 'Firebase'], member_count: 2 },
        { id: '3', title: 'E-Learning Dashboard', status: 'completed', required_skills: ['Vue.js', 'Node.js'], member_count: 5 },
      ]);
      setUpcomingTasks([
        { id: '1', title: 'Design wireframes', due_date: '2026-04-28', priority: 'high', project_title: 'AI Chatbot' },
        { id: '2', title: 'API integration', due_date: '2026-04-30', priority: 'medium', project_title: 'AI Chatbot' },
        { id: '3', title: 'User testing', due_date: '2026-05-02', priority: 'low', project_title: 'Campus Nav' },
      ]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { icon: <FolderOpen size={22} />, label: 'Projects', value: stats.projects, color: 'var(--primary)' },
    { icon: <CheckCircle size={22} />, label: 'Tasks', value: stats.tasks, color: 'var(--success)' },
    { icon: <MessageSquare size={22} />, label: 'Messages', value: stats.messages, color: 'var(--info)' },
    { icon: <Users size={22} />, label: 'Team Members', value: stats.members, color: 'var(--accent-orange)' },
  ];

  const statusColor = { open: 'badge-success', in_progress: 'badge-info', completed: 'badge-primary' };
  const priorityColor = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <motion.div className="dash-header" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div>
            <h1>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Student'} 👋</h1>
            <p className="text-secondary">Here's what's happening with your projects today.</p>
          </div>
          <Link to="/projects/new" className="btn btn-primary">
            <Plus size={18} /> New Project
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="dash-stats">
          {statCards.map((s, i) => (
            <motion.div key={s.label} className="card dash-stat-card" initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
              <div className="stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="dash-grid">
          {/* Recent Projects */}
          <motion.div className="card" initial="hidden" animate="visible" variants={fadeUp} custom={5}>
            <div className="card-header-row">
              <h2><FolderOpen size={20} /> Recent Projects</h2>
              <Link to="/projects" className="btn btn-secondary btn-sm">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="project-list">
              {recentProjects.map((p, i) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="project-item">
                  <div className="project-item-info">
                    <h3>{p.title}</h3>
                    <div className="project-item-meta">
                      <span className={`badge ${statusColor[p.status] || 'badge-primary'}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                      <span className="text-muted"><Users size={14} /> {p.member_count} members</span>
                    </div>
                  </div>
                  <div className="project-skills">
                    {p.required_skills?.slice(0, 3).map(s => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Tasks */}
          <motion.div className="card" initial="hidden" animate="visible" variants={fadeUp} custom={6}>
            <div className="card-header-row">
              <h2><Clock size={20} /> Upcoming Tasks</h2>
              <Link to="/tasks" className="btn btn-secondary btn-sm">View All <ArrowRight size={14} /></Link>
            </div>
            <div className="task-list">
              {upcomingTasks.map((t) => (
                <div key={t.id} className="task-item">
                  <div className="task-item-info">
                    <h4>{t.title}</h4>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>{t.project_title}</span>
                  </div>
                  <div className="task-item-meta">
                    <span className={`badge ${priorityColor[t.priority]}`}>{t.priority}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div className="dash-quick-actions" initial="hidden" animate="visible" variants={fadeUp} custom={7}>
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/projects/new" className="quick-action card card-glow">
              <Plus size={24} />
              <span>Create Project</span>
            </Link>
            <Link to="/ideas" className="quick-action card card-glow">
              <Lightbulb size={24} />
              <span>Browse Ideas</span>
            </Link>
            <Link to="/chat" className="quick-action card card-glow">
              <MessageSquare size={24} />
              <span>Open Chat</span>
            </Link>
            <Link to="/profile" className="quick-action card card-glow">
              <Star size={24} />
              <span>My Profile</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
