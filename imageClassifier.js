const { exec } = require("child_process");
const path = require("path");

async function classifyImage(imagePath) {
    return new Promise((resolve, reject) => {
        const pythonExecutable = path.join(__dirname, 'myenv1', 'bin', 'python3.10'); // Use myenv1 for model detection
        const scriptPath = path.join(__dirname, 'classify.py');

        exec(`${pythonExecutable} ${scriptPath} "${imagePath}"`, (error, stdout, stderr) => {
            console.log(`Executing: ${pythonExecutable} ${scriptPath} "${imagePath}"`); // Log the command
            if (error) {
                console.error("Error processing image:", stderr);
                reject(new Error(stderr));
            } else {
                console.log("Raw output:", stdout); // Log the raw output for debugging
                try {
                    // Filter out non-JSON lines from stdout
                    const jsonOutput = stdout.split('\n').find(line => line.trim().startsWith('{'));
                    if (!jsonOutput) {
                        throw new Error("No valid JSON found in output");
                    }
                    const result = JSON.parse(jsonOutput);
                    if (result.error) {
                        console.error("Classification error:", result.error); // Log classification errors
                        reject(new Error(result.error));
                    } else {
                        resolve(result);
                    }
                } catch (parseError) {
                    console.error("Failed to parse JSON response:", parseError.message);
                    console.error("Raw output:", stdout); // Log the raw output for debugging
                    reject(new Error("Failed to parse JSON response: " + parseError.message));
                }
            }
        });
    });
}

module.exports = { classifyImage };
