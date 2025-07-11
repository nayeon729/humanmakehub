import pymysql
from dotenv import load_dotenv
import os

load_dotenv()

db_config = {
    "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", "temetum8003!"),
    "database": os.getenv("MYSQL_DATABASE", "humanmakehub"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}