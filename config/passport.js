// Import required modules
const LocalStrategy = require('passport-local').Strategy; // Local authentication strategy
const bcrypt = require('bcrypt'); // For password hashing and comparison
const db = require('../db'); // Database connection

module.exports = function(passport) {
  // Configure the local strategy for username and password authentication
  passport.use(
    new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
      // Query the database to find the user by username
      const query = 'SELECT * FROM users WHERE username = ?';
      db.query(query, [username], (err, results) => {
        if (err) throw err; // Handle database errors
        if (results.length === 0) {
          // If no user is found, return an error message
          return done(null, false, { message: 'That username is not registered' });
        }

        const user = results[0]; // Retrieve the user record

        // Compare the provided password with the hashed password in the database
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err; // Handle bcrypt errors
          if (isMatch) {
            // If the passwords match, return the user object
            return done(null, user);
          } else {
            // If the passwords do not match, return an error message
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  // Serialize the user ID to store in the session
  passport.serializeUser((user, done) => {
    done(null, user.id); // Store the user ID in the session
  });

  // Deserialize the user by ID to retrieve the full user object
  passport.deserializeUser((id, done) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
      done(err, results[0]); // Return the user object
    });
  });
};
