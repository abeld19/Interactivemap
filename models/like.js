module.exports = (sequelize, DataTypes) => {
  // Define the Like model
  const Like = sequelize.define('Like', {
    // Field for the timestamp when the like was made
    liked_at: {
      type: DataTypes.DATE, // Date data type for storing the timestamp
      defaultValue: DataTypes.NOW // Default value is the current timestamp
    }
  }, { 
    timestamps: false // Disable automatic timestamps (createdAt, updatedAt)
  });

  // Define associations for the Like model
  Like.associate = (models) => {
    // Associate Like with Sighting (a like belongs to a specific sighting)
    Like.belongsTo(models.Sighting, { foreignKey: 'sighting_id' });
    // Associate Like with User (a like is made by a specific user)
    Like.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  // Return the Like model
  return Like;
};