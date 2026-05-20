import os
import time
import requests

class AudioService:
    def __init__(self):
        # Switched to Meta's MusicGen (Highly reliable on the Free Tier!)
        self.api_url = "https://api-inference.huggingface.co/models/facebook/musicgen-small"
        self.headers = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"}

    def generate_bgm(self, prompt: str, output_path: str, max_retries: int = 5) -> str:
        """Calls the HF API and automatically waits if the model is sleeping."""
        print(f"\n[AudioService] Requesting soundtrack: '{prompt}'")
        
        if not os.getenv("HF_TOKEN"):
            print("[!] ERROR: HF_TOKEN is missing! Did you forget to set it in your terminal?")
            return None

        payload = {"inputs": prompt}

        for attempt in range(max_retries):
            try:
                response = requests.post(self.api_url, headers=self.headers, json=payload)
                
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    print("[AudioService] ✅ BGM successfully generated and saved!")
                    return output_path
                
                elif response.status_code == 503:
                    # The model is asleep. Extract the estimated wait time from HF's JSON.
                    estimated_time = response.json().get("estimated_time", 15)
                    print(f"[AudioService] Model is waking up. Waiting {estimated_time:.1f} seconds... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(estimated_time + 2) # Add a 2-second buffer
                
                else:
                    print(f"[!] Audio API Error {response.status_code}: {response.text}")
                    return None
                    
            except Exception as e:
                print(f"[!] Audio request crashed: {str(e)}")
                return None
        
        print("[!] AudioService failed after maximum retries.")
        return None