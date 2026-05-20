import os
import requests
import time

def generate_audio_direct(prompt, output_path):
    # Use the base API inference URL
    api_url = "https://api-inference.huggingface.co/models/facebook/musicgen-medium"
    headers = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"}
    payload = {"inputs": prompt}

    print(f"[Audio] Requesting: {prompt}")

    # The API might be loading (503), so we loop to retry
    for i in range(5):
        response = requests.post(api_url, headers=headers, json=payload)
        
        if response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"✅ Success! Saved to {output_path}")
            return True
        elif response.status_code == 503:
            wait_time = response.json().get("estimated_time", 20)
            print(f"⚠️ Model loading... waiting {wait_time}s")
            time.sleep(wait_time)
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            break
    return False

# Test it
generate_audio_direct("Cinematic, peaceful orchestral score, 90bpm", "test_output.wav")