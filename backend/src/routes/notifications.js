import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification' });
  }
});

// Mark all as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', req.user.id).eq('read', false);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

export default router;
