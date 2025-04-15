// Import Sequelize for database connection and ORM functionality
const Sequelize = require('sequelize');

// Initialize Sequelize with database credentials
const sequelize = new Sequelize('map', 'interactivemap', 'interactive1234', {
  host: 'localhost', // Database host
  dialect: 'mysql', // Database dialect (MySQL in this case)
  logging: false // Disable logging for cleaner output
});

// Import models
const User = require('./userModel')(sequelize, Sequelize.DataTypes); // User model
const Comment = require('./comment')(sequelize, Sequelize.DataTypes); // Comment model
const Like = require('./like')(sequelize, Sequelize.DataTypes); // Like model

// Define associations between models

// A user can have many comments
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
// A user can have many likes
User.hasMany(Like, { foreignKey: 'user_id', as: 'likes' });

// A sighting belongs to a user
Sighting.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// A sighting can have many comments
Sighting.hasMany(Comment, { foreignKey: 'sighting_id', as: 'comments' });
// A sighting can have many likes
Sighting.hasMany(Like, { foreignKey: 'sighting_id', as: 'likes' });

// A comment belongs to a sighting
Comment.belongsTo(Sighting, { foreignKey: 'sighting_id', as: 'sighting' });
// A comment belongs to a user
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// A like belongs to a sighting
Like.belongsTo(Sighting, { foreignKey: 'sighting_id', as: 'sighting' });
// A like belongs to a user
Like.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Export the database object containing Sequelize and all models
const db = {
  sequelize, // Sequelize instance
  Sequelize, // Sequelize library
  User, // User model
  Sighting, // Sighting model
  Comment, // Comment model
  Like // Like model
};

module.exports = db;
