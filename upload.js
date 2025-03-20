const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const { classifyImage } = require('./imageClassifier'); 

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
  // Safely handle if speciesName is empty or undefined
  if (!speciesName || typeof speciesName !== 'string' || !speciesName.trim()) {
    return 'No species name provided.';
  }

  const safeName = speciesName.trim();
  const firstPart = safeName.includes(',') ? safeName.split(',')[0] : safeName;
  const words = safeName.split(' ');
  const lastTwoWords = words.slice(Math.max(words.length - 2, 0)).join(' ');

  const variations = [
    safeName,
    firstPart,
    lastTwoWords
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
  try {
    // The original filename from Multer
    const image = req.file ? req.file.filename : null;
    let predictedName = req.body.speciesName || '';

    // Fallback to the original image if there's no cropped base64
    let imagePath = `./public/uploads/${image}`;
    let tempCroppedFilePath = null;
    if (req.body.croppedImage) {
      const base64Data = req.body.croppedImage.replace(/^data:image\/\w+;base64,/, '');
      const croppedFilename = `cropped-${Date.now()}.jpg`;
      tempCroppedFilePath = path.join(__dirname, 'public', 'uploads', croppedFilename);
      fs.writeFileSync(tempCroppedFilePath, base64Data, 'base64');
    }

    // Classify the image with your Hugging Face or other classifier
    try {
      const classificationResult = await classifyImage(tempCroppedFilePath || imagePath);
      if (classificationResult.error && classificationResult.error.includes('Unauthorized')) {
        console.error('Invalid API key for Hugging Face.');
        return res.status(401).json({ success: false, message: 'Invalid API key for Hugging Face.' });
      }
      predictedName = classificationResult.label || predictedName;
      // Remove the temporary cropped file after classification
      if (tempCroppedFilePath) {
        fs.unlinkSync(tempCroppedFilePath);
      }
    } catch (error) {
      console.error('Failed to classify image:', error);
      if (error.message.includes('Hugging Face service unavailable (503)')) {
        // Handle the 503 error specifically
        console.error('Hugging Face service is unavailable. Please try again later.');
        return res.status(503).json({ success: false, message: 'Hugging Face service is unavailable. Please try again later.' });
      }
      // Fallback to original image classification if cropped image classification fails
      try {
        const classificationResult = await classifyImage(imagePath);
        predictedName = classificationResult.label || predictedName;
      } catch (fallbackError) {
        console.error('Failed to classify original image:', fallbackError);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    }

    // Get the Wikipedia description for the predicted name
    // Instead, respond with JSON containing the predicted name & final filename
    return res.json({
      success: true,
      imageFilename: path.basename(imagePath),  // e.g. "image-168000.jpg"
      predictedName: predictedName
    });

  } catch (error) {
    console.error('Error in processUpload:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { upload, processUpload, getWikipediaDescription };
