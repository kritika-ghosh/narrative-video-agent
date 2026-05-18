import os
import json
from crewai import Crew

def clean_llm_json(raw_text: str) -> str:
    """Helper to strip out markdown formatting if the LLM adds it."""
    return raw_text.replace('```json', '').replace('```', '').strip()

def run_video_pipeline(job_id: str, image_paths: list, user_prompt: str):
    """The main background task that orchestrates the entire agentic flow."""
    try:
        from .agents.archivist import ArchivistAgent
        from .agents.director import DirectorAgent
        from .services.graph_service import GraphService
        from .services.video_service import VideoService
        from .services.vision_service import VisionService
        from .api.routes import fake_database
        # --- PHASE 1: PERCEPTION ---
        fake_database[job_id]["status"] = "Archivist is analyzing images..."
        fake_database[job_id]["progress"] = 15
        
        archivist = ArchivistAgent()
        archivist_task = archivist.create_analysis_task(image_paths, user_prompt)
        
        crew_1 = Crew(agents=[archivist.get_agent()], tasks=[archivist_task], verbose=True)
        raw_metadata = crew_1.kickoff()
        
        # --- PHASE 2: GRAPH TRAVERSAL ---
        fake_database[job_id]["status"] = "Calculating narrative arc..."
        fake_database[job_id]["progress"] = 40
        
        clean_metadata = clean_llm_json(raw_metadata.raw)
        metadata_list = json.loads(clean_metadata)
        
        # Inject the actual filenames into the metadata so the Director knows what they are called
        for i, meta in enumerate(metadata_list):
            meta["image_id"] = os.path.basename(image_paths[i])
            
        graph_service = GraphService()
        sorted_metadata = graph_service.find_optimal_narrative_path(metadata_list)
        sorted_dossier_str = json.dumps(sorted_metadata, indent=2)

        # --- PHASE 3: SCRIPTING ---
        fake_database[job_id]["status"] = "Director is writing the script..."
        fake_database[job_id]["progress"] = 60
        
        director = DirectorAgent()
        director_task = director.create_scripting_task(sorted_dossier_str, user_prompt)
        
        crew_2 = Crew(agents=[director.get_agent()], tasks=[director_task], verbose=True)
        raw_script = crew_2.kickoff()

        # --- PHASE 4: RENDERING ---
        fake_database[job_id]["status"] = "Rendering video via MoviePy..."
        fake_database[job_id]["progress"] = 85
        
        clean_script = clean_llm_json(raw_script.raw)
        video_service = VideoService()
        
        # Create a dictionary mapping the filename to its absolute path on the hard drive
        image_paths_map = {os.path.basename(p): p for p in image_paths}
        
        final_video_path = video_service.generate_video(job_id, clean_script, image_paths_map)

        # --- PHASE 5: COMPLETE ---
        fake_database[job_id]["status"] = "completed"
        fake_database[job_id]["progress"] = 100
        fake_database[job_id]["video_url"] = final_video_path 

    except Exception as e:
        print(f"Pipeline crashed for {job_id}: {str(e)}")
        fake_database[job_id]["status"] = f"Failed: {str(e)}"
        fake_database[job_id]["progress"] = 0