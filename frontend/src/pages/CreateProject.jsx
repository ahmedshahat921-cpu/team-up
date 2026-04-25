import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, X, Users, Code2, Layers, FileText,
  Sparkles, FolderOpen, Target, Save
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import '../styles/create-project.css';

const categories = [
  'AI & Machine Learning', 'Web Development', 'Mobile App',
  'IoT & Hardware', 'Data Science', 'Cybersecurity',
  'Game Development', 'Blockchain', 'DevOps', 'Other'
];

const suggestedSkills = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
  'Flutter', 'Firebase', 'MongoDB', 'PostgreSQL', 'TensorFlow',
  'Docker', 'AWS', 'Figma', 'Java', 'C++', 'Swift',
  'Kotlin', 'Vue.js', 'Angular', 'Next.js', 'Express.js',
  'Django', 'FastAPI', 'OpenCV', 'NLP', 'GraphQL',
  'Redis', 'Supabase', 'Tailwind CSS', 'Three.js'
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  }),
};

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    required_skills: [],
    max_members: 5,
    meeting_url: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !form.required_skills.includes(trimmed)) {
      handleChange('required_skills', [...form.required_skills, trimmed]);
    }
    setSkillInput('');
    setShowSuggestions(false);
  };

  const removeSkill = (skill) => {
    handleChange('required_skills', form.required_skills.filter(s => s !== skill));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (skillInput.trim()) addSkill(skillInput);
    }
  };

  const filteredSuggestions = suggestedSkills.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) &&
      !form.required_skills.includes(s)
  ).slice(0, 8);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Please add a project description');
      return;
    }
    if (form.required_skills.length === 0) {
      toast.error('Add at least one required skill');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/api/projects', {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      toast.success('🎉 Project created successfully!');
      navigate('/projects');
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>
            <ArrowLeft size={16} /> Back
          </button>
        </motion.div>

        <motion.div className="create-project-header" initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <div className="create-project-icon">
            <Sparkles size={28} />
          </div>
          <div>
            <h1>Create New Project</h1>
            <p className="text-secondary">Set up your team project and start collaborating</p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="create-project-form">
          {/* Title */}
          <motion.div className="form-section card" initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="form-section-header">
              <FolderOpen size={20} />
              <h3>Project Details</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input
                className="input"
                placeholder="e.g. AI-Powered Study Assistant"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                maxLength={100}
              />
              <span className="char-count">{form.title.length}/100</span>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="input textarea"
                placeholder="Describe your project, its goals, and what makes it exciting..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <span className="char-count">{form.description.length}/1000</span>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="input select"
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Skills */}
          <motion.div className="form-section card" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <div className="form-section-header">
              <Code2 size={20} />
              <h3>Required Skills</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Add skills your team needs *</label>
              <div className="skill-input-wrapper">
                <input
                  className="input"
                  placeholder="Type a skill and press Enter..."
                  value={skillInput}
                  onChange={e => {
                    setSkillInput(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleSkillKeyDown}
                  onFocus={() => skillInput && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="skill-suggestions">
                    {filteredSuggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        className="skill-suggestion"
                        onClick={() => addSkill(s)}
                      >
                        <Plus size={14} /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {form.required_skills.length > 0 && (
                <div className="selected-skills">
                  {form.required_skills.map(s => (
                    <motion.span
                      key={s}
                      className="skill-tag skill-tag-removable"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      {s}
                      <button type="button" onClick={() => removeSkill(s)}>
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              {form.required_skills.length === 0 && (
                <div className="quick-add-skills">
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Quick add:</span>
                  {suggestedSkills.slice(0, 10).map(s => (
                    <button
                      key={s}
                      type="button"
                      className="quick-skill-btn"
                      onClick={() => addSkill(s)}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Team Config */}
          <motion.div className="form-section card" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            <div className="form-section-header">
              <Users size={20} />
              <h3>Team Configuration</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Maximum Members</label>
                <div className="member-counter">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => handleChange('max_members', Math.max(2, form.max_members - 1))}
                  >
                    −
                  </button>
                  <span className="counter-value">{form.max_members}</span>
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => handleChange('max_members', Math.min(10, form.max_members + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Meeting URL (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. https://meet.jit.si/my-team"
                  value={form.meeting_url}
                  onChange={e => handleChange('meeting_url', e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div className="form-section card preview-card" initial="hidden" animate="visible" variants={fadeUp} custom={5}>
            <div className="form-section-header">
              <Target size={20} />
              <h3>Preview</h3>
            </div>
            <div className="preview-content">
              <h4>{form.title || 'Your Project Title'}</h4>
              <p className="text-secondary">{form.description || 'Project description will appear here...'}</p>
              <div className="preview-meta">
                {form.category && <span className="badge badge-primary">{form.category}</span>}
                <span className="text-muted"><Users size={14} /> 1/{form.max_members} members</span>
              </div>
              {form.required_skills.length > 0 && (
                <div className="preview-skills">
                  {form.required_skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              )}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div className="form-actions" initial="hidden" animate="visible" variants={fadeUp} custom={6}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary btn-lg ${isSubmitting ? 'btn-loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><div className="loader loader-sm" /> Creating...</>
              ) : (
                <><Sparkles size={18} /> Create Project</>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
