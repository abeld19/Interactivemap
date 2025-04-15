module.exports = (sequelize, DataTypes) => {
  // Define the Comment model
  const Comment = sequelize.define('Comment', {
    // Field for the comment text
    comment_text: {
      type: DataTypes.TEXT, // Text data type for storing the comment
      allowNull: false // Comment text is required
    },
    // Field for the timestamp when the comment was made
    commented_at: {
      type: DataTypes.DATE, // Date data type for storing the timestamp
      defaultValue: DataTypes.NOW // Default value is the current timestamp
    }
  }, { 
    timestamps: false // Disable automatic timestamps (createdAt, updatedAt)
  });

  // Define associations for the Comment model
  Comment.associate = (models) => {
    // Associate Comment with Sighting (a comment belongs to a specific sighting)
    Comment.belongsTo(models.Sighting, { foreignKey: 'sighting_id' });
    // Associate Comment with User (a comment is made by a specific user)
    Comment.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  // Return the Comment model
  return Comment;
};
