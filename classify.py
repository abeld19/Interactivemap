import requests
import sys
import json
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Hugging Face API URL and API key
API_URL = "https://api-inference.huggingface.co/models/microsoft/resnet-50"
API_KEY = os.getenv("HUGGING_FACE_API_KEY")

# Exit if the API key is not set
if not API_KEY:
    print("Error: HUGGING_FACE_API_KEY is not set in the .env file.", file=sys.stderr)
    sys.exit(1)

# Authorization headers for API requests
headers = {"Authorization": f"Bearer {API_KEY}"}

# Initialize the Hugging Face InferenceClient
client = InferenceClient(
    provider="hf-inference",
    api_key=API_KEY,  # Use the API key from the environment variable
)

def query(filename):
    try:
        # Attempt to use the InferenceClient for classification
        print("Using InferenceClient for classification", file=sys.stderr)
        output = client.image_classification(filename, model="microsoft/resnet-50")
        return output
    except Exception as e:
        print(f"InferenceClient failed: {e}. Falling back to direct API.", file=sys.stderr)

    # Fallback to direct API call
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers={"Content-Type": "image/jpeg", **headers}, data=data)

    if response.status_code == 401:
        print("Debug: Unauthorized error. Check if the API key is valid and has permissions.", file=sys.stderr)
        return {"error": "Unauthorized: Invalid or missing API key (401)"}
    if response.status_code == 503:
        return {"error": "Hugging Face service unavailable (503)"}
    if response.status_code != 200:
        print(f"Debug: Unexpected status code {response.status_code}. Response: {response.text}", file=sys.stderr)
        return {"error": f"HF API returned status {response.status_code}"}

    return response.json()

def classify_image(image_path):
    try:
        output = query(image_path)
        if isinstance(output, dict) and "error" in output:
            raise Exception(output["error"])
        label = output[0]['label']
        return {
            "label": label,
            "confidence": output[0]['score']  # Confidence score provided by the API
        }
    except Exception as e:
        return {"error": f"Failed to classify image: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    result = classify_image(image_path)
    print(json.dumps(result))
