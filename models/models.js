const Sequelize = require('sequelize');
const sequelize = new Sequelize('map', 'interactivemap', 'interactive1234', {
  host: 'localhost',
  dialect: 'mysql', // Specify the dialect
  logging: false // Disable logging; default: console.log
});

const User = require('./userModel')(sequelize, Sequelize.DataTypes);
const Comment = require('./comment')(sequelize, Sequelize.DataTypes);
const Like = require('./like')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
User.hasMany(Like, { foreignKey: 'user_id', as: 'likes' });

Sighting.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Sighting.hasMany(Comment, { foreignKey: 'sighting_id', as: 'comments' });
Sighting.hasMany(Like, { foreignKey: 'sighting_id', as: 'likes' });

Comment.belongsTo(Sighting, { foreignKey: 'sighting_id', as: 'sighting' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Like.belongsTo(Sighting, { foreignKey: 'sighting_id', as: 'sighting' });
Like.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = {
  sequelize,
  Sequelize,
  User,
  Sighting,
  Comment,
  Like
};

module.exports = db;
