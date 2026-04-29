import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, BookOpen, Star, Upload, Save, Award, Code2,
  Sparkles, Users, Percent, ChevronRight, Lock, Check
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    department: user?.department || '',
    skills: user?.skills || [],
  });
  const [newSkill, setNewSkill] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [showExtracted, setShowExtracted] = useState(false);

  // AI Team Matching
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);

  // Password change
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  // Sync form with user data
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        bio: user.bio || '',
        department: user.department || '',
        skills: user.skills || [],
      });
    }
  }, [user]);

  const handleSave = async () => {
    const res = await updateProfile(form);
    if (res.success) {
      toast.success('Profile updated!');
      setEditing(false);
    } else {
      toast.error(res.error || 'Update failed');
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
      setForm({ ...form, skills: [...form.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter(s => s !== skill) });
  };

  // ---- Profile Image Upload ----
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatar_url = publicUrlData.publicUrl;

      // Update backend
      const res = await updateProfile({ avatar_url });
      if (res.success) {
        toast.success('Profile picture updated!');
      } else {
        toast.error('Failed to save profile picture');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Could not upload image.');
    }
    setImageUploading(false);
  };

  // ---- CV Upload with AI Skill Extraction ----
  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB.');
      return;
    }

    setUploading(true);
    setExtractedSkills([]);
    setShowExtracted(false);

    try {
      const formData = new FormData();
      formData.append('cv', file);

      const data = await api.upload('/api/ai/extract-skills', formData);

      if (data.skills && data.skills.length > 0) {
        setExtractedSkills(data.skills);
        setShowExtracted(true);
        toast.success(`🤖 AI extracted ${data.skills.length} skills from your CV!`);
      } else {
        toast.error('No skills could be extracted from this CV.');
      }

      if (data.message) {
        console.log('AI message:', data.message);
      }
    } catch (err) {
      console.error('CV upload error:', err);
      toast.error('CV processing failed. Try again or add skills manually.');
    }

    setUploading(false);
    // Reset the file input
    e.target.value = '';
  };

  // Add extracted skills to profile
  const acceptExtractedSkills = () => {
    const merged = [...new Set([...form.skills, ...extractedSkills])];
    setForm({ ...form, skills: merged });
    setShowExtracted(false);
    toast.success(`Added ${extractedSkills.length} skills to your profile. Don't forget to save!`);
  };

  // ---- AI Team Matching ----
  const handleFindTeams = async () => {
    const skills = form.skills.length > 0 ? form.skills : user?.skills || [];
    if (skills.length === 0) {
      toast.error('Add skills to your profile first (or upload your CV).');
      return;
    }

    setMatching(true);
    setMatches([]);

    try {
      const data = await api.post('/api/ai/match-teams', { userSkills: skills });
      setMatches(data.matches || []);
      setShowMatches(true);

      if (data.matches?.length > 0) {
        toast.success(`🎯 Found ${data.matches.length} matching teams!`);
      } else {
        toast.error('No matching teams found. Try adding more skills.');
      }
    } catch (err) {
      toast.error('Team matching failed.');
    }

    setMatching(false);
  };

  // ---- Password Change ----
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    const res = await changePassword(pwForm.currentPassword, pwForm.newPassword);
    if (res.success) {
      toast.success('Password changed!');
      setShowPwChange(false);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } else {
      toast.error(res.error || 'Failed to change password.');
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const displaySkills = form.skills.length > 0 ? form.skills : (user?.skills?.length > 0 ? user.skills : []);
  const reputation = user?.reputation_score || 0;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 40 }}>

          {/* ---- Avatar & Header ---- */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
            <div className="avatar avatar-xl" style={{ fontSize: '1.6rem', position: 'relative', overflow: 'hidden' }}>
              {imageUploading ? (
                <span className="loader loader-sm" />
              ) : user?.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : getInitials(user?.full_name || form.full_name)}
              {editing && (
                <label style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', 
                  color: 'white', fontSize: '0.65rem', textAlign: 'center', padding: '4px 0', 
                  cursor: 'pointer', opacity: 0.9
                }}>
                  UPLOAD
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>{user?.full_name || 'Your Name'}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className={`badge badge-${user?.role === 'professor' ? 'warning' : user?.role === 'leader' ? 'info' : 'primary'}`}>
                  {user?.role || 'student'}
                </span>
                {reputation > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)' }}>
                    <Star size={16} fill="currentColor" /> {reputation}
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</span>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* ---- Bio ---- */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} /> About
            </h3>
            {editing ? (
              <textarea className="input" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us about yourself, your interests, and what you're looking for in a team..." style={{ width: '100%' }} />
            ) : (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {user?.bio || 'No bio yet. Click "Edit Profile" to add one.'}
              </p>
            )}
          </div>

          {/* ---- Department ---- */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} /> Department
            </h3>
            {editing ? (
              <input className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Computer Science" style={{ width: '100%' }} />
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>{user?.department || 'Not set'}</p>
            )}
          </div>

          {/* ---- Skills ---- */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code2 size={18} /> Skills
              {displaySkills.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({displaySkills.length})
                </span>
              )}
            </h3>
            {displaySkills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: editing ? 12 : 0 }}>
                {displaySkills.map(skill => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    {editing && (
                      <button onClick={() => removeSkill(skill)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: 4, fontSize: '1rem', lineHeight: 1 }}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No skills added yet. Upload your CV below or add skills manually.
              </p>
            )}
            {editing && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="input" placeholder="Add a skill (e.g. React, Python)..." value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  style={{ flex: 1 }} />
                <button className="btn btn-secondary" onClick={addSkill}>Add</button>
              </div>
            )}
          </div>

          {/* ---- CV Upload / AI Extraction ---- */}
          <div style={{ marginBottom: 28, padding: 20, background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--primary-light)" /> AI Skill Extraction
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
              Upload your CV (PDF) and our AI powered by Google Gemini will automatically extract your technical skills.
            </p>
            <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
              {uploading ? <span className="loader loader-sm" /> : <Upload size={16} />}
              {uploading ? 'Analyzing CV...' : 'Upload PDF'}
              <input type="file" accept=".pdf" onChange={handleCvUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>

            {/* Extracted Skills Review */}
            <AnimatePresence>
              {showExtracted && extractedSkills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 16, padding: 16, background: 'rgba(124,58,237,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-light)' }}>
                      🤖 AI Extracted {extractedSkills.length} Skills:
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={acceptExtractedSkills}>
                      <Check size={14} /> Add All to Profile
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {extractedSkills.map(s => (
                      <span key={s} className="skill-tag" style={{ background: 'rgba(124,58,237,0.2)', borderColor: 'var(--primary)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ---- AI Team Matching ---- */}
          <div style={{ marginBottom: 28, padding: 20, background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--accent-cyan)" /> AI Team Matching
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
              Find the best teams for you based on your skills. Our AI analyzes compatibility with open projects.
            </p>
            <button className="btn btn-outline" onClick={handleFindTeams} disabled={matching}>
              {matching ? <span className="loader loader-sm" /> : <Sparkles size={16} />}
              {matching ? 'Finding matches...' : 'Find My Best Teams'}
            </button>

            <AnimatePresence>
              {showMatches && matches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 16 }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, color: 'var(--accent-cyan)' }}>
                    🎯 Top {matches.length} Matching Teams:
                  </div>
                  {matches.map((m, i) => (
                    <motion.div key={m.projectId || i}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      style={{
                        padding: 14, marginBottom: 10, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                        background: m.compatibility >= 75 ? 'rgba(34,197,94,0.15)' : m.compatibility >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                        color: m.compatibility >= 75 ? 'var(--success)' : m.compatibility >= 50 ? 'var(--warning)' : 'var(--danger)',
                      }}>
                        {m.compatibility}%
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.projectTitle}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.reason}</div>
                        {m.required_skills && m.required_skills.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Required:</span>
                            {m.required_skills.slice(0, 4).map(s => (
                              <span key={s} className="skill-tag" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{s}</span>
                            ))}
                          </div>
                        )}
                        {m.missing_skills && m.missing_skills.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>Missing:</span>
                            {m.missing_skills.slice(0, 4).map(s => (
                              <span key={s} className="skill-tag" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>
                        <Users size={14} /> {m.member_count || 0}/{m.max_members || 5}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ---- Password Change ---- */}
          <div style={{ marginBottom: 28 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPwChange(!showPwChange)}
              style={{ gap: 6 }}
            >
              <Lock size={16} /> Change Password
            </button>

            <AnimatePresence>
              {showPwChange && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handlePasswordChange}
                  style={{ marginTop: 16 }}
                >
                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <label>Current Password</label>
                    <input type="password" className="input" value={pwForm.currentPassword}
                      onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
                  </div>
                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <label>New Password</label>
                    <input type="password" className="input" value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 16 }}>
                    <label>Confirm New Password</label>
                    <input type="password" className="input" value={pwForm.confirm}
                      onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">Update Password</button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* ---- Save Button ---- */}
          {editing && (
            <button className="btn btn-primary btn-lg" onClick={handleSave} style={{ width: '100%' }}>
              <Save size={18} /> Save Changes
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
