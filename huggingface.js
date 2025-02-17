const { exec } = require("child_process");
const path = require("path");

async function classifyImage(imagePath) {
    return new Promise((resolve, reject) => {
        const pythonExecutable = path.join(__dirname, 'myenv1', 'bin', 'python3.10'); // Use myenv1 for model detection
        const scriptPath = path.join(__dirname, 'classify.py');

        exec(`${pythonExecutable} ${scriptPath} "${imagePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("Error processing image:", stderr);
                reject(new Error(stderr));
            } else {
                try {
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        reject(new Error(result.error));
                    } else {
                        resolve(result);
                    }
                } catch (parseError) {
                    reject(new Error("Failed to parse JSON response: " + parseError.message));
                }
            }
        });
    });
}

module.exports = { classifyImage };
