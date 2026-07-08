const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'crime_reports.db');

// Create a new SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Create reports table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      date_time DATETIME NOT NULL,
      deleted INTEGER DEFAULT 0,
      evidence_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Reports table initialized.');
      }
    });
  });
}

module.exports = db;
