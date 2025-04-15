module.exports = {
    ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      // If the user is authenticated, proceed to the next middleware or route handler
      return next();
    }
    // If the user is not authenticated, redirect to the login page
    res.redirect('/login');
  }
};
