import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3001,
  jwt: {
    secret: process.env.JWT_SECRET || 'teamup-dev-secret-change-in-production',
    expiresIn: '7d',
  },
  supabase: {
    url: process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  jitsi: {
    domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
  },
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
  },
};
