import os
import json
import platform
import subprocess

# V2 Import (No '.editor'!)
from moviepy import ImageClip, TextClip, CompositeVideoClip, concatenate_videoclips, ColorClip

if platform.system() == "Windows":
    os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
else:
    os.environ["IMAGEMAGICK_BINARY"] = "/usr/bin/convert"

class VideoService:
    def __init__(self):
        self.output_dir = "data/outputs"
        os.makedirs(self.output_dir, exist_ok=True)

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

                # Proportionally scale the image to fit 1920x1080 canvas
                img_clip = ImageClip(img_path).with_duration(duration)
                canvas_w, canvas_h = 1920, 1080
                orig_w, orig_h = img_clip.size
                
                orig_aspect = orig_w / orig_h
                canvas_aspect = canvas_w / canvas_h
                
                if orig_aspect > canvas_aspect:
                    # Scale to fit width (letterbox)
                    new_w = canvas_w
                    new_h = int(canvas_w / orig_aspect)
                else:
                    # Scale to fit height (pillarbox)
                    new_h = canvas_h
                    new_w = int(canvas_h * orig_aspect)
                
                # Force dimensions to be even numbers to ensure codec compliance
                new_w = (new_w // 2) * 2
                new_h = (new_h // 2) * 2
                
                scaled_img = img_clip.resized(width=new_w, height=new_h)
                
                # Compose centered scaled image on a standard black background
                bg_clip = ColorClip(size=(canvas_w, canvas_h), color=(0, 0, 0)).with_duration(duration)
                base_clip = CompositeVideoClip(
                    [bg_clip, scaled_img.with_position("center")],
                    size=(canvas_w, canvas_h)
                )

                try:
                    # Constrain the caption width to the visible width of the scaled image
                    text_w = min(1600, int(new_w * 0.9))
                    text_w = max(500, text_w)
                    
                    # Dynamically step down font size for narrower bounds
                    font_size = 64
                    if text_w < 1000:
                        font_size = 48
                    if text_w < 600:
                        font_size = 38

                    txt_clip = TextClip(
                        text=caption, 
                        font=font_path, 
                        font_size=font_size, 
                        color='white', 
                        stroke_color='black',
                        stroke_width=2,
                        method='caption',
                        size=(text_w, None)
                    )
                    
                    # Align dynamically from the bottom based on rendered height
                    margin_bottom = 60
                    y_pos = canvas_h - txt_clip.h - margin_bottom
                    y_pos = max(20, y_pos)  # Don't let it overflow above top

                    txt_clip = txt_clip.with_position(('center', y_pos)).with_duration(duration)
                    composite_scene = CompositeVideoClip([base_clip, txt_clip], size=(canvas_w, canvas_h))
                    scene_path = os.path.join(self.output_dir, f"{job_id}_scene_{len(compiled_clips)}.mp4")
                    composite_scene.write_videofile(scene_path, fps=24, codec="libx264", audio=False, logger=None)
                    
                    compiled_clips.append({"path": scene_path, "duration": duration})
                
                except Exception as e:
                    print(f"[!] Text render failed for {img_id}: {e}")
                    # Save the base clip anyway so it doesn't break
                    scene_path = os.path.join(self.output_dir, f"{job_id}_scene_{len(compiled_clips)}.mp4")
                    base_clip.write_videofile(scene_path, fps=24, codec="libx264", audio=False, logger=None)
                    compiled_clips.append({"path": scene_path, "duration": duration})

            if not compiled_clips:
                return "Error: Empty layout sequence context."

            # --- FFMPEG XFADE STITCHING LOOP ---
            current_video = compiled_clips[0]["path"]
            current_duration = compiled_clips[0]["duration"]
            
            fade_duration = 1.0 
            
            for i in range(1, len(compiled_clips)):
                next_video = compiled_clips[i]["path"]
                next_duration = compiled_clips[i]["duration"]
                
                out_video = os.path.join(self.output_dir, f"{job_id}_stitch_{i}.mp4")
                offset = current_duration - fade_duration
                
                llm_transition = script_data[i-1].get("transition_next", "fade")
                
                # BULLETPROOF XFADE: Normalize pixel formats and timebases before stitching
                filter_string = (
                    f"[0:v]format=yuv420p,settb=AVTB[v0];"
                    f"[1:v]format=yuv420p,settb=AVTB[v1];"
                    f"[v0][v1]xfade=transition={llm_transition}:duration={fade_duration}:offset={offset}[v]"
                )
                
                cmd = [
                    "ffmpeg", "-y",
                    "-i", current_video,
                    "-i", next_video,
                    "-filter_complex", filter_string,
                    "-map", "[v]",
                    "-c:v", "libx264",
                    out_video
                ]
                
                print(f"Stitching scene {i-1} and {i} with {llm_transition}...")
                
                try:
                    subprocess.run(cmd, check=True)
                except subprocess.CalledProcessError as e:
                    print(f"FFMPEG CRASHED ON STITCH {i}! Check the logs above.")
                    raise e 
                
                current_video = out_video
                current_duration = current_duration + next_duration - fade_duration

            final_video_path = os.path.join(self.output_dir, f"{job_id}_final.mp4")
            os.rename(current_video, final_video_path)
            return final_video_path

        except Exception as e:
            return f"Error executing assembly: {str(e)}"