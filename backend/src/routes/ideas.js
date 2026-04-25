import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Get all ideas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('*, author:users!author_id(full_name, role, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if user liked each idea
    const { data: likes } = await supabase
      .from('idea_likes')
      .select('idea_id')
      .eq('user_id', req.user.id);

    const likedIds = new Set((likes || []).map(l => l.idea_id));
    const enriched = (ideas || []).map(i => ({ ...i, liked: likedIds.has(i.id) }));

    res.json({ ideas: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
});

// Create idea
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, required_skills, category } = req.body;
    const { data: user } = await supabase.from('users').select('role').eq('id', req.user.id).single();

    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({
        title,
        description,
        required_skills: required_skills || [],
        category,
        author_id: req.user.id,
        is_professor_idea: user?.role === 'professor',
      })
      .select('*, author:users!author_id(full_name, role)')
      .single();

    if (error) throw error;
    res.status(201).json({ idea });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

// Toggle like
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('idea_likes')
      .select('id')
      .eq('idea_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      await supabase.from('idea_likes').delete().eq('id', existing.id);
      res.json({ liked: false });
    } else {
      await supabase.from('idea_likes').insert({ idea_id: req.params.id, user_id: req.user.id });
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
