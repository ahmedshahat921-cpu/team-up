import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import config from '../config/index.js';

const router = Router();

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*, leader:users!leader_id(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get member counts
    for (const p of projects) {
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id);
      p.member_count = count || 0;
    }

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, required_skills, max_members, category } = req.body;

    // Generate Jitsi meeting link
    const meetingId = `teamup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meeting_url = `https://${config.jitsi.domain}/${meetingId}`;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        required_skills: required_skills || [],
        max_members: max_members || 5,
        category,
        leader_id: req.user.id,
        meeting_url,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as team leader
    await supabase.from('team_members').insert({
      project_id: project.id,
      user_id: req.user.id,
      role: 'leader',
    });

    // Update user role to leader if student
    await supabase.from('users').update({ role: 'leader' }).eq('id', req.user.id).eq('role', 'student');

    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get single project
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*, leader:users!leader_id(full_name, avatar_url, email)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const { data: members } = await supabase
      .from('team_members')
      .select('*, user:users(id, full_name, avatar_url, skills, reputation_score)')
      .eq('project_id', req.params.id);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', req.params.id)
      .order('position');

    res.json({ project, members: members || [], tasks: tasks || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Send join request
router.post('/:id/request', authMiddleware, async (req, res) => {
  try {
    const { type, message } = req.body;

    const { data, error } = await supabase
      .from('join_requests')
      .insert({
        project_id: req.params.id,
        user_id: req.user.id,
        type: type || 'join',
        message,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for project leader
    const { data: project } = await supabase.from('projects').select('leader_id, title').eq('id', req.params.id).single();
    if (project) {
      await supabase.from('notifications').insert({
        user_id: project.leader_id,
        type: 'join_request',
        title: 'New Join Request',
        message: `Someone requested to join "${project.title}"`,
        link: `/projects/${req.params.id}`,
      });
    }

    res.status(201).json({ request: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Accept/reject request
router.patch('/requests/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    const { data: request, error } = await supabase
      .from('join_requests')
      .update({ status })
      .eq('id', req.params.id)
      .select('*, project:projects(title)')
      .single();

    if (error) throw error;

    if (status === 'accepted') {
      await supabase.from('team_members').insert({
        project_id: request.project_id,
        user_id: request.user_id,
        role: 'member',
      });

      await supabase.from('notifications').insert({
        user_id: request.user_id,
        type: 'request_accepted',
        title: 'Request Accepted!',
        message: `You were accepted into "${request.project?.title}"`,
        link: `/projects/${request.project_id}`,
      });
    }

    res.json({ request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

export default router;
