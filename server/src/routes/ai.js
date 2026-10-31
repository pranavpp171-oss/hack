import express from 'express';
import { extractAnnouncementWithAI, generateWeeklySummaryWithAI, isGeminiConfigured } from '../services/gemini.js';
import { getAllAnnouncements, findPotentialDuplicates } from '../db.js';

const router = express.Router();

/**
 * POST /api/ai/extract
 * Extracts structured announcement from unstructured text, detects missing fields,
 * and runs Innovative Feature A: Duplicate Detection Engine against the SQLite DB.
 */
router.post('/extract', async (req, res) => {
  try {
    const { text, referenceDate } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text content is required for AI extraction.' });
    }

    // Step 1: AI Extraction using Gemini
    const extracted = await extractAnnouncementWithAI(text, referenceDate);

    // Step 2: Innovative Feature A: Duplicate Detection Engine
    // Query SQLite database for semantic/title/venue/date matches
    const duplicates = findPotentialDuplicates({
      title: extracted.title,
      event_date: extracted.event_date,
      venue: extracted.venue,
      description: extracted.description,
    });

    res.json({
      success: true,
      data: extracted,
      duplicates: duplicates,
      has_duplicates: duplicates.length > 0,
      is_demo_mode: extracted.is_ai_demo_mode,
    });
  } catch (err) {
    console.error('Error during AI notice extraction:', err);
    res.status(500).json({ success: false, error: 'AI notice extraction failed: ' + err.message });
  }
});

/**
 * POST /api/ai/weekly-summary
 * Innovative Feature: "WHAT DO I NEED TO KNOW THIS WEEK?"
 * Retrieves this week's records from DB and generates structured summary via Gemini
 */
router.post('/weekly-summary', async (req, res) => {
  try {
    const now = new Date();
    // Monday of current week
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekStartStr = monday.toISOString().split('T')[0];
    const weekEndStr = sunday.toISOString().split('T')[0];

    // Fetch announcements in this date window or with upcoming deadlines
    const all = getAllAnnouncements({ timeline: 'upcoming' });
    const thisWeekItems = all.filter(a => {
      const isDateInWeek = a.event_date >= weekStartStr && a.event_date <= weekEndStr;
      const isDeadlineInWeek = a.registration_deadline && a.registration_deadline >= weekStartStr && a.registration_deadline <= weekEndStr;
      return isDateInWeek || isDeadlineInWeek || a.priority === 'RED';
    });

    const summary = await generateWeeklySummaryWithAI(thisWeekItems, weekStartStr, weekEndStr);

    res.json({
      success: true,
      data: summary,
      week_range: { start: weekStartStr, end: weekEndStr },
      total_items_analyzed: thisWeekItems.length,
      is_demo_mode: summary.is_ai_demo_mode,
    });
  } catch (err) {
    console.error('Error generating weekly summary:', err);
    res.status(500).json({ success: false, error: 'Failed to generate weekly summary: ' + err.message });
  }
});

/**
 * POST /api/ai/check-duplicates
 * Standalone duplicate check endpoint for any title/event_date/venue
 */
router.post('/check-duplicates', (req, res) => {
  try {
    const { title, event_date, venue, description } = req.body;
    const duplicates = findPotentialDuplicates({ title, event_date, venue, description });
    res.json({ success: true, count: duplicates.length, duplicates });
  } catch (err) {
    console.error('Error checking duplicates:', err);
    res.status(500).json({ success: false, error: 'Failed to check duplicates' });
  }
});

export default router;

