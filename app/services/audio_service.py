import os
import requests

class AudioService:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/cvssp/audioldm2"
        # We will add this token to Hugging Face secrets later
        self.headers = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"}

    def generate_bgm(self, prompt: str, output_path: str) -> str:
        """Calls the free Hugging Face Inference API to generate audio."""
        print(f"Generating BGM for: {prompt}")
        
        try:
            response = requests.post(self.api_url, headers=self.headers, json={"inputs": prompt})
            
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                print("BGM successfully generated!")
                return output_path
            else:
                print(f"BGM Generation failed: {response.text}")
                return None
        except Exception as e:
            print(f"BGM request error: {str(e)}")
            return None