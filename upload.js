const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const db = require('./db'); // Import database connection
const { classifyImage } = require('./imageClassifier'); // Correctly import the classifyImage function

// Configure storage for image uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
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
  const variations = [
    speciesName,
    speciesName.split(',')[0], // Try the first part before the comma
    speciesName.split(' ').slice(-2).join(' '), // Try the last two words
  ];

  for (const variation of variations) {
    try {
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variation)}`);
      if (response.status === 200 && response.data.extract) {
        return response.data.extract;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Wikipedia page not found for:', variation);
      } else {
        console.error('Wikipedia fetch failed:', error);
      }
    }
  }
  return 'No description found.';
};

// Function to process the uploaded image
const processUpload = async (req, res) => {
  const image = req.file ? req.file.filename : null;
  let speciesName = req.body.speciesName || ''; // Make speciesName optional
  let description = 'No description found.';

  try {
    // Check if croppedImage is provided
    const croppedImage = req.body.croppedImage;
    let imagePath = `./public/uploads/${image}`;

    if (croppedImage) {
      // Decode base64 to a file
      const base64Data = croppedImage.replace(/^data:image\/\w+;base64,/, '');
      const croppedFilename = `cropped-${Date.now()}.jpg`;
      const croppedFilePath = path.join(__dirname, 'public', 'uploads', croppedFilename);
      fs.writeFileSync(croppedFilePath, base64Data, 'base64');
      imagePath = croppedFilePath;
    }

    // Classify the image using Hugging Face API
    if (imagePath) {
      try {
        const classificationResult = await classifyImage(imagePath);
        speciesName = classificationResult.label || speciesName;
      } catch (error) {
        console.error('Failed to classify cropped image, falling back to original image:', error);
        if (error.message.includes('Hugging Face service unavailable (503)')) {
          // Handle the 503 error specifically
          console.error('Hugging Face service is unavailable. Please try again later.');
          return res.status(503).send('Hugging Face service is unavailable. Please try again later.');
        }
        const classificationResult = await classifyImage(`./public/uploads/${image}`);
        speciesName = classificationResult.label || speciesName;
      }
    }

    // Get description from Wikipedia
    description = await getWikipediaDescription(speciesName);

    // Save to database
    const query = 'INSERT INTO sightings (speciesName, description, image, user_id) VALUES (?, ?, ?, ?)';
    db.query(query, [speciesName, description, image, req.user.id], (err, results) => {
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
