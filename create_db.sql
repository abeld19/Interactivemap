CREATE DATABASE map;

USE map;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sightings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  speciesName VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  image VARCHAR(255),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sighting_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  commented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sighting_id) REFERENCES sightings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (sighting_id),
  INDEX (user_id)
);

CREATE TABLE likes (
  sighting_id INT NOT NULL,
  user_id INT NOT NULL,
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sighting_id, user_id),
  FOREIGN KEY (sighting_id) REFERENCES sightings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id)
);



-- Create a new user
CREATE USER 'interactivemap'@'localhost' IDENTIFIED BY 'interactive1234';

-- Grant all privileges on the 'map' database to the new user
GRANT ALL PRIVILEGES ON map.* TO 'interactivemap'@'localhost';
