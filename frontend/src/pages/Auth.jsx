import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, BookOpen, Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import '../styles/auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    reg_number: '', password: '', role: 'student',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.reg_number.length !== 9 || !/^\d{9}$/.test(form.reg_number)) {
      toast.error('Registration number must be exactly 9 digits.');
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(form.reg_number, form.password);
        if (res.success) {
          toast.success('Welcome back!');
          navigate('/dashboard');
        } else {
          toast.error(res.error || 'Login failed');
        }
      } else {
        const res = await register(form);
        if (res.success) {
          toast.success('Account created successfully!');
          navigate('/dashboard');
        } else {
          toast.error(res.error || 'Registration failed');
        }
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={32} color="var(--primary-light)" />
          </div>
          <h1>Team<span style={{ color: 'var(--primary-light)' }}>Up</span></h1>
          <p>{isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="input-group" style={{ marginTop: 0 }}>
                  <label>Role</label>
                  <select name="role" className="input" value={form.role} onChange={handleChange}>
                    <option value="student">Student</option>
                    <option value="leader">Team Leader</option>
                    <option value="professor">Professor / Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="auth-notice" style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <User size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Your name and department will be automatically imported from AASTMT records.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group" style={{ marginTop: isLogin ? 0 : 16 }}>
            <label>Registration Number</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                name="reg_number"
                type="text"
                maxLength="9"
                className="input"
                placeholder="e.g. 211001234"
                value={form.reg_number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: 16 }}>
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 24 }}
          >
            {loading ? (
              <span className="loader loader-sm" style={{ borderTopColor: 'white' }} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
