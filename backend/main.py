
from fastapi import FastAPI
from user_routes_complete import app as user_app
from admin_routes import app as admin_app

# 메인 앱 생성
app = FastAPI(title="HumanMakeHub 메인")

# 역할별 서브앱 mount
app.mount("/user", user_app)
app.mount("/admin", admin_app)
