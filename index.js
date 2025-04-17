// Import required modules
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const db = require('./db');
const userRoutes = require('./routes/user');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const expressSanitizer = require('express-sanitizer');
const axios = require('axios'); 
const multer = require("multer");
const { classifyImage } = require('./imageClassifier');

const app = express();
const port = 8000;
const basePath = '/usr/176';

// Make base path available to views
app.use((req, res, next) => {
  app.locals.baseUrl = basePath;
  next();
});

// Passport config
require('./config/passport')(passport);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Global variables for views
app.use((req, res, next) => {
  res.locals.req = req;
  res.locals.user = req.user;
  res.locals.hideHeader = false;
  res.locals.query = '';
  res.locals.noResults = false;
  next();
});

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Serve static files from public/ under base path
app.use(`${basePath}`, express.static(path.join(__dirname, 'public')));

// Middleware to check authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect(`${basePath}/users/login`);
}

// Routes
app.get(`${basePath}/`, ensureAuthenticated, (req, res) => {
  res.render('map', { title: 'Nature Reserve Map', activePage: 'home', imagePath: 'images/nr.png' });
});

app.get(`${basePath}/map`, ensureAuthenticated, (req, res) => {
  res.render('map', { title: 'Select Coordinates', activePage: 'map' });
});

app.get(`${basePath}/gallery`, ensureAuthenticated, (req, res) => {
  const query = `
    SELECT 
      sightings.*, 
      (SELECT COUNT(*) FROM likes WHERE likes.sighting_id = sightings.id) AS likeCount,
      (SELECT COUNT(*) FROM likes WHERE likes.sighting_id = sightings.id AND likes.user_id = ?) AS userHasLiked
    FROM sightings
  `;
  db.query(query, [req.user.id], (err, sightings) => {
    if (err) {
      console.error('Error fetching sightings:', err);
      return res.status(500).send('Internal Server Error');
    }

    const fetchComments = sightings.map(sighting => {
      return new Promise((resolve, reject) => {
        const commentQuery = `
          SELECT comments.*, users.username 
          FROM comments 
          JOIN users ON comments.user_id = users.id 
          WHERE comments.sighting_id = ? 
          ORDER BY comments.commented_at DESC
        `;
        db.query(commentQuery, [sighting.id], (err, comments) => {
          if (err) return reject(err);
          sighting.comments = comments;
          resolve();
        });
      });
    });

    Promise.all(fetchComments)
      .then(() => {
        res.render('gallery', { title: 'Gallery', activePage: 'gallery', sightings, user: req.user });
      })
      .catch(err => {
        console.error('Error fetching comments:', err);
        res.status(500).send('Internal Server Error');
      });
  });
});

app.get(`${basePath}/visitor-information`, ensureAuthenticated, (req, res) => {
  res.render('visitor-information', { title: 'Visitor Information', activePage: 'visitor' });
});

// Content pages
const contentPages = ['mycelium', 'pond', 'medicine', 'klang', 'bgeg', 'bat'];
contentPages.forEach(page => {
  app.get(`${basePath}/${page}`, ensureAuthenticated, (req, res) => {
    res.render(page, { title: page, activePage: page });
  });
});

// Delete sighting
app.post(`${basePath}/sightings/:id/delete`, ensureAuthenticated, (req, res) => {
  const query = 'DELETE FROM sightings WHERE id = ?';
  db.query(query, [req.params.id], (err) => {
    if (err) {
      console.error('Error deleting sighting:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect(`${basePath}/gallery`);
  });
});

// Multer for image uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Image classification route
app.post(`${basePath}/detect_species`, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  const imagePath = path.join(__dirname, "uploads", req.file.filename);

  try {
    const result = await classifyImage(imagePath);
    res.json(result);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Model failed to process image" });
  }
});

// Mount user routes
app.use(`${basePath}/users`, userRoutes);

// Start server
app.listen(port, () => {
  console.log('Server is running on http://localhost:' + port);
  console.log('Listening on port ' + port);
});