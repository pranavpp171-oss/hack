import express from 'express';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  findPotentialDuplicates
} from '../db.js';

const router = express.Router();

// GET all announcements with filters
router.get('/', (req, res) => {
  try {
    const { search, category, priority, status, timeline, sort } = req.query;
    const announcements = getAllAnnouncements({ search, category, priority, status, timeline, sort });
    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve announcements' });
  }
});

// GET single announcement by ID
router.get('/:id', (req, res) => {
  try {
    const item = getAnnouncementById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    console.error('Error fetching announcement:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve announcement' });
  }
});

// POST create new announcement
router.post('/', (req, res) => {
  try {
    const { title, event_date, category } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (!event_date || !event_date.trim()) {
      return res.status(400).json({ success: false, error: 'Event date is required' });
    }

    const created = createAnnouncement(req.body);
    res.status(201).json({ success: true, message: 'Announcement created successfully', data: created });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

// PUT update existing announcement
router.put('/:id', (req, res) => {
  try {
    const updated = updateAnnouncement(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement updated successfully', data: updated });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
});

// DELETE announcement
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteAnnouncement(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
});

export default router;

