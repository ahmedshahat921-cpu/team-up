import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import config from '../config/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * Generate a JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, reg_number: user.reg_number, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Validate Registration Number (exactly 9 digits)
 */
function isValidRegNumber(reg) {
  return /^\d{9}$/.test(reg);
}

/**
 * Sanitize user object (remove password_hash)
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

// ============================================================
// POST /api/auth/register
// Sign up using Registration Number
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { reg_number, password, role } = req.body;

    // Validate required fields
    if (!reg_number || !password) {
      return res.status(400).json({ error: 'Registration number and password are required.' });
    }

    if (!isValidRegNumber(reg_number)) {
      return res.status(400).json({ error: 'Registration number must be exactly 9 digits.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Validate role
    const validRoles = ['student', 'leader', 'professor'];
    const userRole = validRoles.includes(role) ? role : 'student';

    // Verify against university records
    const { data: record, error: recordError } = await supabase
      .from('university_records')
      .select('full_name, department, university')
      .eq('reg_number', reg_number)
      .single();

    if (recordError || !record) {
      return res.status(403).json({ error: 'Registration number not found in AASTMT university records.' });
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('reg_number', reg_number)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'An account with this registration number already exists.' });
    }

    // Extract batch year
    const prefix = reg_number.substring(0, 2);
    const batch_year = `20${prefix}`;

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        reg_number,
        password_hash,
        full_name: record.full_name,
        role: userRole,
        department: record.department,
        university: record.university || 'AASTMT',
        batch_year,
        skills: [],
        reputation_score: 0,
      })
      .select('id, reg_number, full_name, role, avatar_url, bio, skills, reputation_score, department, university, batch_year, created_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message);
    }

    const token = generateToken(user);

    console.log(`✅ New user registered: ${user.reg_number} (${user.role})`);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Registration failed. Please try again.' });
  }
});

// ============================================================
// POST /api/auth/login
// Login with Registration Number and password
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { reg_number, password } = req.body;

    if (!reg_number || !password) {
      return res.status(400).json({ error: 'Registration number and password are required.' });
    }

    // Find user by reg_number
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('reg_number', reg_number)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid registration number or password.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid registration number or password.' });
    }

    // Update online status
    await supabase
      .from('users')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', user.id);

    const token = generateToken(user);
    const safeUser = sanitizeUser(user);

    console.log(`✅ User logged in: ${user.reg_number} (${user.role})`);
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ============================================================
// GET /api/auth/me
// Get current authenticated user's profile
// ============================================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, reg_number, full_name, role, avatar_url, bio, skills, reputation_score, department, university, batch_year, cv_url, is_online, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user profile.' });
  }
});

// ============================================================
// PUT /api/auth/profile
// Update user profile fields
// ============================================================
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const allowedFields = ['full_name', 'bio', 'department', 'skills', 'avatar_url', 'university'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, reg_number, full_name, role, avatar_url, bio, skills, reputation_score, department, university, batch_year, created_at')
      .single();

    if (error) throw error;

    console.log(`✅ Profile updated: ${user.reg_number}`);
    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ============================================================
// PATCH /api/auth/role
// Change user role (e.g., student → leader when they create a project)
// ============================================================
router.patch('/role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['student', 'leader', 'professor'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: student, leader, or professor.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.user.id)
      .select('id, reg_number, full_name, role, avatar_url, bio, skills, reputation_score, department, batch_year')
      .single();

    if (error) throw error;

    // Generate new token with updated role
    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    console.error('Role change error:', err);
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

// ============================================================
// POST /api/auth/change-password
// Change password (requires current password)
// ============================================================
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    // Get current user with password hash
    const { data: user } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.user.id)
      .single();

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', req.user.id);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ============================================================
// POST /api/auth/logout
// Mark user as offline
// ============================================================
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await supabase
      .from('users')
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq('id', req.user.id);

    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed.' });
  }
});

// ============================================================
// GET /api/auth/users
// Get all users (for team member search/invite)
// ============================================================
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const { search, role } = req.query;
    let query = supabase
      .from('users')
      .select('id, full_name, reg_number, role, avatar_url, skills, reputation_score, department, batch_year, is_online')
      .order('reputation_score', { ascending: false })
      .limit(50);

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,reg_number.ilike.%${search}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    res.json({ users: users || [] });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

export default router;
