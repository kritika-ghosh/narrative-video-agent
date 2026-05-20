import os
import json
from crewai import Agent, Task, LLM
from ..services.graph_service import GraphService

class DirectorAgent:
    def __init__(self):
        self.graph_service = GraphService()
        
        # The Director uses Groq to write the cohesive script
        self.llm = LLM(
            model="groq/llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY")
        )

    def get_agent(self) -> Agent:
        return Agent(
            role='Narrative Director & Visual Editor',
            goal='Sequence visual assets for maximum emotional impact, choose cinematic transitions, score the soundtrack, and write cohesive captions.',
            backstory='You are an award-winning film director. You understand that a story is not just a list of events, '
                      'but a carefully paced emotional journey. You excel at writing engaging captions, choosing the perfect AI soundtrack, and selecting specific visual transitions (like pixel wipes or smooth cuts) to convey mood.',
            verbose=True,
            llm=self.llm,
            allow_delegation=False
        )

    def create_scripting_task(self, raw_dossier: str, user_prompt: str) -> Task:
        description = f"""
        Theme: '{user_prompt}'
        
        Here is the structured metadata for the images in the exact order they MUST appear in the video:
        {raw_dossier}
        
        Your task:
        1. Review the overall narrative sequence and the user's theme.
        2. Invent a highly detailed 'bgm_prompt' for an AI audio generator to score this exact video (e.g., 'Cinematic Hans Zimmer style orchestral swell, tense, 120bpm').
        3. Write the scenes. For each image in the sequence:
           - Retain its exact 'image_id'.
           - Write a short, engaging 'caption' (max 10 words) that bridges the narrative.
           - Assign a display 'duration' (between 2.5 and 5.0 seconds).
           - Assign a 'transition_next' describing how to visually transition to the *next* image based on the mood shift. 
             You MUST choose from exactly one of these strings: fade, pixelize, smoothleft, circlecrop, distance, radial.
             
        Return ONLY valid JSON matching the expected schema.
        """

        return Task(
            description=description,
            expected_output="A strict JSON object containing a 'bgm_prompt' string and a 'scenes' array detailing the script, captions, durations, and transitions.",
            agent=self.get_agent()
        )