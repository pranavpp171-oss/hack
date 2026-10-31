import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDB } from './db.js';
import { seedData } from './seed.js';
import announcementsRouter from './routes/announcements.js';
import aiRouter from './routes/ai.js';
import statsRouter from './routes/stats.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database and Seed if empty
initDB();
seedData(false);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// API Routes
app.use('/api/announcements', announcementsRouter);
app.use('/api/ai', aiRouter);
app.use('/api', statsRouter);

// SPA fallback: any other request serves index.html
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      name: 'Campus Pulse API',
      status: 'active',
      endpoints: ['/api/announcements', '/api/ai/extract', '/api/ai/weekly-summary', '/api/stats', '/api/health']
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Campus Pulse Server is running on port ${PORT}`);
  console.log(`🔗 Web Dashboard: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints: http://localhost:${PORT}/api/announcements`);
  console.log(`🤖 Gemini Status: ${process.env.GEMINI_API_KEY ? 'Configured (Live AI)' : 'Demo Mode (Smart Heuristic)'}`);
  console.log(`====================================================`);
});

