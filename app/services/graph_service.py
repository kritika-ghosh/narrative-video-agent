import json

class GraphService:
    def __init__(self):
        pass

    def calculate_edge_weight(self, node_a: dict, node_b: dict) -> int:
        """
        Calculates the narrative 'friction' or 'flow' between two images.
        Lower score = better flow.
        """
        score = 0
        
        # 1. Mood Continuity (Stark mood changes are jarring)
        if node_a.get('mood') != node_b.get('mood'):
            score += 5  

        # 2. Setting Continuity (Jumping locations adds friction)
        if node_a.get('setting') != node_b.get('setting'):
            score += 3

        # 3. Subject Continuity (Following the same subject is smooth)
        subjects_a = set(node_a.get('subjects', []))
        subjects_b = set(node_b.get('subjects', []))
        if not subjects_a.intersection(subjects_b):
            score += 2 # Penalty if no subjects overlap

        return score

    def find_optimal_narrative_path(self, metadata_list: list) -> list:
        """
        A lightweight greedy pathfinder to sort images based on the smoothest narrative flow.
        """
        if not metadata_list:
            return []

        # Start with the first uploaded image as the anchor (Node 0)
        unvisited = metadata_list.copy()
        current_node = unvisited.pop(0)
        sorted_path = [current_node]

        # Greedy Traversal: Always jump to the node with the least friction
        while unvisited:
            best_next_node = None
            lowest_friction = float('inf')
            
            for candidate in unvisited:
                friction = self.calculate_edge_weight(current_node, candidate)
                if friction < lowest_friction:
                    lowest_friction = friction
                    best_next_node = candidate
            
            sorted_path.append(best_next_node)
            unvisited.remove(best_next_node)
            current_node = best_next_node

        return sorted_path