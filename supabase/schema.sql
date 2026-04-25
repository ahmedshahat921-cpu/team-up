-- ============================================
-- TeamUp Database Schema
-- Academic Platform for Student Team Formation
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'leader', 'professor')),
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  reputation_score DECIMAL(3,2) DEFAULT 0.00,
  university VARCHAR(255) DEFAULT 'AASTMT',
  department VARCHAR(255),
  cv_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  required_skills TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'archived')),
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_members INT DEFAULT 5,
  meeting_url TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================
-- 4. JOIN REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('join', 'invite', 'supervise')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. MESSAGES TABLE (Group Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'code', 'file', 'image', 'system')),
  file_url TEXT,
  file_name VARCHAR(255),
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PRIVATE MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'code', 'file', 'image')),
  file_url TEXT,
  file_name VARCHAR(255),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. MEETINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  meeting_url TEXT NOT NULL,
  recording_url TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. ENDORSEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill VARCHAR(100) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id, project_id, skill)
);

-- ============================================
-- 10. IDEAS TABLE (Idea Vault)
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_professor_idea BOOLEAN DEFAULT false,
  required_skills TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  likes_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'taken', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. IDEA LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS idea_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- ============================================
-- 12. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_team_members_project ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_project ON join_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_endorsements_to ON endorsements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_author ON ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON meetings(project_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update reputation score
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET reputation_score = (
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
    FROM endorsements
    WHERE to_user_id = NEW.to_user_id
  )
  WHERE id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update reputation on endorsement
CREATE OR REPLACE TRIGGER trigger_update_reputation
AFTER INSERT OR UPDATE ON endorsements
FOR EACH ROW
EXECUTE FUNCTION update_reputation_score();

-- Function to update idea likes count
CREATE OR REPLACE FUNCTION update_idea_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET likes_count = likes_count + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET likes_count = likes_count - 1 WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for idea likes
CREATE OR REPLACE TRIGGER trigger_update_idea_likes
AFTER INSERT OR DELETE ON idea_likes
FOR EACH ROW
EXECUTE FUNCTION update_idea_likes_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_projects_updated_at
BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_ideas_updated_at
BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for development, tighten for production)
-- Allow all operations for authenticated users (via service role key from backend)
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON join_requests FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON private_messages FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON meetings FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON endorsements FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON ideas FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON idea_likes FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON notifications FOR ALL USING (true);

-- Enable Realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
