module.exports = (sequelize, DataTypes) => {
  // Define the User model
  const User = sequelize.define('User', {
    // Field for the username
    username: {
      type: DataTypes.STRING, // String data type
      allowNull: false, // Username is required
      unique: true // Username must be unique
    },
    // Field for the first name
    first_name: {
      type: DataTypes.STRING, // String data type
      allowNull: false // First name is required
    },
    // Field for the last name
    last_name: {
      type: DataTypes.STRING, // String data type
      allowNull: false // Last name is required
    },
    // Field for the email
    email: {
      type: DataTypes.STRING, // String data type
      allowNull: false, // Email is required
      unique: true // Email must be unique
    },
    // Field for the password
    password: {
      type: DataTypes.STRING, // String data type
      allowNull: false // Password is required
    },
    // Field for the account creation timestamp
    created_at: {
      type: DataTypes.DATE, // Date data type
      defaultValue: DataTypes.NOW // Default value is the current timestamp
    }
  }, { 
    timestamps: false // Disable automatic timestamps (createdAt, updatedAt)
  });

  // Define associations for the User model
  User.associate = (models) => {
    // A user can have many comments
    User.hasMany(models.Comment, { foreignKey: 'user_id' });
    // A user can have many likes
    User.hasMany(models.Like, { foreignKey: 'user_id' });
  };

  // Return the User model
  return User;
};
