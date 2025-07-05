import pymysql
from dotenv import load_dotenv
import os

load_dotenv()

db_config = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "temetum8003!"),
    "database": os.getenv("DB_NAME", "humanmakehub"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}