
from fastapi import FastAPI
from user_routes_complete import app as user_app
from admin_routes import app as admin_app
import os
import pymysql
from fastapi.middleware.cors import CORSMiddleware

# 메인 앱 생성
app = FastAPI(title="HumanMakeHub 메인")

db_config = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "humanmakehub"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}
SECRET_KEY = os.getenv("SECRET_KEY", "dev")
ALGORITHM   = os.getenv("ALGORITHM", "HS256")
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",  # 개발 중일 때는 허용
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 역할별 서브앱 mount
app.mount("/user", user_app)
app.mount("/admin", admin_app)
