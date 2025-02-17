
module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define('Like', {
    liked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, { timestamps: false });

  Like.associate = (models) => {
    Like.belongsTo(models.Sighting, { foreignKey: 'sighting_id' });
    Like.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Like;
};