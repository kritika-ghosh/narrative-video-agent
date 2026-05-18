import os
import json
from crewai import Agent, Task, LLM
from ..services.graph_service import GraphService

class DirectorAgent:
    def __init__(self):
        self.graph_service = GraphService()
        
        # The Director uses Groq to write the cohesive script
        self.llm = LLM(
            model="groq/llama3-8b-8192",
            api_key=os.getenv("GROQ_API_KEY")
        )

    def get_agent(self) -> Agent:
        return Agent(
            role='Narrative Director',
            goal='Sequence visual assets for maximum emotional impact and write cohesive, flowing captions.',
            backstory='You are an award-winning film director. You understand that a story is not just a list of events, '
                      'but a carefully paced emotional journey. You excel at writing subtle, engaging captions.',
            verbose=True,
            llm=self.llm,
            allow_delegation=False
        )

    def create_scripting_task(self, raw_dossier: str, user_prompt: str) -> Task:
        # First, we theoretically parse the JSON from the Archivist
        # and run it through our GraphService to get the sorted list.
        # (We will wire that actual connection up in our main pipeline runner next!)

        description = f"""
        Theme: '{user_prompt}'
        
        Here is the structured metadata for the images in the exact order they MUST appear in the video:
        {raw_dossier}
        
        Your task:
        1. Review the sequence. 
        2. Write a short, engaging caption (max 10 words) for each image that connects it to the previous one.
        3. Output the final result as a strict JSON array where each object has:
           - 'image_id': the ID or filename
           - 'caption': your generated text
           - 'duration': recommended seconds to show this image (between 2 to 5)
           - 'transition': recommended transition to the next image (e.g., 'crossfade', 'cut')
        
        Return ONLY valid JSON.
        """

        return Task(
            description=description,
            expected_output="A strict JSON array of objects detailing the script, captions, and timing.",
            agent=self.get_agent()
        )