import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Lightbulb, Plus, Search, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const demoIdeas = [
  { id: '1', title: 'AI-Powered Code Reviewer', description: 'An AI tool that reviews code submissions, provides suggestions, and detects common bugs using static analysis and LLMs.', author: { full_name: 'Dr. Ahmed Fathy', role: 'professor' }, is_professor_idea: true, required_skills: ['Python', 'NLP', 'React'], likes_count: 24, liked: false },
  { id: '2', title: 'Smart Library System', description: 'A system that tracks book availability, suggests readings based on student courses, and sends due date reminders.', author: { full_name: 'Dr. Mona Saleh', role: 'professor' }, is_professor_idea: true, required_skills: ['Java', 'Spring Boot', 'React'], likes_count: 18, liked: true },
  { id: '3', title: 'Student Marketplace App', description: 'A platform for students to buy, sell, and exchange used textbooks, electronics, and study materials.', author: { full_name: 'Karim Hassan', role: 'student' }, is_professor_idea: false, required_skills: ['React Native', 'Firebase'], likes_count: 15, liked: false },
  { id: '4', title: 'Campus Event Tracker', description: 'Track all university events, clubs, and workshops with RSVP features and calendar integration.', author: { full_name: 'Lina Omar', role: 'student' }, is_professor_idea: false, required_skills: ['Vue.js', 'Node.js'], likes_count: 9, liked: false },
  { id: '5', title: 'Automated Lab Reports', description: 'Generate structured lab reports from raw experimental data using templates and AI analysis.', author: { full_name: 'Dr. Tarek Ali', role: 'professor' }, is_professor_idea: true, required_skills: ['Python', 'LaTeX', 'ML'], likes_count: 31, liked: true },
];

export default function IdeaVault() {
  const { user } = useAuthStore();
  const [ideas, setIdeas] = useState(demoIdeas);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', required_skills: '' });

  const toggleLike = (id) => {
    setIdeas(ideas.map(idea => {
      if (idea.id === id) {
        return { ...idea, liked: !idea.liked, likes_count: idea.liked ? idea.likes_count - 1 : idea.likes_count + 1 };
      }
      return idea;
    }));
  };

  const handleSubmitIdea = (e) => {
    e.preventDefault();
    const idea = {
      id: Date.now().toString(),
      title: newIdea.title,
      description: newIdea.description,
      author: { full_name: user?.full_name || 'You', role: user?.role || 'student' },
      is_professor_idea: user?.role === 'professor',
      required_skills: newIdea.required_skills.split(',').map(s => s.trim()).filter(Boolean),
      likes_count: 0,
      liked: false,
    };
    setIdeas([idea, ...ideas]);
    setNewIdea({ title: '', description: '', required_skills: '' });
    setShowNew(false);
    toast.success('Idea posted!');
  };

  const filtered = ideas.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'professor' && i.is_professor_idea) || (filter === 'student' && !i.is_professor_idea);
    return matchSearch && matchFilter;
  });

  return (
    <div className="page">
      <div className="container">
        <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeUp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>💡 Idea Vault</h1><p>Browse and share project ideas with the community.</p></div>
          <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
            <Plus size={18} /> Post Idea
          </button>
        </motion.div>

        {showNew && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card" style={{ marginBottom: 24, padding: 24 }} onSubmit={handleSubmitIdea}>
            <h3 style={{ marginBottom: 16 }}>Share Your Idea</h3>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label>Title</label>
              <input className="input" placeholder="Your idea title..." value={newIdea.title} onChange={e => setNewIdea({...newIdea, title: e.target.value})} required />
            </div>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label>Description</label>
              <textarea className="input" placeholder="Describe your idea..." value={newIdea.description} onChange={e => setNewIdea({...newIdea, description: e.target.value})} required />
            </div>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Required Skills (comma separated)</label>
              <input className="input" placeholder="React, Python, ML..." value={newIdea.required_skills} onChange={e => setNewIdea({...newIdea, required_skills: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">Post Idea</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </motion.form>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ flex: 1, maxWidth: 400 }}>
            <Search size={18} className="input-icon" />
            <input className="input" placeholder="Search ideas..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`tab ${filter === 'professor' ? 'active' : ''}`} onClick={() => setFilter('professor')}>Professor Ideas</button>
            <button className={`tab ${filter === 'student' ? 'active' : ''}`} onClick={() => setFilter('student')}>Student Ideas</button>
          </div>
        </div>

        <div className="grid-2">
          {filtered.map((idea, i) => (
            <motion.div key={idea.id} className="card card-glow" initial="hidden" animate="visible" variants={fadeUp} custom={i} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                {idea.is_professor_idea && (
                  <span className="badge badge-warning"><GraduationCap size={12} /> Professor</span>
                )}
                {!idea.is_professor_idea && <span className="badge badge-info">Student</span>}
                <button onClick={() => toggleLike(idea.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: idea.liked ? 'var(--danger)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Heart size={18} fill={idea.liked ? 'currentColor' : 'none'} />
                  <span style={{ fontSize: '0.85rem' }}>{idea.likes_count}</span>
                </button>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{idea.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12 }}>{idea.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {idea.required_skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {idea.author.full_name}</span>
                <button className="btn btn-primary btn-sm" onClick={() => toast.success('Request sent!')}>
                  Request to Join <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
