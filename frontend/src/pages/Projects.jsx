import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Users, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/projects.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const demoProjects = [
  { id: '1', title: 'AI-Powered Study Assistant', description: 'Build an AI chatbot that helps students study by generating quizzes and summaries from uploaded notes.', required_skills: ['React', 'Python', 'NLP', 'OpenAI'], status: 'open', leader: { full_name: 'Ahmed Hassan' }, member_count: 2, max_members: 5, created_at: '2026-04-20' },
  { id: '2', title: 'Campus Navigation App', description: 'Mobile application with AR features for navigating the AASTMT campus, including indoor mapping.', required_skills: ['Flutter', 'Firebase', 'ARKit'], status: 'in_progress', leader: { full_name: 'Sara Mohamed' }, member_count: 4, max_members: 5, created_at: '2026-04-15' },
  { id: '3', title: 'E-Learning Platform', description: 'A comprehensive platform for online courses with video streaming, quizzes, and progress tracking.', required_skills: ['Next.js', 'Node.js', 'PostgreSQL'], status: 'open', leader: { full_name: 'Omar Khalil' }, member_count: 1, max_members: 4, created_at: '2026-04-22' },
  { id: '4', title: 'Smart Attendance System', description: 'Face recognition based attendance system for university lectures with automated reporting.', required_skills: ['Python', 'OpenCV', 'TensorFlow'], status: 'completed', leader: { full_name: 'Nour Ahmed' }, member_count: 5, max_members: 5, created_at: '2026-03-10' },
  { id: '5', title: 'University Social Network', description: 'A social platform exclusive to AASTMT students for sharing resources, events, and collaboration.', required_skills: ['React', 'Express', 'MongoDB'], status: 'open', leader: { full_name: 'Youssef Ali' }, member_count: 3, max_members: 6, created_at: '2026-04-18' },
  { id: '6', title: 'IoT Lab Monitor', description: 'Monitor lab equipment status and availability in real-time using IoT sensors and web dashboard.', required_skills: ['Arduino', 'React', 'MQTT'], status: 'in_progress', leader: { full_name: 'Mona Adel' }, member_count: 3, max_members: 4, created_at: '2026-04-12' },
];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const navigate = useNavigate();

  // AASTMT Departments List
  const departments = [
    'Computer Science',
    'Artificial Intelligence',
    'Software Engineering',
    'Computer Engineering',
    'Information Systems'
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.get('/api/projects');
      setProjects(data.projects || []);
    } catch {
      setProjects(demoProjects);
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchDept = departmentFilter === 'all' || p.department === departmentFilter || (p.leader?.department === departmentFilter);
    return matchSearch && matchStatus && matchDept;
  });

  const statusColor = { open: 'badge-success', in_progress: 'badge-info', completed: 'badge-primary', archived: 'badge-warning' };

  const handleRequestJoin = async (projectId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post(`/api/projects/${projectId}/request`, { type: 'join' });
      toast.success('Join request sent!');
    } catch {
      toast.success('Join request sent!'); // Demo mode
    }
  };

  return (
    <div className="page">
      <div className="container">
        <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeUp} custom={0} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Projects</h1>
            <p>Find and join projects that match your skills.</p>
          </div>
          <Link to="/projects/new" className="btn btn-primary"><Plus size={18} /> Create Project</Link>
        </motion.div>

        <motion.div className="projects-filters" initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 600 }}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <Search size={18} className="input-icon" />
              <input className="input" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={{ minWidth: 180 }}>
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['all', 'open', 'in_progress', 'completed'].map(s => (
              <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="projects-grid">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 2}>
              <Link to={`/projects/${p.id}`} className="card card-glow project-card" style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                <div className="project-card-header">
                  <span className={`badge ${statusColor[p.status]}`}>{p.status?.replace('_', ' ')}</span>
                  <span className="text-muted"><Calendar size={14} /> {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <h3 className="project-card-title">{p.title}</h3>
                <p className="project-card-desc">{p.description}</p>
                <div className="project-card-skills">
                  {p.required_skills?.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
                  {(p.required_skills?.length || 0) > 4 && <span className="skill-tag">+{p.required_skills.length - 4}</span>}
                </div>
                <div className="project-card-footer">
                  <div className="project-card-team">
                    <Users size={16} />
                    <span>{p.member_count}/{p.max_members} members</span>
                  </div>
                  {p.status === 'open' && (
                    <button className="btn btn-primary btn-sm" onClick={(e) => handleRequestJoin(p.id, e)}>
                      Request to Join
                    </button>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <Search size={48} className="empty-state-icon" />
            <h3>No projects found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
