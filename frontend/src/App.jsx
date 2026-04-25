import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import IdeaVault from './pages/IdeaVault';
import TaskBoard from './pages/TaskBoard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import AIAssistant from './pages/AIAssistant';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import FloatingWidgets from './components/ui/FloatingWidgets';
import './index.css';
import './styles/components.css';
import './styles/floating.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="loader-container" style={{ minHeight: '100vh' }}>
        <div className="logo-loader">
          <div className="loader loader-lg" />
          <div className="logo-loader-text">TeamUp</div>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/auth" />;
}

export default function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    initTheme();
  }, []);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'white' } },
        }}
      />
      <Navbar />
      {isAuthenticated && <FloatingWidgets />}
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/ideas" element={<ProtectedRoute><IdeaVault /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
        <Route path="/professor" element={<ProtectedRoute><ProfessorDashboard /></ProtectedRoute>} />
        <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
