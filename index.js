const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const db = require('./db'); // Import the database connection
const userRoutes = require('./routes/user'); // Import user routes
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const expressSanitizer = require('express-sanitizer');
const axios = require('axios'); 
const multer = require("multer");
const { classifyImage } = require('./imageClassifier'); // Import new model integration

const app = express();
const port = 8000;

// Passport Config
require('./config/passport')(passport);

// Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use((req, res, next) => {
  res.locals.req = req; // Make req available in all views
  res.locals.user = req.user; // Make user available in all views
  res.locals.hideHeader = false; // Default value for hideHeader
  res.locals.query = ''; // Default value for query
  res.locals.noResults = false; // Default value for noResults
  next();
});

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // Set the default layout

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(expressSanitizer()); // Add express-sanitizer middleware

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/users/login');
}

// Home route to display the map
app.get('/', ensureAuthenticated, (req, res) => {
    res.render('map', { title: 'Nature Reserve Map', activePage: 'home', imagePath: 'images/nr.png' });
});

// Gallery route to display all sightings
app.get('/gallery', ensureAuthenticated, (req, res) => {
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

    // Fetch comments for each sighting
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
          sighting.comments = comments; // Associate comments with the sighting
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

app.get('/visitor-information', ensureAuthenticated, (req, res) => {
  res.render('visitor-information', { title: 'Visitor Information', activePage: 'visitor' });
});

// Dynamic route to render content pages
app.get('/mycelium', ensureAuthenticated, (req, res) => {
  res.render('mycelium', { title: 'mycelium', activePage: 'mycelium' });
});
app.get('/pond', ensureAuthenticated, (req, res) => {
  res.render('pond', { title: 'pond', activePage: 'pond' });
});
app.get('/medicine', ensureAuthenticated, (req, res) => {
  res.render('medicine', { title: 'medicine', activePage: 'medicine' });
});
app.get('/klang', ensureAuthenticated, (req, res) => {
  res.render('klang', { title: 'klang', activePage: 'klang' });
});
app.get('/bgeg', ensureAuthenticated, (req, res) => {
  res.render('bgeg', { title: 'bgeg', activePage: 'bgeg' });
});
app.get('/bat', ensureAuthenticated, (req, res) => {
  res.render('bat', { title: 'bat', activePage: 'bat' });
});

// Route to delete a sighting
app.post('/sightings/:id/delete', ensureAuthenticated, (req, res) => {
  const query = 'DELETE FROM sightings WHERE id = ?';
  db.query(query, [req.params.id], (err) => {
    if (err) {
      console.error('Error deleting sighting:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/gallery');
  });
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Route to process images and predict species
app.post("/detect_species", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const imagePath = path.join(__dirname, "uploads", req.file.filename);

  try {
    // Classify the image using the new model
    const classificationResult = await classifyImage(imagePath);
    res.json(classificationResult);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Model failed to process image" });
  }
});

// Use user routes
app.use('/users', userRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
