progress_db = {}

def update_progress(topic, score):

    progress_db[topic] = score

    return "Progress updated"


def weak_topics():

    weak = []

    for topic, score in progress_db.items():

        if score < 60:
            weak.append(topic)

    return weak