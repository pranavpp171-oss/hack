import express from 'express';
import { getDashboardStats } from '../db.js';
import { seedData } from '../seed.js';
import { isGeminiConfigured } from '../services/gemini.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve stats' });
  }
});

// POST reset and reseed database
router.post('/seed', (req, res) => {
  try {
    const count = seedData(true);
    res.json({ success: true, message: `Successfully seeded ${count} sample campus announcements`, count });
  } catch (err) {
    console.error('Error seeding database:', err);
    res.status(500).json({ success: false, error: 'Failed to seed database' });
  }
});

// GET health & AI configuration status
router.get('/health', (req, res) => {
  const configured = isGeminiConfigured();
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    gemini: {
      configured,
      model: 'gemini-1.5-flash',
      mode: configured ? 'Live Gemini AI' : 'Demo Mode (Smart Heuristic)',
    },
  });
});

// POST update Gemini API key in runtime and .env
router.post('/settings/key', (req, res) => {
  try {
    const { key } = req.body;
    if (!key || !key.trim()) {
      return res.status(400).json({ success: false, error: 'API key cannot be empty' });
    }

    const trimmedKey = key.trim();
    process.env.GEMINI_API_KEY = trimmedKey;

    // Update .env file
    const envPath = path.join(__dirname, '../../.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${trimmedKey}`);
      } else {
        envContent += `\nGEMINI_API_KEY=${trimmedKey}\n`;
      }
    } else {
      envContent = `PORT=5000\nGEMINI_API_KEY=${trimmedKey}\nTIMEZONE=Asia/Kolkata\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');

    res.json({
      success: true,
      message: 'Gemini API key updated successfully!',
      gemini: {
        configured: isGeminiConfigured(),
        mode: isGeminiConfigured() ? 'Live Gemini AI' : 'Demo Mode',
      },
    });
  } catch (err) {
    console.error('Error saving API key:', err);
    res.status(500).json({ success: false, error: 'Failed to update API key' });
  }
});

export default router;

