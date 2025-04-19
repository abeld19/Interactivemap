require('dotenv').config();   

const { exec } = require("child_process");
const path = require("path");

async function classifyImage(imagePath) {
    return new Promise((resolve, reject) => {
        // Define the Python executable and script path
        const pythonExecutable = path.join(__dirname, 'myenv1', 'bin', 'python3'); // Use myenv1 for model detection
        const scriptPath = path.join(__dirname, 'classify.py');

        // Execute the Python script with the image path as an argument
        exec(`${pythonExecutable} ${scriptPath} "${imagePath}"`, (error, stdout, stderr) => {
            if (error) {
                // Log and reject the promise if an error occurs
                console.error("Error processing image:", stderr);
                reject(new Error(stderr));
            } else {
                console.log("Raw output:", stdout); // Log the raw output for debugging
                try {
                    // Parse the JSON response from the Python script
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        // Reject the promise if the response contains an error
                        reject(new Error(result.error));
                    } else {
                        // Resolve the promise with the classification result
                        resolve(result);
                    }
                } catch (parseError) {
                    // Handle JSON parsing errors
                    console.error("Failed to parse JSON response:", parseError.message);
                    console.error("Raw output:", stdout); // Log the raw output for debugging
                    reject(new Error("Failed to parse JSON response: " + parseError.message));
                }
            }
        });
    });
}

// Export the classifyImage function for use in other parts of the application
module.exports = { classifyImage };
