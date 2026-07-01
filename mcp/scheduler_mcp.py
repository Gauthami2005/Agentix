from memory.roadmap_manager import get_latest_roadmap
from memory.schedule_manager import create_schedule


def generate_schedule():
    """Generates today's and tomorrow's study schedule from the active learning roadmap."""
    try:
        roadmap = get_latest_roadmap()
        if not roadmap:
            
            create_schedule([], [])
            return {"today": [], "tomorrow": []}

        
        lines = [line.strip() for line in roadmap.split("\n") if line.strip()]

        
        today_tasks = lines[:3]
        tomorrow_tasks = lines[3:6]

       
        create_schedule(today_tasks, tomorrow_tasks)

        return {
            "today": today_tasks,
            "tomorrow": tomorrow_tasks
        }
    except Exception as e:
        print(f"Error generating schedule: {e}")
        
        try:
            create_schedule([], [])
        except Exception:
            pass
        return {"today": [], "tomorrow": []}
