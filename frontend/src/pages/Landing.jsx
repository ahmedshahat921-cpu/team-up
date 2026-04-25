import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, MessageSquare, BarChart3, Lightbulb, CheckCircle, Zap,
  ArrowRight, Star, Code2, Video, ClipboardList, Shield
} from 'lucide-react';
import '../styles/landing.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  }),
};

const features = [
  { icon: <Users size={28} />, title: 'Smart Team Matching', desc: 'AI analyzes your skills and suggests the best teams with compatibility scores.' },
  { icon: <MessageSquare size={28} />, title: 'Real-time Chat', desc: 'Instant group and private messaging with code blocks, files, and @mentions.' },
  { icon: <ClipboardList size={28} />, title: 'Task Board', desc: 'Drag & drop Kanban board with priorities, due dates, and smart assignments.' },
  { icon: <Video size={28} />, title: 'Video Meetings', desc: 'Integrated video calls with scheduling, reminders, and recording support.' },
  { icon: <Lightbulb size={28} />, title: 'Idea Vault', desc: 'Browse and post project ideas. Professors share topics students can apply to.' },
  { icon: <Star size={28} />, title: 'Skill Endorsements', desc: 'Rate teammates after projects. Build your reputation and showcase expertise.' },
];

const services = [
  { icon: <BarChart3 size={24} />, title: 'Analytics', desc: 'Track team performance with quantitative and qualitative analysis tools.' },
  { icon: <Code2 size={24} />, title: 'Team Management', desc: 'Organize, lead, and coordinate your group with powerful management tools.' },
  { icon: <Shield size={24} />, title: 'AI-Powered CVs', desc: 'Upload your CV and let AI extract your skills automatically.' },
  { icon: <Zap size={24} />, title: 'Automation', desc: 'Automatic reminders, notifications, and deadline tracking.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-bg-orb hero-orb-3" />

        <div className="container hero-content">
          <motion.div className="hero-text" initial="hidden" animate="visible" variants={fadeUp}>
            <motion.span className="hero-badge" variants={fadeUp} custom={0}>
              <Zap size={14} /> TEAM MANAGEMENT MADE EASY
            </motion.span>
            <motion.h1 variants={fadeUp} custom={1}>
              <span className="hero-cursive">Ready to get started?</span>
              <br />
              Save time with
              <br />
              better <span className="text-gradient">tools.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}>
              TeamUp is the first academic platform designed to help university students
              find teams, manage projects, and collaborate effectively.
            </motion.p>
            <motion.div className="hero-cta" variants={fadeUp} custom={3}>
              <div className="hero-input-group">
                <input type="email" placeholder="Enter your email address" className="input hero-input" />
                <Link to="/auth" className="btn btn-primary btn-lg">Get Started</Link>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="hero-card-stack">
              <div className="hero-phone">
                <div className="phone-header">
                  <div className="phone-notch" />
                </div>
                <div className="phone-content">
                  <div className="phone-section">
                    <div className="phone-label">Upcoming</div>
                    <div className="phone-time">17:30</div>
                    <div className="phone-task">UX Wireframes</div>
                  </div>
                  <div className="phone-avatars">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="phone-avatar" style={{ background: `hsl(${i * 60}, 70%, 60%)` }} />
                    ))}
                  </div>
                  <div className="phone-tasks">
                    <div className="phone-task-item active">
                      <div className="task-dot" style={{ background: 'var(--primary)' }} />
                      Prepare Figma file
                    </div>
                    <div className="phone-task-item">
                      <div className="task-dot" style={{ background: 'var(--accent-cyan)' }} />
                      Get materials from client
                    </div>
                    <div className="phone-task-item">
                      <div className="task-dot" style={{ background: 'var(--accent-pink)' }} />
                      Design UX Wireframes
                    </div>
                  </div>
                  <div className="phone-progress">
                    <div className="phone-progress-label">Project Status</div>
                    <div className="phone-progress-value">20<span>/30</span></div>
                    <div className="phone-progress-sub">Tasks completed</div>
                    <div className="phone-progress-bar">
                      <div className="phone-progress-fill" style={{ width: '66%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="trusted">
        <div className="container">
          <p className="trusted-label">Trusted by</p>
          <div className="trusted-logos">
            {['AASTMT', 'Engineering', 'CS Dept', 'AI Lab'].map((name, i) => (
              <motion.div
                key={name}
                className="trusted-logo"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="services" id="services">
        <div className="container">
          <div className="services-header">
            <div>
              <h2>Services<br />we provide</h2>
            </div>
            <div>
              <p>Effective team management involves providing feedback and coaching to team members to help them develop their skills.</p>
              <Link to="/auth" className="btn btn-outline" style={{ marginTop: 16 }}>
                All Services <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="grid-4" style={{ marginTop: 48 }}>
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                className="card card-glow service-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="hero-badge"><CheckCircle size={14} /> FEATURES</span>
            <h2>Our cool features</h2>
            <p>Everything you need to form teams, manage projects, and succeed academically.</p>
          </motion.div>
          <div className="grid-3" style={{ marginTop: 48 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="card card-glow feature-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2>Ready to build your dream team?</h2>
            <p>Join thousands of students already using TeamUp to find teammates, manage projects, and succeed together.</p>
            <Link to="/auth" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="navbar-logo">Team<span>Up</span></div>
              <p>The academic platform for student team formation and project management.</p>
            </div>
            <div className="footer-links">
              <div>
                <h4>Platform</h4>
                <a href="#features">Features</a>
                <a href="#services">Services</a>
                <Link to="/auth">Sign Up</Link>
              </div>
              <div>
                <h4>Support</h4>
                <a href="#">Help Center</a>
                <a href="#">Contact</a>
                <a href="#">Privacy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 TeamUp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
