import os
import json
import traceback
from crewai import Crew, Task
from pydantic import BaseModel, Field
from typing import List

# ---------------------------------------------------------
# STRICT PYDANTIC SCHEMAS (Forces the LLM to behave)
# ---------------------------------------------------------
class ImageMetadata(BaseModel):
    image_id: str = Field(description="The filename or ID of the image")
    subjects: List[str] = Field(description="List of primary visual anchors or subjects")
    setting: str = Field(description="Geographic or temporal environment context")
    color_palette: List[str] = Field(description="Dominant hex or descriptive colors")
    mood: str = Field(description="Emotional valence (e.g., melancholy, triumphant, serene, frantic)")
    action: str = Field(description="Implied narrative trajectory or static state description")

class DossierOutput(BaseModel):
    assets: List[ImageMetadata] = Field(description="List of visual data analyses for each image")

class ScriptScene(BaseModel):
    image_id: str = Field(description="The filename or ID of the image")
    caption: str = Field(description="Narrative bridge string (max 10 words)")
    duration: float = Field(description="Duration to display the image in seconds")
    transition_next: str = Field(description="FFmpeg xfade transition to the next scene based on mood (choose from: fade, pixelize, smoothleft, circlecrop, distance, radial)")

class ScriptOutput(BaseModel):
    scenes: List[ScriptScene] = Field(description="Ordered list of scenes for the video")

# ---------------------------------------------------------
# MASTER PIPELINE ORCHESTRATOR
# ---------------------------------------------------------
def run_video_pipeline(job_id: str, image_paths: list, user_prompt: str):
    # 🛡️ Initialize this at the top so it ALWAYS exists, even if the AI crashes!
    final_video_path = None 
    
    try:
        os.makedirs("data/uploads", exist_ok=True)
        os.makedirs("data/outputs", exist_ok=True)

        from .agents.archivist import ArchivistAgent
        from .agents.director import DirectorAgent
        from .services.graph_service import GraphService
        from .services.video_service import VideoService
        from .api.routes import fake_database

        # --- PHASE 1: PERCEPTION ---
        fake_database[job_id]["status"] = "Archivist is analyzing images..."
        fake_database[job_id]["progress"] = 20
        
        archivist = ArchivistAgent()
        archivist_task = archivist.create_analysis_task(image_paths, user_prompt)
        archivist_task.output_pydantic = DossierOutput
        archivist_task.expected_output = "A strict JSON object matching the DossierOutput schema containing a list of analyzed assets."
        
        crew_1 = Crew(agents=[archivist.get_agent()], tasks=[archivist_task], verbose=True)
        raw_metadata = crew_1.kickoff()
        
        # --- PHASE 2: GRAPH TRAVERSAL ---
        fake_database[job_id]["status"] = "Calculating narrative arc..."
        fake_database[job_id]["progress"] = 45
        
        if hasattr(raw_metadata, 'pydantic') and raw_metadata.pydantic:
             metadata_list = [asset.model_dump() for asset in raw_metadata.pydantic.assets]
        elif hasattr(raw_metadata, 'json_dict') and raw_metadata.json_dict:
             metadata_list = raw_metadata.json_dict.get('assets', [])
        else:
            raise ValueError("CrewAI failed to return a validated structure for the Archivist.")
            
        for i, meta in enumerate(metadata_list):
            if i < len(image_paths):
                meta["image_id"] = os.path.basename(image_paths[i])
            
        graph_service = GraphService()
        sorted_metadata = graph_service.find_optimal_narrative_path(metadata_list)
        sorted_dossier_str = json.dumps(sorted_metadata, indent=2)

        # --- PHASE 3: SCRIPTING ---
        fake_database[job_id]["status"] = "Director is writing the script..."
        fake_database[job_id]["progress"] = 70
        
        director = DirectorAgent()
        director_task = director.create_scripting_task(sorted_dossier_str, user_prompt)
        director_task.output_pydantic = ScriptOutput
        director_task.expected_output = "A strict JSON object matching the ScriptOutput schema containing the scenes list."
        
        crew_2 = Crew(agents=[director.get_agent()], tasks=[director_task], verbose=True)
        raw_script = crew_2.kickoff()

        # EXTRACT THE LLM'S DATA FIRST
        if hasattr(raw_script, 'pydantic') and raw_script.pydantic:
            clean_script_dict = [scene.model_dump() for scene in raw_script.pydantic.scenes]
        elif hasattr(raw_script, 'json_dict') and raw_script.json_dict:
            clean_script_dict = raw_script.json_dict.get('scenes', [])
        else:
            raise ValueError("CrewAI failed to return a validated structure for the Director.")
            
        clean_script_json = json.dumps(clean_script_dict)

        # --- PHASE 4: RENDERING ---
        fake_database[job_id]["status"] = "Applying transitions & rendering video..."
        fake_database[job_id]["progress"] = 90
        
        video_service = VideoService()
        image_paths_map = {os.path.basename(p): p for p in image_paths}
        
        final_video_path = video_service.generate_video(job_id, clean_script_json, image_paths_map)

        # --- PHASE 5: COMPLETE ---
        fake_database[job_id]["status"] = "completed"
        fake_database[job_id]["progress"] = 100
        fake_database[job_id]["video_url"] = final_video_path 

    except Exception as e:
        # 🛡️ Print the EXACT trace so we can see the real error!
        print("\n" + "="*50)
        print(f"[!] REAL PIPELINE CRASH CAUSE FOR {job_id}:")
        traceback.print_exc() 
        print("="*50 + "\n")
        
        fake_database[job_id]["status"] = f"Failed: {str(e)}"
        fake_database[job_id]["progress"] = 0