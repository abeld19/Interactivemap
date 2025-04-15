const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const { classifyImage } = require('./imageClassifier'); // Import the image classification logic

// Configure storage for image uploads
const storage = multer.diskStorage({
  destination: './public/uploads/', // Directory to store uploaded files
  filename: (req, file, cb) => {
    // Generate a unique filename using the field name, timestamp, and file extension
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Configure Multer for file uploads
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10000000, // Limit file size to 10MB
    fieldSize: 25 * 1024 * 1024 // Limit field size to 25MB (e.g., for base64 data)
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files (JPEG, JPG, PNG)
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true); // Accept the file
    } else {
      cb('Error: Only image files are allowed!'); // Reject the file
    }
  }
});

// Function to fetch a description from Wikipedia API
const getWikipediaDescription = async (speciesName) => {
  // Handle cases where speciesName is empty or invalid
  if (!speciesName || typeof speciesName !== 'string' || !speciesName.trim()) {
    return 'No species name provided.';
  }

  // Prepare variations of the species name for better search results
  const safeName = speciesName.trim();
  const firstPart = safeName.includes(',') ? safeName.split(',')[0] : safeName;
  const words = safeName.split(' ');
  const lastTwoWords = words.slice(Math.max(words.length - 2, 0)).join(' ');

  const variations = [
    safeName,
    firstPart,
    lastTwoWords
  ];

  // Attempt to fetch a description for each variation
  for (const variation of variations) {
    try {
      const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variation)}`);
      if (response.status === 200 && response.data.extract) {
        return response.data.extract; // Return the description if found
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Wikipedia page not found for:', variation); // Log if no page is found
      } else {
        console.error('Wikipedia fetch failed:', error); // Log other errors
      }
    }
  }
  return 'No description found.'; // Return a default message if no description is found
};

// Function to process the uploaded image
const processUpload = async (req, res) => {
  try {
    // Get the original filename from Multer
    const image = req.file ? req.file.filename : null;
    let predictedName = req.body.speciesName || '';

    // Determine the image path (use cropped image if provided)
    let imagePath = `./public/uploads/${image}`;
    let tempCroppedFilePath = null;
    if (req.body.croppedImage) {
      const base64Data = req.body.croppedImage.replace(/^data:image\/\w+;base64,/, '');
      const croppedFilename = `cropped-${Date.now()}.jpg`;
      tempCroppedFilePath = path.join(__dirname, 'public', 'uploads', croppedFilename);
      fs.writeFileSync(tempCroppedFilePath, base64Data, 'base64'); // Save the cropped image
    }

    // Classify the image using the classifier
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

      // Handle specific errors (e.g., service unavailable)
      if (error.message.includes('Hugging Face service unavailable (503)')) {
        console.error('Hugging Face service is unavailable. Please try again later.');
        return res.status(503).json({ success: false, message: 'Hugging Face service is unavailable. Please try again later.' });
      }

      // Fallback to classify the original image if cropped classification fails
      try {
        const classificationResult = await classifyImage(imagePath);
        predictedName = classificationResult.label || predictedName;
      } catch (fallbackError) {
        console.error('Failed to classify original image:', fallbackError);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    }

    // Respond with the predicted name and image filename
    return res.json({
      success: true,
      imageFilename: path.basename(imagePath), // Return the filename (e.g., "image-168000.jpg")
      predictedName: predictedName
    });

  } catch (error) {
    console.error('Error in processUpload:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Export the upload middleware and helper functions
module.exports = { upload, processUpload, getWikipediaDescription };
