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
  const query = 'SELECT * FROM sightings';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching sightings:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.render('gallery', { title: 'Gallery', activePage: 'gallery', sightings: results });
  });
});

app.get('/visitor-information', ensureAuthenticated, (req, res) => {
  res.render('visitor-information', { title: 'Visitor Information', activePage: 'visitor' });
});

// Dynamic route to render content pages
app.get('/:content', ensureAuthenticated, (req, res) => {
  const content = req.params.content;
  let data;

  if (content === 'mushroom') {
    data = {
      title: 'Mushroom Information',
      activePage: 'mushroom',
      items: [
        { title: 'Oyster Mushroom (Pleurotus spp.)', image: '/images/oyster.png', description: 'Oyster mushrooms are a group of edible fungi characterized by their oyster-shaped caps and layered gills. They grow rapidly, adapt to various substrates (such as straw, sawdust, and coconut coir), and produce multiple flushes of fruiting bodies. Their mycelium forms a white, web-like network during colonisation, and when provided with proper conditions—humidity, fresh air exchange, and temperature shifts—these mushrooms reliably fruit indoors and outdoors.', edibility: 'Oyster mushrooms are widely regarded as safe, edible, and highly nutritious. They have a mild, savory flavor and a tender texture that makes them a popular choice in many culinary dishes.', habitat: 'In nature, oyster mushrooms typically grow on decaying wood—such as logs, stumps, or fallen branches—in temperate forests worldwide. Cultivators often recreate similar environments using substrates like sterilised straw, sawdust, and coconut coir to produce them in controlled conditions.', season: 'Wild oyster mushrooms often appear during cooler, wetter periods—commonly in spring and autumn. Under controlled indoor cultivation, however, they can be grown and harvested year-round by maintaining suitable environmental conditions.' }
      ]
    };
  } else if (content === 'pond') {
    data = {
      title: 'Pond Information',
      activePage: 'pond',
      items: [
        { title: 'Pond', image: '/images/pond.png', description: 'Ponds are small bodies of water that support a diverse range of plant and animal life. They are typically shallow, with a gentle slope from the shore to the center, and may be natural or man-made.', edibility: 'N/A', habitat: 'Ponds provide habitat for a variety of aquatic plants and animals, including fish, amphibians, insects, and birds.', season: 'Ponds can be found year-round, but the types of plants and animals present may vary with the seasons.' }
      ]
    };
  } else {
    return res.status(404).send('Content not found');
  }

  res.render('content', data);
});

// Use user routes
app.use('/users', userRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
