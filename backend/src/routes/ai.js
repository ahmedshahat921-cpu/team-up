import { Router } from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import { authMiddleware } from '../middleware/auth.js';
import config from '../config/index.js';
import supabase from '../config/supabase.js';

const router = Router();
const require = createRequire(import.meta.url);

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

/**
 * Helper: Call Gemini API
 */
async function callGemini(prompt) {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error:', response.status, errorBody);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

/**
 * Helper: Extract JSON from Gemini response (handles markdown code blocks)
 */
function extractJSON(text) {
  // Remove markdown code block wrappers if present
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

// ============================================================
// POST /api/ai/extract-skills
// Upload CV (PDF) → AI extracts skills automatically
// ============================================================
router.post('/extract-skills', authMiddleware, upload.single('cv'), async (req, res) => {
  try {
    let cvText = '';

    // 1. If a PDF file was uploaded, extract text from it
    if (req.file) {
      try {
        const pdfParseModule = require('pdf-parse');
        const pdfParse = pdfParseModule.PDFParse || pdfParseModule;
        const pdfData = await pdfParse(req.file.buffer);
        cvText = pdfData.text;
        console.log(`PDF parsed successfully: ${cvText.length} characters extracted`);
      } catch (pdfErr) {
        console.error('PDF parsing error:', pdfErr.message);
        // Fall through to check req.body.text
      }
    }

    // 2. If no PDF or parsing failed, use raw text from body
    if (!cvText && req.body.text) {
      cvText = req.body.text;
    }

    // 3. If still no text, return error
    if (!cvText || cvText.trim().length < 10) {
      return res.status(400).json({
        error: 'No readable content found. Please upload a valid PDF or provide text.',
        skills: [],
      });
    }

    // 4. If no Gemini API key, return demo skills
    if (!config.gemini.apiKey) {
      console.log('No Gemini API key configured – returning demo skills');
      return res.json({
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'REST APIs', 'Problem Solving'],
        message: 'Demo mode: Gemini API key not configured. Add GEMINI_API_KEY to .env for real extraction.',
      });
    }

    // 5. Call Gemini to extract skills
    const prompt = `You are a skill extraction AI. Analyze the following CV/resume text and extract all technical and professional skills mentioned.

Rules:
- Return ONLY a JSON array of strings, e.g. ["React", "Python", "Machine Learning"]
- Include programming languages, frameworks, tools, databases, soft skills, and domain expertise
- Normalize skill names (e.g. "JS" → "JavaScript", "ML" → "Machine Learning")  
- Remove duplicates
- Maximum 25 skills
- Do NOT include any explanatory text, only the JSON array

CV Text:
"""
${cvText.substring(0, 8000)}
"""`;

    const responseText = await callGemini(prompt);
    const skills = extractJSON(responseText);

    if (!Array.isArray(skills)) {
      throw new Error('Gemini did not return a valid array');
    }

    // 6. Optionally update user's skills in the database
    if (req.user?.id && skills.length > 0) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('skills')
        .eq('id', req.user.id)
        .single();

      const existingSkills = currentUser?.skills || [];
      const mergedSkills = [...new Set([...existingSkills, ...skills])];

      await supabase
        .from('users')
        .update({ skills: mergedSkills })
        .eq('id', req.user.id);
    }

    console.log(`Extracted ${skills.length} skills via Gemini AI`);
    res.json({ skills, message: `Successfully extracted ${skills.length} skills from your CV.` });

  } catch (err) {
    console.error('Skill extraction error:', err.message);
    // Return graceful fallback
    res.json({
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      message: 'AI extraction encountered an error. Showing default skills. Error: ' + err.message,
    });
  }
});

// ============================================================
// POST /api/ai/match-teams
// Suggest best matching teams with compatibility score (%)
// ============================================================
router.post('/match-teams', authMiddleware, async (req, res) => {
  try {
    // Get user's skills
    const { data: user } = await supabase
      .from('users')
      .select('skills, full_name')
      .eq('id', req.user.id)
      .single();

    const userSkills = req.body.userSkills || user?.skills || [];

    if (userSkills.length === 0) {
      return res.json({
        matches: [],
        message: 'No skills found on your profile. Upload your CV or add skills first.',
      });
    }

    // Get open projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, description, required_skills, status, max_members')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!projects || projects.length === 0) {
      return res.json({ matches: [], message: 'No open projects found.' });
    }

    // Check member counts
    for (const p of projects) {
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id);
      p.member_count = count || 0;
    }

    // Filter out full projects
    const available = projects.filter(p => p.member_count < (p.max_members || 5));

    if (!config.gemini.apiKey) {
      // Demo mode: simple skill-matching algorithm
      const matches = available.map(p => {
        const required = (p.required_skills || []).map(s => s.toLowerCase());
        const userLower = userSkills.map(s => s.toLowerCase());
        const missing_skills = p.required_skills.filter(s => !userLower.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)));
        const matchCount = required.length - missing_skills.length;
        const compatibility = required.length > 0
          ? Math.round((matchCount / required.length) * 100)
          : 50;
        return {
          projectId: p.id,
          projectTitle: p.title,
          compatibility: Math.min(compatibility, 99),
          reason: matchCount > 0
            ? `${matchCount}/${required.length} required skills match your profile`
            : 'General fit based on project requirements',
          required_skills: p.required_skills,
          missing_skills: missing_skills,
          member_count: p.member_count,
          max_members: p.max_members,
        };
      });

      matches.sort((a, b) => b.compatibility - a.compatibility);
      return res.json({ matches: matches.slice(0, 10), message: 'Demo mode matching.' });
    }

    // Real Gemini-based matching
    const prompt = `You are a team-matching AI for a university platform. Given a student's skills and a list of open projects, rate compatibility.

Student Skills: ${JSON.stringify(userSkills)}

Open Projects:
${available.map((p, i) => `${i + 1}. "${p.title}" - Required: ${JSON.stringify(p.required_skills || [])} - Description: ${(p.description || '').substring(0, 150)}`).join('\n')}

Return ONLY a JSON array of objects with this exact format (sorted by compatibility descending):
[{"projectIndex": 1, "compatibility": 85, "reason": "Strong match because..."}]

Rules:
- compatibility is a percentage 0-99
- reason should be 1 short sentence
- Include ALL projects`;

    const responseText = await callGemini(prompt);
    const aiMatches = extractJSON(responseText);

    const matches = aiMatches.map(m => {
      const project = available[m.projectIndex - 1];
      if (!project) return null;

      const userLower = userSkills.map(s => s.toLowerCase());
      const missing_skills = (project.required_skills || []).filter(s => !userLower.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)));

      return {
        projectId: project.id,
        projectTitle: project.title,
        compatibility: m.compatibility,
        reason: m.reason,
        required_skills: project.required_skills,
        missing_skills: missing_skills,
        member_count: project.member_count,
        max_members: project.max_members,
      };
    }).filter(Boolean).sort((a, b) => b.compatibility - a.compatibility);

    res.json({ matches: matches.slice(0, 10) });

  } catch (err) {
    console.error('Team matching error:', err.message);
    res.status(500).json({ error: 'Team matching failed: ' + err.message });
  }
});

// ============================================================
// POST /api/ai/summarize-requests
// For professors: Auto-summary of incoming supervision requests
// ============================================================
router.post('/summarize-requests', authMiddleware, async (req, res) => {
  try {
    // Get pending supervision requests for this professor
    const { data: requests } = await supabase
      .from('join_requests')
      .select(`
        id, message, type, created_at,
        user:users!user_id(full_name, skills, reputation_score, department),
        project:projects!project_id(title, description, required_skills)
      `)
      .eq('type', 'supervise')
      .eq('status', 'pending');

    // Also get join requests for projects this professor supervises
    const { data: myProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('supervisor_id', req.user.id);

    const myProjectIds = (myProjects || []).map(p => p.id);
    let projectRequests = [];
    if (myProjectIds.length > 0) {
      const { data } = await supabase
        .from('join_requests')
        .select(`
          id, message, type, created_at,
          user:users!user_id(full_name, skills, reputation_score),
          project:projects!project_id(title)
        `)
        .in('project_id', myProjectIds)
        .eq('status', 'pending');
      projectRequests = data || [];
    }

    const allRequests = [...(requests || []), ...projectRequests];

    if (allRequests.length === 0) {
      return res.json({ summary: 'No pending requests at this time.', count: 0 });
    }

    if (!config.gemini.apiKey) {
      // Demo summary
      const names = allRequests.map(r => r.user?.full_name || 'Unknown').join(', ');
      return res.json({
        summary: `You have ${allRequests.length} pending request(s) from: ${names}. Review them in your dashboard.`,
        count: allRequests.length,
        message: 'Demo mode.',
      });
    }

    // Gemini-powered summary
    const requestDetails = allRequests.map(r =>
      `- ${r.user?.full_name} (★${r.user?.reputation_score || 'N/A'}, skills: ${(r.user?.skills || []).join(', ')}) wants to ${r.type === 'supervise' ? 'be supervised' : 'join'} "${r.project?.title}". Message: "${r.message || 'No message'}"`
    ).join('\n');

    const prompt = `You are an academic advisor assistant. Summarize these supervision/join requests for a professor in 2-3 sentences. Highlight the strongest candidates.

Requests:
${requestDetails}

Write a concise, professional summary.`;

    const summary = await callGemini(prompt);
    res.json({ summary, count: allRequests.length });

  } catch (err) {
    console.error('Summary error:', err.message);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// ============================================================
// POST /api/ai/suggest-task-assignment
// AI suggests which member should be assigned to a task
// ============================================================
router.post('/suggest-task-assignment', authMiddleware, async (req, res) => {
  try {
    const { project_id, task_title, task_description } = req.body;

    // Get team members with their skills
    const { data: members } = await supabase
      .from('team_members')
      .select('user:users!user_id(id, full_name, skills, reputation_score)')
      .eq('project_id', project_id);

    if (!members || members.length === 0) {
      return res.json({ suggestion: null, message: 'No team members found.' });
    }

    if (!config.gemini.apiKey) {
      // Simple matching: pick the member with the most relevant-looking skills
      const suggestion = members[0]?.user;
      return res.json({
        suggestion: suggestion ? { user_id: suggestion.id, full_name: suggestion.full_name, reason: 'First available team member (demo mode)' } : null,
        message: 'Demo mode.',
      });
    }

    const memberList = members.map((m, i) =>
      `${i + 1}. ${m.user.full_name} - Skills: ${(m.user.skills || []).join(', ')} - Rating: ${m.user.reputation_score || 'N/A'}`
    ).join('\n');

    const prompt = `Given this task and team members, suggest the BEST person to assign it to.

Task: "${task_title}"
${task_description ? `Description: "${task_description}"` : ''}

Team Members:
${memberList}

Return ONLY a JSON object: {"memberIndex": 1, "reason": "Best fit because..."}`;

    const responseText = await callGemini(prompt);
    const result = extractJSON(responseText);
    const member = members[result.memberIndex - 1]?.user;

    res.json({
      suggestion: member ? {
        user_id: member.id,
        full_name: member.full_name,
        reason: result.reason,
      } : null,
    });

  } catch (err) {
    console.error('Task suggestion error:', err.message);
    res.status(500).json({ error: 'Failed to generate suggestion' });
  }
});

// ============================================================
// POST /api/ai/chat
// AI Chatbot – conversational assistant for TeamUp platform
// ============================================================
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, context, history } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!config.gemini.apiKey) {
      return res.json({
        reply: `🤖 **Demo Mode Response**\n\nGreat question! I would help you with "${message.substring(0, 60)}..." but the Gemini API key needs to be configured.\n\nOnce configured, I can:\n- Find teammates matching your skills\n- Suggest graduation project ideas\n- Help write project proposals\n- Provide career advice`,
      });
    }

    // Build conversation context
    const historyText = (history || [])
      .map(h => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const systemPrompt = `You are TeamUp AI, a smart academic assistant for AASTMT (Arab Academy for Science, Maritime Transport, and Technology) students.

Your role:
- Help students find teammates and graduation projects
- Suggest project ideas based on skills and interests
- Provide career advice and skill recommendations
- Help with project proposals and planning
- Be encouraging, professional, and supportive

Context about the student:
- Name: ${context?.userName || 'Student'}
- Role: ${context?.userRole || 'student'}
- Skills: ${(context?.userSkills || []).join(', ') || 'Not specified'}
- University: ${context?.university || 'AASTMT'}

Guidelines:
- Use markdown formatting (bold, bullets, emojis)
- Keep responses concise but helpful (max 300 words)
- If asked about specific projects, suggest relevant ones from AASTMT context
- When suggesting skills, focus on market-demanded ones in Egypt & MENA region
- Be specific to Computer Science and Engineering fields`;

    const prompt = `${systemPrompt}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Student's message: "${message}"

Please respond helpfully:`;

    const reply = await callGemini(prompt);
    res.json({ reply });

  } catch (err) {
    console.error('AI Chat error:', err.message);
    res.json({
      reply: '⚠️ I encountered an error processing your request. Please try again in a moment.',
    });
  }
});

export default router;
