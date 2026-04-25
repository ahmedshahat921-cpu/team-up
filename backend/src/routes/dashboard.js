import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get user's projects
    const { data: memberships } = await supabase
      .from('team_members')
      .select('project_id')
      .eq('user_id', req.user.id);

    const projectIds = (memberships || []).map(m => m.project_id);

    // Stats
    const projectCount = projectIds.length;

    let taskCount = 0;
    let messageCount = 0;
    let memberCount = 0;

    if (projectIds.length > 0) {
      const { count: tc } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).in('project_id', projectIds);
      taskCount = tc || 0;

      const { count: mc } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('project_id', projectIds);
      messageCount = mc || 0;

      const { count: memc } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).in('project_id', projectIds);
      memberCount = memc || 0;
    }

    // Recent projects
    let recentProjects = [];
    if (projectIds.length > 0) {
      const { data } = await supabase
        .from('projects')
        .select('id, title, status, required_skills')
        .in('id', projectIds)
        .order('created_at', { ascending: false })
        .limit(5);
      recentProjects = data || [];

      for (const p of recentProjects) {
        const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('project_id', p.id);
        p.member_count = count || 0;
      }
    }

    // Upcoming tasks
    let upcomingTasks = [];
    if (projectIds.length > 0) {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority, project_id')
        .in('project_id', projectIds)
        .neq('status', 'done')
        .order('due_date')
        .limit(5);

      upcomingTasks = data || [];
      for (const t of upcomingTasks) {
        const { data: p } = await supabase.from('projects').select('title').eq('id', t.project_id).single();
        t.project_title = p?.title || '';
      }
    }

    res.json({
      stats: { projects: projectCount, tasks: taskCount, messages: messageCount, members: memberCount },
      recentProjects,
      upcomingTasks,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;
