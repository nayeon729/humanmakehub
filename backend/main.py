from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from user_routes_complete import router as user_router
from admin_routes import router as admin_router

# .env 환경변수 로딩
load_dotenv()

# FastAPI 앱 생성
app = FastAPI(title="HumanMakeHub 메인")

# CORS 설정
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",  # 개발 중일 때 허용
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 라우터 포함
app.include_router(user_router, prefix="/user")
app.include_router(admin_router, prefix="/admin")

# 루트 확인용
@app.get("/")
def read_root():
    return {"message": "Hello from main.py 👋"}
