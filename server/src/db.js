import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in data directory
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campuspulse.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance and durability
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      venue TEXT,
      category TEXT NOT NULL DEFAULT 'General Notices',
      priority TEXT NOT NULL DEFAULT 'GREEN',
      registration_deadline TEXT,
      important_instructions TEXT,
      source_text TEXT,
      missing_information TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      is_duplicate_of INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_event_date ON announcements(event_date);
    CREATE INDEX IF NOT EXISTS idx_category ON announcements(category);
    CREATE INDEX IF NOT EXISTS idx_priority ON announcements(priority);
    CREATE INDEX IF NOT EXISTS idx_status ON announcements(status);
  `);
}

/**
 * Automatically compute priority based on event_date and registration_deadline
 * RED (Urgent): within 24 hours (or deadline within 24 hours)
 * YELLOW (Upcoming): within 7 days
 * GREEN (Normal): more than 7 days ahead or general
 * GREY (Expired): date in the past
 */
export function calculatePriority(eventDateStr, deadlineStr) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Pick target date to assess urgency: deadline takes precedence if present and future
  let targetDate = null;
  let isDeadlineUrgent = false;

  if (deadlineStr) {
    const dlDate = new Date(deadlineStr);
    if (!isNaN(dlDate.getTime())) {
      const diffMs = dlDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0 && (!eventDateStr || new Date(eventDateStr) < now)) {
        // Both expired
      } else if (diffHours >= 0 && diffHours <= 24) {
        return 'RED'; // Deadline within 24h
      } else if (diffHours > 24 && diffHours <= 24 * 7) {
        isDeadlineUrgent = true;
      }
    }
  }

  if (eventDateStr) {
    const evDate = new Date(eventDateStr);
    if (!isNaN(evDate.getTime())) {
      const diffMs = evDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < -24) {
        return 'GREY'; // Past event
      } else if (diffHours >= -24 && diffHours <= 24) {
        return 'RED'; // Event today / within 24 hours
      } else if (diffHours > 24 && diffHours <= 24 * 7 || isDeadlineUrgent) {
        return 'YELLOW'; // Within 7 days
      } else {
        return 'GREEN'; // Normal / distant
      }
    }
  }

  return isDeadlineUrgent ? 'YELLOW' : 'GREEN';
}

/**
 * Get all announcements with multi-criteria filtering
 */
export function getAllAnnouncements(filters = {}) {
  let query = 'SELECT * FROM announcements WHERE 1=1';
  const params = [];

  if (filters.search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR venue LIKE ?)';
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (filters.category && filters.category !== 'All') {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters.priority && filters.priority !== 'All') {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters.status && filters.status !== 'All') {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  // Filter by upcoming vs past
  const today = new Date().toISOString().split('T')[0];
  if (filters.timeline === 'upcoming') {
    query += ' AND event_date >= ?';
    params.push(today);
  } else if (filters.timeline === 'past') {
    query += ' AND event_date < ?';
    params.push(today);
  }

  // Sorting
  switch (filters.sort) {
    case 'date_asc':
      query += ' ORDER BY event_date ASC, start_time ASC';
      break;
    case 'date_desc':
      query += ' ORDER BY event_date DESC, start_time DESC';
      break;
    case 'urgent_first':
      query += ` ORDER BY CASE priority 
                  WHEN 'RED' THEN 1 
                  WHEN 'YELLOW' THEN 2 
                  WHEN 'GREEN' THEN 3 
                  ELSE 4 END, event_date ASC`;
      break;
    case 'newest':
    default:
      query += ' ORDER BY created_at DESC';
      break;
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);

  // Dynamically refresh priority on read
  return rows.map(row => {
    const dynamicPriority = calculatePriority(row.event_date, row.registration_deadline);
    let missingInfo = [];
    try {
      missingInfo = JSON.parse(row.missing_information || '[]');
    } catch (e) {
      missingInfo = [];
    }
    return {
      ...row,
      priority: dynamicPriority,
      missing_information: missingInfo,
    };
  });
}

/**
 * Get single announcement
 */
export function getAnnouncementById(id) {
  const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
  if (!row) return null;

  let missingInfo = [];
  try {
    missingInfo = JSON.parse(row.missing_information || '[]');
  } catch (e) {
    missingInfo = [];
  }

  return {
    ...row,
    priority: calculatePriority(row.event_date, row.registration_deadline),
    missing_information: missingInfo,
  };
}

/**
 * Create new announcement
 */
export function createAnnouncement(data) {
  const now = new Date().toISOString();
  const priority = calculatePriority(data.event_date, data.registration_deadline);
  const missingInfoStr = JSON.stringify(data.missing_information || []);

  const stmt = db.prepare(`
    INSERT INTO announcements (
      title, description, event_date, start_time, end_time,
      venue, category, priority, registration_deadline,
      important_instructions, source_text, missing_information,
      status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `);

  const result = stmt.run(
    data.title || 'Untitled Announcement',
    data.description || '',
    data.event_date || now.split('T')[0],
    data.start_time || null,
    data.end_time || null,
    data.venue || 'TBA',
    data.category || 'General Notices',
    priority,
    data.registration_deadline || null,
    data.important_instructions || null,
    data.source_text || null,
    missingInfoStr,
    data.status || 'active',
    now,
    now
  );

  return getAnnouncementById(result.lastInsertRowid);
}

/**
 * Update existing announcement
 */
export function updateAnnouncement(id, data) {
  const existing = getAnnouncementById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const eventDate = data.event_date !== undefined ? data.event_date : existing.event_date;
  const deadline = data.registration_deadline !== undefined ? data.registration_deadline : existing.registration_deadline;
  const priority = calculatePriority(eventDate, deadline);
  
  const missingInfoStr = data.missing_information !== undefined
    ? JSON.stringify(data.missing_information)
    : JSON.stringify(existing.missing_information);

  const stmt = db.prepare(`
    UPDATE announcements SET
      title = ?,
      description = ?,
      event_date = ?,
      start_time = ?,
      end_time = ?,
      venue = ?,
      category = ?,
      priority = ?,
      registration_deadline = ?,
      important_instructions = ?,
      source_text = ?,
      missing_information = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    data.title !== undefined ? data.title : existing.title,
    data.description !== undefined ? data.description : existing.description,
    eventDate,
    data.start_time !== undefined ? data.start_time : existing.start_time,
    data.end_time !== undefined ? data.end_time : existing.end_time,
    data.venue !== undefined ? data.venue : existing.venue,
    data.category !== undefined ? data.category : existing.category,
    priority,
    deadline,
    data.important_instructions !== undefined ? data.important_instructions : existing.important_instructions,
    data.source_text !== undefined ? data.source_text : existing.source_text,
    missingInfoStr,
    data.status !== undefined ? data.status : existing.status,
    now,
    id
  );

  return getAnnouncementById(id);
}

/**
 * Delete announcement
 */
export function deleteAnnouncement(id) {
  const stmt = db.prepare('DELETE FROM announcements WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get comprehensive dashboard statistics
 */
export function getDashboardStats() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Start of this week (Monday) and end (Sunday)
  const dayOfWeek = now.getDay();
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];

  const total = db.prepare("SELECT COUNT(*) as count FROM announcements WHERE status != 'cancelled'").get().count;
  const upcoming = db.prepare("SELECT COUNT(*) as count FROM announcements WHERE event_date >= ? AND status != 'cancelled'").get(todayStr).count;
  const eventsThisWeek = db.prepare("SELECT COUNT(*) as count FROM announcements WHERE event_date >= ? AND event_date <= ? AND status != 'cancelled'").get(mondayStr, sundayStr).count;

  // Compute urgent deadlines & events (priority RED)
  const allRows = getAllAnnouncements();
  const urgentCount = allRows.filter(r => r.priority === 'RED' && r.status !== 'cancelled').length;

  // Today's highlights
  const todaysHighlights = allRows.filter(r => r.event_date === todayStr && r.status !== 'cancelled');

  // Category breakdown
  const categoryCounts = {};
  allRows.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  // Priority breakdown
  const priorityCounts = { RED: 0, YELLOW: 0, GREEN: 0, GREY: 0 };
  allRows.forEach(r => {
    if (priorityCounts[r.priority] !== undefined) {
      priorityCounts[r.priority]++;
    }
  });

  return {
    total,
    upcoming,
    urgentCount,
    eventsThisWeek,
    todaysHighlights,
    categoryCounts,
    priorityCounts,
  };
}

/**
 * Find potential duplicate announcements
 * Innovative Feature A: Duplicate Detection Engine
 */
export function findPotentialDuplicates(candidate) {
  if (!candidate || !candidate.title) return [];

  const all = getAllAnnouncements();
  const duplicates = [];

  const cleanTitle = (candidate.title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const candidateWords = new Set(cleanTitle.split(/\s+/).filter(w => w.length > 2));

  for (const existing of all) {
    // If exact same ID, skip
    if (candidate.id && existing.id === candidate.id) continue;

    let matchScore = 0;
    const reasons = [];

    // Check 1: Date match
    const sameDate = candidate.event_date && existing.event_date === candidate.event_date;
    if (sameDate) {
      matchScore += 35;
      reasons.push(`Occurs on same date (${existing.event_date})`);
    }

    // Check 2: Venue match
    const candVenue = (candidate.venue || '').trim().toLowerCase();
    const existVenue = (existing.venue || '').trim().toLowerCase();
    if (candVenue && existVenue && candVenue !== 'tba' && candVenue === existVenue) {
      matchScore += 25;
      reasons.push(`Held at identical venue (${existing.venue})`);
    }

    // Check 3: Title word overlap (Jaccard similarity)
    const existingClean = (existing.title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const existWords = new Set(existingClean.split(/\s+/).filter(w => w.length > 2));
    
    let intersection = 0;
    candidateWords.forEach(w => {
      if (existWords.has(w)) intersection++;
    });

    const union = new Set([...candidateWords, ...existWords]).size;
    const jaccard = union > 0 ? intersection / union : 0;

    if (jaccard > 0.5) {
      matchScore += 45;
      reasons.push(`Title matches substantially (${Math.round(jaccard * 100)}% vocabulary match)`);
    } else if (jaccard > 0.25) {
      matchScore += 25;
      reasons.push(`Partial title match`);
    }

    // If score >= 50, mark as duplicate candidate
    if (matchScore >= 50) {
      duplicates.push({
        existing,
        confidence: Math.min(matchScore, 98),
        reasons,
      });
    }
  }

  return duplicates.sort((a, b) => b.confidence - a.confidence);
}

export default db;
