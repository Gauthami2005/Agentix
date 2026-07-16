from dotenv import load_dotenv
import os

load_dotenv(".env")

print("Groq Key:", os.getenv("GROQ_API_KEY"))