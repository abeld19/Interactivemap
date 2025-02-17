const multer = require('multer');
const path = require('path');
const axios = require('axios');
const db = require('./db'); // Import database connection
const { classifyImage } = require('./huggingface'); // Import Hugging Face API integration

// Configure storage for image uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only image files are allowed!');
    }
  }
});

// Function to get description from Wikipedia API
const getWikipediaDescription = async (speciesName) => {
  const keywords = speciesName.split(' ');
  for (const keyword of keywords) {
    try {
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(keyword)}`);
      if (response.status === 200 && response.data.extract) {
        return response.data.extract;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error(`Keyword not found on Wikipedia: ${keyword}`);
      } else {
        console.error('Error getting description from Wikipedia:', error);
      }
    }
  }
  return 'No description found.';
};

// Function to process the uploaded image
const processUpload = async (req, res) => {
  const image = req.file ? req.file.filename : null;
  let speciesName = req.body.speciesName;
  let description = 'No description found.';
  const date = req.body.date;

  try {
    // Classify the image using Hugging Face API
    if (image) {
      const classificationResult = await classifyImage(`./public/uploads/${image}`);
      speciesName = classificationResult.animal.label || speciesName;
    }

    // Get description from Wikipedia
    description = await getWikipediaDescription(speciesName);

    // Save to database
    const query = 'INSERT INTO sightings (speciesName, date, description, image, user_id) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [speciesName, date, description, image, req.user.id], (err, results) => {
      if (err) {
        console.error('Error saving sighting:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.redirect('/gallery');
    });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { upload, processUpload };
