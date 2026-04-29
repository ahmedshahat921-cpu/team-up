import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, LogOut, User, LayoutDashboard, Sun, Moon, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useThemeStore } from '../../stores/themeStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      useNotificationStore.getState().fetchNotifications(user.id);
    }
  }, [isAuthenticated, user?.id]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          Team<span>Up</span>
        </Link>

        {isAuthenticated ? (
          <>
            <ul className={`navbar-links ${menuOpen ? 'mobile-open' : ''}`}>
              <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
              <li><Link to="/projects" className={isActive('/projects')}>Projects</Link></li>
              <li><Link to="/ideas" className={isActive('/ideas')}>Idea Vault</Link></li>
              <li><Link to="/chat" className={isActive('/chat')}>Chat</Link></li>
              <li><Link to="/analytics" className={isActive('/analytics')}>Analytics</Link></li>
              {user?.role === 'professor' && (
                <li><Link to="/professor" className={isActive('/professor')}>Supervisor</Link></li>
              )}
            </ul>

            <div className="navbar-actions">
              {/* Theme Toggle */}
              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notifications */}
              <button className="notification-btn" onClick={() => navigate('/notifications')} title="Notifications">
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              {/* Profile Dropdown */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  className="avatar"
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(user?.full_name)
                  )}
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                      <span className={`badge badge-sm role-badge-${user?.role}`} style={{ marginTop: 4 }}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                    <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="dropdown-item">
                      <User size={16} /> Profile
                    </button>
                    <button onClick={() => { navigate('/analytics'); setProfileOpen(false); }} className="dropdown-item">
                      <LayoutDashboard size={16} /> Analytics
                    </button>
                    <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </>
        ) : (
          <>
            <ul className="navbar-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#about">About</a></li>
            </ul>
            <div className="navbar-actions">
              <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/auth" className="btn btn-outline btn-sm btn-pill">Sign Up</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
