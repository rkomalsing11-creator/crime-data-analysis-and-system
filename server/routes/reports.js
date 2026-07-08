const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up file upload for evidence
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Submit a new crime report
router.post('/submit', upload.single('evidence'), (req, res) => {
  const { title, type, description, location, date_time } = req.body;
  const evidence_path = req.file ? req.file.path : null;

  if (!title || !type || !location || !date_time) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  const query = `INSERT INTO reports (title, type, description, location, date_time, evidence_path)
                 VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [title, type, description, location, date_time, evidence_path], function(err) {
    if (err) {
      console.error('Error saving report:', err.message);
      return res.status(500).json({ error: 'Failed to save the report.' });
    }
    res.status(201).json({ id: this.lastID, message: 'Report submitted successfully!' });
  });
});

// Get all reports
router.get('/list', (req, res) => {
  // Support filtering by deleted state: ?deleted=0 (default), 1, or all
  const { deleted } = req.query;
  let query;
  if (deleted === '1') {
    query = `SELECT * FROM reports WHERE deleted = 1 ORDER BY date_time DESC`;
  } else if (deleted === 'all') {
    query = `SELECT * FROM reports ORDER BY date_time DESC`;
  } else {
    query = `SELECT * FROM reports WHERE deleted = 0 ORDER BY date_time DESC`;
  }

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching reports:', err.message);
      return res.status(500).json({ error: 'Failed to fetch reports.' });
    }
    res.json(rows);
  });
});

// Toggle deleted state for a report (soft-delete / restore)
router.put('/:id/deleted', (req, res) => {
  const reportId = req.params.id;
  const { deleted } = req.body;
  if (typeof deleted === 'undefined') {
    return res.status(400).json({ error: 'Missing "deleted" boolean in request body.' });
  }

  const deletedVal = deleted ? 1 : 0;
  const query = `UPDATE reports SET deleted = ? WHERE id = ?`;
  db.run(query, [deletedVal, reportId], function(err) {
    if (err) {
      console.error('Error updating report deleted state:', err.message);
      return res.status(500).json({ error: 'Failed to update report.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json({ id: reportId, deleted: !!deletedVal });
  });
});

// Get analysis data (number of crimes by type)
router.get('/analysis/by-type', (req, res) => {
  // By default exclude deleted reports; set include_deleted=1 to include them
  const includeDeleted = req.query.include_deleted === '1';
  const where = includeDeleted ? '' : 'WHERE deleted = 0';
  const query = `SELECT type as name, COUNT(*) as count FROM reports ${where} GROUP BY type`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching analysis data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch analysis data.' });
    }
    res.json(rows);
  });
});

// Get analysis data (number of crimes by location)
router.get('/analysis/by-location', (req, res) => {
  const includeDeleted = req.query.include_deleted === '1';
  const where = includeDeleted ? '' : 'WHERE deleted = 0';
  const query = `SELECT location as name, COUNT(*) as count FROM reports ${where} GROUP BY location`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching analysis data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch analysis data.' });
    }
    res.json(rows);
  });
});

module.exports = router;
