const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/reports', reportsRouter);

// Basic health check
app.get('/', (req, res) => {
  res.send('Crime Reporting and Analysis API is running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
