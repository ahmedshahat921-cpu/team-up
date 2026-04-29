import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, BarChart3, PieChart as PieIcon, Users, FolderOpen,
  Download, FileSpreadsheet, Award, Target, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import '../styles/analytics.css';

const COLORS = ['#7c3aed', '#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#f97316', '#8b5cf6', '#14b8a6', '#ef4444'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Analytics() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [skillsDemand, setSkillsDemand] = useState([]);
  const [projectSlots, setProjectSlots] = useState([]);
  const [applicationStats, setApplicationStats] = useState([]);
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.get('/api/analytics');
      setStats(data.stats || {});
      setSkillsDemand(data.skillsDemand || []);
      setProjectSlots(data.projectSlots || []);
      setApplicationStats(data.applicationStats || []);
      setActivityData(data.activityData || []);
    } catch {
      // Demo data
      setStats({
        totalProjects: 24,
        openProjects: 12,
        totalStudents: 156,
        avgTeamSize: 4.2,
        completionRate: 78,
        matchRate: 65,
      });
      setSkillsDemand([
        { name: 'React', count: 42 },
        { name: 'Python', count: 38 },
        { name: 'Node.js', count: 35 },
        { name: 'AI/ML', count: 31 },
        { name: 'Java', count: 28 },
        { name: 'Flutter', count: 22 },
        { name: 'TypeScript', count: 20 },
        { name: 'PostgreSQL', count: 18 },
        { name: 'Docker', count: 15 },
        { name: 'AWS', count: 12 },
      ]);
      setProjectSlots([
        { name: 'Open', value: 12, color: '#22c55e' },
        { name: 'In Progress', value: 8, color: '#3b82f6' },
        { name: 'Completed', value: 4, color: '#7c3aed' },
      ]);
      setApplicationStats([
        { name: 'Pending', value: 15, color: '#f59e0b' },
        { name: 'Accepted', value: 28, color: '#22c55e' },
        { name: 'Rejected', value: 7, color: '#ef4444' },
      ]);
      setActivityData([
        { week: 'Week 1', projects: 3, applications: 8, matches: 5 },
        { week: 'Week 2', projects: 5, applications: 12, matches: 7 },
        { week: 'Week 3', projects: 4, applications: 15, matches: 9 },
        { week: 'Week 4', projects: 7, applications: 22, matches: 14 },
        { week: 'Week 5', projects: 6, applications: 18, matches: 11 },
        { week: 'Week 6', projects: 8, applications: 25, matches: 16 },
      ]);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Skills demand sheet
    const ws1 = XLSX.utils.json_to_sheet(skillsDemand);
    XLSX.utils.book_append_sheet(wb, ws1, 'Skills Demand');

    // Project stats sheet
    const ws2 = XLSX.utils.json_to_sheet(projectSlots);
    XLSX.utils.book_append_sheet(wb, ws2, 'Project Slots');

    // Activity sheet
    const ws3 = XLSX.utils.json_to_sheet(activityData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Weekly Activity');

    XLSX.writeFile(wb, `TeamUp_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('📊 Excel report downloaded!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TeamUp Analytics Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 28);
    doc.text(`User: ${user?.full_name} (${user?.role})`, 20, 34);

    doc.setFontSize(14);
    doc.text('Platform Statistics', 20, 48);
    doc.setFontSize(10);
    if (stats) {
      doc.text(`Total Projects: ${stats.totalProjects}`, 20, 58);
      doc.text(`Open Projects: ${stats.openProjects}`, 20, 64);
      doc.text(`Total Students: ${stats.totalStudents}`, 20, 70);
      doc.text(`Avg Team Size: ${stats.avgTeamSize}`, 20, 76);
      doc.text(`Completion Rate: ${stats.completionRate}%`, 20, 82);
    }

    doc.setFontSize(14);
    doc.text('Top Skills in Demand', 20, 96);
    doc.setFontSize(10);
    skillsDemand.forEach((s, i) => {
      doc.text(`${i + 1}. ${s.name}: ${s.count} projects`, 20, 106 + i * 6);
    });

    doc.save(`TeamUp_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📄 PDF report downloaded!');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  const statCards = stats ? [
    { icon: <FolderOpen size={22} />, label: 'Total Projects', value: stats.totalProjects, color: '#7c3aed' },
    { icon: <Target size={22} />, label: 'Open Projects', value: stats.openProjects, color: '#22c55e' },
    { icon: <Users size={22} />, label: 'Total Students', value: stats.totalStudents, color: '#3b82f6' },
    { icon: <Zap size={22} />, label: 'Match Rate', value: `${stats.matchRate}%`, color: '#f59e0b' },
    { icon: <Award size={22} />, label: 'Completion', value: `${stats.completionRate}%`, color: '#ec4899' },
    { icon: <TrendingUp size={22} />, label: 'Avg Team', value: stats.avgTeamSize, color: '#06b6d4' },
  ] : [];

  return (
    <div className="page">
      <div className="container">
        <motion.div className="analytics-header" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div>
            <h1>📊 Analytics Dashboard</h1>
            <p className="text-secondary">Platform insights & statistics for AASTMT TeamUp</p>
          </div>
          <div className="analytics-actions">
            <button className="btn btn-secondary btn-sm" onClick={exportToExcel}>
              <FileSpreadsheet size={16} /> Export Excel
            </button>
            <button className="btn btn-primary btn-sm" onClick={exportToPDF}>
              <Download size={16} /> Export PDF
            </button>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="analytics-stats">
          {statCards.map((s, i) => (
            <motion.div key={s.label} className="card analytics-stat-card" initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
              <div className="stat-icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="analytics-grid">
          {/* Skills Demand Bar Chart */}
          <motion.div className="card chart-card" initial="hidden" animate="visible" variants={fadeUp} custom={7}>
            <div className="chart-header">
              <h3><BarChart3 size={20} /> Most In-Demand Skills</h3>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="99%" height={300}>
                <BarChart data={skillsDemand} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Projects" radius={[0, 4, 4, 0]}>
                    {skillsDemand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Project Slots Pie Chart */}
          <motion.div className="card chart-card" initial="hidden" animate="visible" variants={fadeUp} custom={8}>
            <div className="chart-header">
              <h3><PieIcon size={20} /> Project Slots</h3>
            </div>
            <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="99%" height={300}>
                <PieChart>
                  <Pie
                    data={projectSlots}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    dataKey="value"
                    paddingAngle={5}
                  >
                    {projectSlots.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Application Tracking */}
          <motion.div className="card chart-card" initial="hidden" animate="visible" variants={fadeUp} custom={9}>
            <div className="chart-header">
              <h3><Target size={20} /> Application Status</h3>
            </div>
            <div className="chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="99%" height={300}>
                <PieChart>
                  <Pie
                    data={applicationStats}
                    cx="50%" cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {applicationStats.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Weekly Activity Area Chart */}
          <motion.div className="card chart-card chart-card-wide" initial="hidden" animate="visible" variants={fadeUp} custom={10}>
            <div className="chart-header">
              <h3><TrendingUp size={20} /> Weekly Activity</h3>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="99%" height={300}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="gradProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradApplications" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMatches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="projects" name="New Projects" stroke="#7c3aed" fill="url(#gradProjects)" strokeWidth={2} />
                  <Area type="monotone" dataKey="applications" name="Applications" stroke="#3b82f6" fill="url(#gradApplications)" strokeWidth={2} />
                  <Area type="monotone" dataKey="matches" name="Matches" stroke="#22c55e" fill="url(#gradMatches)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
