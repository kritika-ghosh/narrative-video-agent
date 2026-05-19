import os
import google.generativeai as genai
from PIL import Image

class VisionService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def analyze_image(self, image_path: str) -> str:
        """Passes an image to the VLM to extract semantic and emotional metadata."""
        if not self.model:
            return "Error: GEMINI_API_KEY not configured."

        try:
            img = Image.open(image_path)
            prompt = """
            Analyze this image for a video narrative pipeline. Return ONLY a JSON object with:
            - 'subjects': list of main subjects
            - 'setting': the environment or background
            - 'color_palette': 3 descriptive colors
            - 'mood': the emotional tone (e.g., melancholic, energetic)
            - 'action': what is happening
            """
            response = self.model.generate_content([prompt, img])
            return response.text
        except Exception as e:
            return f"Error analyzing image: {str(e)}"