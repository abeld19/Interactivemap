const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const passport = require('passport');
const upload = require('../upload'); // Import multer configuration
const { body, validationResult } = require('express-validator'); // Import express-validator

// Render login page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', activePage: 'login', errors: req.session.errors || [] });
  req.session.errors = null; // Clear errors after rendering
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register', activePage: 'register', errors: req.session.errors || [] });
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
  res.render('logout', { title: 'Logout', activePage: 'logout' });
});

// Handle form submissions for logging sightings
router.post('/log-sighting', upload, (req, res) => {
  const { speciesName, date, description } = req.body;
  const image = req.file ? req.file.filename : null;
  const query = 'INSERT INTO sightings (speciesName, date, description, image) VALUES (?, ?, ?, ?)';
  db.query(query, [speciesName, date, description, image], (err, results) => {
    if (err) {
      console.error('Error logging sighting:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/gallery');
  });
});

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

module.exports = router;
