const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { upload, processUpload } = require('../upload'); // Import upload logic
const { body, validationResult } = require('express-validator'); // Import express-validator
const { ensureAuthenticated } = require('../middleware/auth'); // Import ensureAuthenticated middleware

// Function to get description from Wikipedia API
const getWikipediaDescription = async (speciesName) => {
  const keywords = speciesName.split(' ');
  for (const keyword of keywords) {
    try {
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(keyword)}`);
      if (response.status === 200 && response.data.extract) {
        return response.data.extract;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error(`Keyword not found on Wikipedia: ${keyword}`);
      } else {
        console.error('Error getting description from Wikipedia:', error);
      }
    }
  }
  return 'No description found.';
};

// Render login page
router.get('/login', (req, res) => {
  res.render('login', { hideHeader: true, title: 'Login', activePage: 'login', errors: req.session.errors || [] });
  req.session.errors = null; // Clear errors after rendering
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register', { hideHeader: true, title: 'Register', activePage: 'register', errors: req.session.errors || [] });
  req.session.errors = null; // Clear errors after rendering
});

// Register user
router.post('/register', [
  body('username').trim().escape(),
  body('first_name').trim().escape(),
  body('last_name').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.errors = errors.array();
    return res.redirect('/users/register');
  }

  const { username, first_name, last_name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (username, first_name, last_name, email, password) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [username, first_name, last_name, email, hashedPassword], (err, results) => {
    if (err) {
      console.error('Error registering user:', err);
      req.session.errors = [{ msg: 'Internal Server Error' }];
      return res.redirect('/users/register');
    }
    res.redirect('/users/login');
  });
});

// Login user
router.post('/login', [
  body('username').trim().escape(),
  body('password').escape()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.errors = errors.array();
    return res.redirect('/users/login');
  }
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: false
  })(req, res, next);
});

// Logout user
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.redirect('/');
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.redirect('/');
      }
      res.redirect('/users/logout-message');
    });
  });
});

// Render logout message page
router.get('/logout-message', (req, res) => {
  res.render('logout', { hideHeader: true, title: 'Logout', activePage: 'logout' });
});

// Handle form submissions for logging sightings
router.post('/log-sighting', ensureAuthenticated, upload.single('image'), [
  body('speciesName').trim().escape(),
  body('date').isDate().toDate(),
  body('description').trim().escape()
], processUpload);

// Handle form submissions for contact form
router.post('/contact', [
  body('name').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('message').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, message } = req.body;
  const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
  db.query(query, [name, email, message], (err, results) => {
    if (err) {
      console.error('Error submitting contact form:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/visitor-information');
  });
});

// Handle deleting sightings
router.post('/delete-sighting/:sightingId', ensureAuthenticated, (req, res) => {
  const query = 'DELETE FROM sightings WHERE id = ? AND user_id = ?';
  db.query(query, [req.params.sightingId, req.user.id], (err, results) => {
    if (err) {
      console.error('Error deleting sighting:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/gallery');
  });
});

// Add a comment
router.post('/:sightingId/comments', [
  ensureAuthenticated,
  body('comment_text').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty').escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const query = 'INSERT INTO comments (sighting_id, user_id, comment_text) VALUES (?, ?, ?)';
  db.query(query, [req.params.sightingId, req.user.id, req.body.comment_text], (err, results) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect(`/sightings/${req.params.sightingId}`);
  });
});

// Get comments for a sighting
router.get('/:sightingId/comments', (req, res) => {
  const query = 'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE sighting_id = ? ORDER BY commented_at DESC';
  db.query(query, [req.params.sightingId], (err, comments) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).send('Server Error');
    }
    res.json(comments);
  });
});

// Like a sighting
router.post('/:sightingId/like', ensureAuthenticated, (req, res) => {
  const query = 'INSERT INTO likes (sighting_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP';
  db.query(query, [req.params.sightingId, req.user.id], (err, results) => {
    if (err) {
      console.error('Error liking sighting:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect(`/sightings/${req.params.sightingId}`);
  });
});

// Unlike a sighting
router.post('/:sightingId/unlike', ensureAuthenticated, (req, res) => {
  const query = 'DELETE FROM likes WHERE sighting_id = ? AND user_id = ?';
  db.query(query, [req.params.sightingId, req.user.id], (err, results) => {
    if (err) {
      console.error('Error unliking sighting:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect(`/sightings/${req.params.sightingId}`);
  });
});

// Get like count for a sighting
router.get('/:sightingId/likes', (req, res) => {
  const query = 'SELECT COUNT(*) AS likes FROM likes WHERE sighting_id = ?';
  db.query(query, [req.params.sightingId], (err, result) => {
    if (err) {
      console.error('Error fetching like count:', err);
      return res.status(500).send('Server Error');
    }
    res.json({ likes: result[0].likes });
  });
});

module.exports = router;