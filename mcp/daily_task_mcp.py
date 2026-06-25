from mcp.roadmap_manager import load_roadmaps


def today_tasks():

    data = load_roadmaps()

    if not data["roadmaps"]:
        return "No roadmap found."

    roadmap = data["roadmaps"][-1]["roadmap"]

    lines = roadmap.split("\n")

    tasks = []

    for line in lines:

        if "-" in line:

            tasks.append(line)

        if len(tasks) == 5:
            break

    return tasks