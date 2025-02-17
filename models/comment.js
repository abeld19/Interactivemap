module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    commented_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, { timestamps: false });

  Comment.associate = (models) => {
    Comment.belongsTo(models.Sighting, { foreignKey: 'sighting_id' });
    Comment.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Comment;
};
