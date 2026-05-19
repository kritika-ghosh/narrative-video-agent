import os
import json
# V2 Import (No '.editor'!)
from moviepy import ImageClip, TextClip, CompositeVideoClip, concatenate_videoclips
import os
os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

class VideoService:
    def __init__(self):
        self.output_dir = "data/outputs"
        os.makedirs(self.output_dir, exist_ok=True)
        # Uncomment and update this path if TextClip complains about ImageMagick on Windows
        # os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

    def generate_video(self, job_id: str, script_json: str, image_paths_map: dict) -> str:
        """Assembles a valid MP4 artifact from semantic timeline definitions."""
        try:
            script_data = json.loads(script_json)
            compiled_clips = []

            for timeline_event in script_data:
                img_id = timeline_event.get("image_id")
                caption = timeline_event.get("caption", "")
                duration = timeline_event.get("duration", 3.5)

                img_path = image_paths_map.get(img_id)
                if not img_path or not os.path.exists(img_path):
                    continue

                # V2 SYNTAX: with_duration() and resized()
                base_clip = ImageClip(img_path).with_duration(duration).resized(height=1080, width=1920)
                try:
                    # Point to a standard Windows font location
                    # On Windows, this is usually C:\Windows\Fonts\arial.ttf
                    font_path = "C:/Windows/Fonts/arial.ttf"
                    
                    txt_clip = TextClip(
                        text=caption, 
                        font=font_path, # Explicitly setting the path
                        font_size=64, 
                        color='white', 
                        method='caption',
                        size=(1600, None)
                    )
                    
                    txt_clip = txt_clip.with_position(('center', 880)).with_duration(duration)
                    
                    # Ensure the clip has a background for visibility
                    # CompositeVideoClip requires a list of clips. 
                    # We add a semi-transparent box behind the text if needed.
                    composite_scene = CompositeVideoClip([base_clip, txt_clip])
                    compiled_clips.append(composite_scene)
                
                except Exception as e:
                    print(f"[!] Text render failed: {e}")
                    # Keep the base clip so the video still renders
                    compiled_clips.append(base_clip)
                try:
                    # V2 SYNTAX: Uses text=, font=, and font_size=
                    txt_clip = TextClip(
                        text=caption, 
                        font="Arial", # V2 requires an explicit font
                        font_size=64, 
                        color='white', 
                        method='caption',
                        size=(1600, None)
                    )
                    # V2 SYNTAX: with_position()
                    txt_clip = txt_clip.with_position(('center', 880)).with_duration(duration)
                    
                    composite_scene = CompositeVideoClip([base_clip, txt_clip])
                    compiled_clips.append(composite_scene)
                
                except Exception as e:
                    print(f"Warning: Text render failed for {img_id}: {e}")
                    compiled_clips.append(base_clip)

            if not compiled_clips:
                return "Error: Empty layout sequence context."

            final_video = concatenate_videoclips(compiled_clips, method="compose")
            output_filepath = os.path.join(self.output_dir, f"{job_id}.mp4")
            
            final_video.write_videofile(
                output_filepath, 
                fps=24, 
                codec="libx264", 
                audio=False,
                logger=None 
            )
            
            return output_filepath

        except Exception as e:
            return f"Error executing assembly: {str(e)}"