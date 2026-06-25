def save_to_file(task):
    with open("agent_notes.txt", "a") as f:
        f.write(task + "\n")
    return "Saved to file"