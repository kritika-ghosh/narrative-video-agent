import os
import json
# V2 Import (No '.editor'!)
from moviepy import ImageClip, TextClip, CompositeVideoClip, concatenate_videoclips
import platform
if platform.system() == "Windows":
    os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
else:
    os.environ["IMAGEMAGICK_BINARY"] = "/usr/bin/convert"

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

            # Determine the appropriate font dynamically
            if platform.system() == "Windows":
                font_path = "C:/Windows/Fonts/arial.ttf"
            else:
                # LiberationSans-Regular is standard on Debian/Ubuntu with fonts-liberation
                font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
                if not os.path.exists(font_path):
                    font_path = "Arial" # Fallback to standard font family name if absolute path is absent

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
                    txt_clip = TextClip(
                        text=caption, 
                        font=font_path, 
                        font_size=64, 
                        color='white', 
                        method='caption',
                        size=(1600, None)
                    )
                    
                    txt_clip = txt_clip.with_position(('center', 880)).with_duration(duration)
                    composite_scene = CompositeVideoClip([base_clip, txt_clip])
                    compiled_clips.append(composite_scene)
                
                except Exception as e:
                    print(f"[!] Text render failed for {img_id}: {e}")
                    # Keep the base clip so the video still renders
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