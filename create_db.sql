CREATE DATABASE map;

USE map;

CREATE TABLE sightings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  speciesName VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  image VARCHAR(255)
);

CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL
);
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a new user
CREATE USER 'interactivemap'@'localhost' IDENTIFIED BY 'interactive1234';

-- Grant all privileges on the 'map' database to the new user
GRANT ALL PRIVILEGES ON map.* TO 'interactivemap'@'localhost';
