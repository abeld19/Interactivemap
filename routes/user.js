const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection
const axios = require('axios'); // For making HTTP requests
const bcrypt = require('bcrypt'); // For hashing passwords
const passport = require('passport'); // For authentication
const { body, validationResult } = require('express-validator'); // For input validation
const { ensureAuthenticated } = require('../middleware/auth'); // Middleware to ensure authentication
const { upload, processUpload, getWikipediaDescription } = require('../upload'); // File upload and helper functions

// Render login page
router.get('/login', (req, res) => {
  const errors = req.session.errors || []; // Retrieve errors from session
  req.session.errors = null; // Clear errors after rendering
  res.render('login', { 
    hideHeader: true, // Hide the header on the login page
    title: 'Login', 
    activePage: 'login', 
    errors 
  });
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register', { 
    hideHeader: true, // Hide the header on the register page
    title: 'Register', 
    activePage: 'register', 
    errors: req.session.errors || [] // Retrieve errors from session
  });
  req.session.errors = null; // Clear errors after rendering
});

// Register user
router.post('/register', [
  // Validate and sanitize input fields
  body('username').trim().escape(),
  body('first_name').trim().escape(),
  body('last_name').trim().escape(),
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long').escape()
], async (req, res) => {
  const errors = validationResult(req); // Validate input
  if (!errors.isEmpty()) {
    req.session.errors = errors.array(); // Store errors in session
    return res.redirect('/users/register'); // Redirect back to the register page
  }
  const { username, first_name, last_name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
  const query = 'INSERT INTO users (username, first_name, last_name, email, password) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [username, first_name, last_name, email, hashedPassword], (err, results) => {
    if (err) {
      console.error('Error registering user:', err);
      req.session.errors = [{ msg: 'Internal Server Error' }];
      return res.redirect('/usr/176/users/register');
    }
    res.redirect('/usr/176/users/login'); // Redirect to login page after successful registration
  });
});

// Login user
router.post('/login', [
  // Validate and sanitize input fields
  body('username').trim().escape(),
  body('password').escape()
], (req, res, next) => {
  const errors = validationResult(req); // Validate input
  if (!errors.isEmpty()) {
    req.session.errors = errors.array(); // Store errors in session
    return res.redirect('/users/login'); // Redirect back to the login page
  }

  passport.authenticate('local', (err, user, info) => {
    if (!user) {
      // Handle specific error messages from Passport's `info` object
      if (info && info.message === 'That username is not registered') {
        req.session.errors = [{ msg: 'Username incorrect' }];
      } else if (info && info.message === 'Password incorrect') {
        req.session.errors = [{ msg: 'Incorrect password' }];
      }
      return res.redirect('/usr/176/users/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Error logging in user:', err);
        req.session.errors = [{ msg: 'An error occurred during login. Please try again.' }];
        return res.redirect('/usr/176/users/login');
      }
      return res.redirect('/usr/176'); // Redirect to the home page after successful login
    });
  })(req, res, next);
});

// Logout user
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      return res.redirect('/usr/176');
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.redirect('/usr/176');
      }
      res.redirect('/usr/176/users/logout-message'); // Redirect to logout message page
    });
  });
});

// Render logout message page
router.get('/logout-message', (req, res) => {
  res.render('logout', { hideHeader: true, title: 'Logout', activePage: 'logout' });
});

// Handle form submissions for logging sightings
router.post('/log-sighting', ensureAuthenticated, upload.single('image'), [
  // Validate and sanitize input fields
  body('speciesName').trim().escape(),
  body('date').isDate().toDate(),
  body('description').trim().escape(),
  body('longitude').isNumeric().toFloat(),
  body('latitude').isNumeric().toFloat()
], processUpload);

// Handle form submissions for contact form
router.post('/contact', [
  // Validate and sanitize input fields
  body('name').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('message').trim().escape()
], (req, res) => {
  const errors = validationResult(req); // Validate input
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Return validation errors
  }

  const { name, email, message } = req.body;
  const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
  db.query(query, [name, email, message], (err, results) => {
    if (err) {
      console.error('Error submitting contact form:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Redirect to visitor information page with a success query parameter
    res.redirect('/usr/176/visitor-information?success=true');
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
    res.redirect('/usr/176/gallery'); // Redirect to gallery after deletion
  });
});

// Add a comment
router.post('/sightings/:sightingId/comments', [
  ensureAuthenticated,
  body('comment_text').trim().isLength({ min: 1 }).withMessage('Comment cannot be empty').escape()
], (req, res) => {
  const errors = validationResult(req); // Validate input
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Return validation errors
  }
  
  const query = 'INSERT INTO comments (sighting_id, user_id, comment_text) VALUES (?, ?, ?)';
  db.query(query, [req.params.sightingId, req.user.id, req.body.comment_text], (err, results) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect('/usr/176/gallery'); // Redirect to gallery after adding comment
  });
});

// Delete a comment
router.post('/sightings/:sightingId/comments/:commentId/delete', ensureAuthenticated, (req, res) => {
  const query = 'DELETE FROM comments WHERE id = ? AND user_id = ?';
  db.query(query, [req.params.commentId, req.user.id], (err, results) => {
    if (err) {
      console.error('Error deleting comment:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect('/usr/176/gallery'); // Redirect to gallery after deleting comment
  });
});

// Get comments for a sighting
router.get('/sightings/:sightingId/comments', (req, res) => {
  const query = 'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE sighting_id = ? ORDER BY commented_at DESC';
  db.query(query, [req.params.sightingId], (err, comments) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).send('Server Error');
    }
    res.json(comments); // Return comments as JSON
  });
});

// Like a sighting
router.post('/sightings/:sightingId/like', ensureAuthenticated, (req, res) => {
  const query = 'INSERT INTO likes (sighting_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP';
  db.query(query, [req.params.sightingId, req.user.id], (err, results) => {
    if (err) {
      console.error('Error liking sighting:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect('/usr/176/gallery'); // Redirect to gallery after liking
  });
});

// Unlike a sighting
router.post('/sightings/:sightingId/unlike', ensureAuthenticated, (req, res) => {
  const query = 'DELETE FROM likes WHERE sighting_id = ? AND user_id = ?';
  db.query(query, [req.params.sightingId, req.user.id], (err, results) => {
    if (err) {
      console.error('Error unliking sighting:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect('/usr/176/gallery'); // Redirect to gallery after unliking
  });
});

// Get like count for a sighting
router.get('/sightings/:sightingId/likes', (req, res) => {
  const query = 'SELECT COUNT(*) AS likes FROM likes WHERE sighting_id = ?';
  db.query(query, [req.params.sightingId], (err, result) => {
    if (err) {
      console.error('Error fetching like count:', err);
      return res.status(500).send('Server Error');
    }
    res.json({ likes: result[0].likes }); // Return like count as JSON
  });
});

// Search sightings
router.get('/search', ensureAuthenticated, (req, res) => {
  const query = req.query.query;
  const searchQuery = `
    SELECT 
      sightings.*, 
      (SELECT COUNT(*) FROM likes WHERE likes.sighting_id = sightings.id) AS likeCount,
      (SELECT COUNT(*) FROM likes WHERE likes.sighting_id = sightings.id AND likes.user_id = ?) AS userHasLiked
    FROM sightings
    WHERE speciesName LIKE ? OR description LIKE ?
  `;
  db.query(searchQuery, [req.user.id, `%${query}%`, `%${query}%`], (err, sightings) => {
    if (err) {
      console.error('Error searching sightings:', err);
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

// Finalize the sighting: calls Wikipedia + inserts into DB
router.post('/finalize-sighting', ensureAuthenticated, async (req, res) => {
  try {
    const finalSpecies = req.body.speciesName;
    if (!finalSpecies) {
      return res.status(400).json({ success: false, message: 'Species name is required' });
    }
    const imageFilename = req.body.imageFilename;
    const latitude = req.body.latitude && req.body.latitude.trim() !== '' ? req.body.latitude : null;
    const longitude = req.body.longitude && req.body.longitude.trim() !== '' ? req.body.longitude : null;

    // Get description from Wikipedia
    const description = await getWikipediaDescription(finalSpecies);

    // Insert the sighting into the database
    const sql = 'INSERT INTO sightings (speciesName, description, image, latitude, longitude, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [finalSpecies, description, imageFilename, latitude, longitude, req.user.id], (err) => {
      if (err) {
        console.error('Error inserting sighting:', err);
        return res.status(500).json({ success: false, message: 'Database Error' });
      }
      return res.json({ success: true });
    });
  } catch (error) {
    console.error('Error finalizing sighting:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;