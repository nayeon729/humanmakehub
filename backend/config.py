import os
from dotenv import load_dotenv

load_dotenv()

FRONT_BASE_URL = os.getenv("FRONT_BASE_URL", "http://localhost:3000")