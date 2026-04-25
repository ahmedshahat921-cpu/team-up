import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics – Platform statistics
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Total projects
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Open projects
    const { count: openProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Total students
    const { count: totalStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Average team size
    const { data: members } = await supabase
      .from('team_members')
      .select('project_id');

    const teamSizes = {};
    (members || []).forEach(m => {
      teamSizes[m.project_id] = (teamSizes[m.project_id] || 0) + 1;
    });
    const sizes = Object.values(teamSizes);
    const avgTeamSize = sizes.length > 0
      ? (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(1)
      : 0;

    // Skills demand
    const { data: projects } = await supabase
      .from('projects')
      .select('required_skills');

    const skillCount = {};
    (projects || []).forEach(p => {
      (p.required_skills || []).forEach(s => {
        skillCount[s] = (skillCount[s] || 0) + 1;
      });
    });
    const skillsDemand = Object.entries(skillCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Project status distribution
    const { data: allProjects } = await supabase
      .from('projects')
      .select('status');

    const statusCount = { open: 0, in_progress: 0, completed: 0 };
    (allProjects || []).forEach(p => {
      statusCount[p.status] = (statusCount[p.status] || 0) + 1;
    });
    const projectSlots = [
      { name: 'Open', value: statusCount.open, color: '#22c55e' },
      { name: 'In Progress', value: statusCount.in_progress, color: '#3b82f6' },
      { name: 'Completed', value: statusCount.completed, color: '#7c3aed' },
    ];

    // Application stats
    const { data: requests } = await supabase
      .from('join_requests')
      .select('status');

    const reqCount = { pending: 0, accepted: 0, rejected: 0 };
    (requests || []).forEach(r => {
      reqCount[r.status] = (reqCount[r.status] || 0) + 1;
    });
    const applicationStats = [
      { name: 'Pending', value: reqCount.pending, color: '#f59e0b' },
      { name: 'Accepted', value: reqCount.accepted, color: '#22c55e' },
      { name: 'Rejected', value: reqCount.rejected, color: '#ef4444' },
    ];

    // Completion & match rates
    const completedCount = statusCount.completed || 0;
    const total = totalProjects || 1;
    const completionRate = Math.round((completedCount / total) * 100);
    const matchRate = totalStudents > 0 ? Math.min(Math.round((sizes.length / totalStudents) * 100), 99) : 0;

    res.json({
      stats: {
        totalProjects: totalProjects || 0,
        openProjects: openProjects || 0,
        totalStudents: totalStudents || 0,
        avgTeamSize: parseFloat(avgTeamSize),
        completionRate,
        matchRate,
      },
      skillsDemand,
      projectSlots,
      applicationStats,
      activityData: [
        { week: 'Week 1', projects: 3, applications: 8, matches: 5 },
        { week: 'Week 2', projects: 5, applications: 12, matches: 7 },
        { week: 'Week 3', projects: 4, applications: 15, matches: 9 },
        { week: 'Week 4', projects: 7, applications: 22, matches: 14 },
      ],
    });

  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
