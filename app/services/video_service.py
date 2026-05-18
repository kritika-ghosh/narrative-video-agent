import os
import json
from moviepy.editor import ImageClip, TextClip, CompositeVideoClip, concatenate_videoclips

class VideoService:
    def __init__(self):
        self.output_dir = "data/outputs"
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_video(self, job_id: str, script_json: str, image_paths_map: dict) -> str:
        """
        Takes the LLM's JSON script and renders the final MP4.
        image_paths_map is a dictionary linking the image filename/ID to its actual local path.
        """
        try:
            # Parse the JSON script from the Director
            # (We use json.loads directly because the LLM was instructed to return strict JSON)
            script_data = json.loads(script_json)
            clips = []

            for scene in script_data:
                img_id = scene.get("image_id")
                caption = scene.get("caption", "")
                duration = scene.get("duration", 3)  # Default to 3 seconds if missing

                img_path = image_paths_map.get(img_id)
                if not img_path or not os.path.exists(img_path):
                    print(f"Warning: Could not find image {img_id}")
                    continue

                # 1. Create the base image clip
                # Resize to a standard 1080p vertical or horizontal format (let's use 1920x1080 horizontal for now)
                base_clip = ImageClip(img_path).set_duration(duration).resize(height=1080, width=1920)

                # 2. Create the text overlay
                # Note: MoviePy TextClip requires ImageMagick installed on your system.
                try:
                    txt_clip = TextClip(
                        caption, 
                        fontsize=70, 
                        color='white', 
                        bg_color='rgba(0,0,0,0.5)', # Semi-transparent black background
                        method='caption',
                        size=(1600, None) # Keep text within bounds
                    )
                    # Center text at the bottom and set its duration to match the image
                    txt_clip = txt_clip.set_position(('center', 850)).set_duration(duration)
                    
                    # Merge image and text
                    composite = CompositeVideoClip([base_clip, txt_clip])
                    clips.append(composite)
                
                except Exception as e:
                    print(f"Text rendering failed for {img_id}, using raw image. Error: {e}")
                    clips.append(base_clip)

            if not clips:
                return "Error: No valid clips could be generated."

            # 3. Concatenate all scenes into one fluid timeline
            # (For MVP, we are using simple cuts. Transitions can be added to padding later)
            final_video = concatenate_videoclips(clips, method="compose")
            
            output_filepath = os.path.join(self.output_dir, f"{job_id}.mp4")
            
            # 4. Render to file
            # fps=24 gives it that cinematic look!
            final_video.write_videofile(output_filepath, fps=24, codec="libx264", audio=False)
            
            return output_filepath

        except Exception as e:
            return f"Error during video generation: {str(e)}"