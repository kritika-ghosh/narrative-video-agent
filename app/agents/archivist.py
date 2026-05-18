from crewai import Agent, Task
from app.services.vision_service import VisionService

class ArchivistAgent:
    def __init__(self):
        self.vision_service = VisionService()

    def get_agent(self) -> Agent:
        return Agent(
            role='Lead Visual Archivist',
            goal='Extract deep semantic, visual, and emotional metadata from a batch of images.',
            backstory='You are a master archivist with a keen eye for visual storytelling. '
                      'You do not just see objects; you see mood, lighting, and narrative potential.',
            verbose=True,
            allow_delegation=False
        )

    def create_analysis_task(self, image_paths: list, user_prompt: str) -> Task:
        # In a full run, we would loop through image_paths and call self.vision_service.analyze_image()
        # For the task description, we instruct the agent on what to do with that data.
        
        description = f"""
        The user wants a video with the following theme/prompt: '{user_prompt}'.
        You have been provided a batch of {len(image_paths)} images. 
        Analyze the extracted visual data for each image and compile a 'Narrative Dossier'.
        Ensure you highlight the emotional tone and visual continuity between the assets.
        """

        return Task(
            description=description,
            expected_output="A structured JSON array containing the metadata dossier for every image.",
            agent=self.get_agent()
        )