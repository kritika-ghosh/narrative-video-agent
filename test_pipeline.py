import os
import requests
import json

url = "http://127.0.0.1:8000/api/v1/generate"

# 1. Point this to real images on your machine.
# If they are sitting directly in your root folder, you can just use "image1.jpg"
image_paths = ["image1.jpg", "image3.jpg"]

files = []
for path in image_paths:
    if os.path.exists(path):
        files.append(('images', (os.path.basename(path), open(path, 'rb'), 'image/jpeg')))
    else:
        print(f"Warning: Could not find image file at: {os.path.abspath(path)}")

if not files:
    print("Error: No valid image files found to test with. Aborting request.")
    exit(1)

data = {
    "prompt": "A beautiful cinematic sunset transitioning into a cozy starry night",
    "theme": "cinematic"
}

print("Directly transmitting file binary payloads to FastAPI...")
try:
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Connection failed: {e}")