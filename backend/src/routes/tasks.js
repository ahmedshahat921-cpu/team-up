import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Get tasks for a project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, assigned_user:users!assigned_to(full_name, avatar_url)')
      .eq('project_id', req.params.projectId)
      .order('position');

    if (error) throw error;
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { project_id, title, description, priority, assigned_to, due_date, status } = req.body;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({ project_id, title, description, priority: priority || 'medium', assigned_to, due_date, status: status || 'todo' })
      .select()
      .single();

    if (error) throw error;

    // Notify assigned user
    if (assigned_to) {
      await supabase.from('notifications').insert({
        user_id: assigned_to,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You've been assigned: "${title}"`,
        link: `/tasks`,
      });
    }

    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task (status, assignment, etc.)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
