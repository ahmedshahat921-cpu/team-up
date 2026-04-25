import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

import config from './config/index.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import notificationRoutes from './routes/notifications.js';
import ideaRoutes from './routes/ideas.js';
import aiRoutes from './routes/ai.js';
import dashboardRoutes from './routes/dashboard.js';
import analyticsRoutes from './routes/analytics.js';
import { setupSocket } from './socket/chat.js';

const app = express();
const httpServer = createServer(app);

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
});

setupSocket(io);

// Middleware
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 TeamUp Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
