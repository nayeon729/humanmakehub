from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
import pymysql
from database import db_config
from jwt_auth import get_current_user
from typing import Optional

router = APIRouter(tags=["Project"])
print("✅ project_routes.py 불러옴")
class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    estimated_duration: int
    budget: int
    urgency: str

class ProjectUpdate(BaseModel):
    status: str
    progress: int

class ProjectFlexibleUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    pm: Optional[str] = None

# --- 전체 프로젝트 가져오기
@router.get("/")
def get_all_projects(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = "SELECT * FROM project"
            cursor.execute(sql)
            result = cursor.fetchall()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 특정 프로젝트 가져오기
@router.get("/{project_id}")
def get_project_detail(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = "SELECT * FROM project WHERE id = %s"
            cursor.execute(sql, (project_id,))
            result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 프로젝트 수정 (상태, 진행률)
@router.put("/{project_id}")
def update_project(project_id: int, project: ProjectFlexibleUpdate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            fields = []
            values = []

            # 🔍 디버깅: 요청 데이터 출력
            print("📥 [PUT /project] 받은 project_id:", project_id)
            print("📥 받은 데이터:", project.dict())

            if project.status is not None:
                print("✅ 상태(status) 업데이트:", project.status)
                fields.append("status = %s")
                values.append(project.status)
            if project.progress is not None:
                print("✅ 진행률(progress) 업데이트:", project.progress)
                fields.append("progress = %s")
                values.append(project.progress)
            # if project.pm is not None:
            #     print("✅ PM 지정(pm):", project.pm)
            #     fields.append("pm = %s")
            #     values.append(project.pm)

            if not fields:
                print("⚠️ 업데이트할 필드 없음")
                raise HTTPException(status_code=400, detail="수정할 데이터가 없습니다.")

            sql = f"UPDATE project SET {', '.join(fields)} WHERE id = %s"
            values.append(project_id)

            # 🔍 디버깅: 최종 SQL 확인
            print("📄 실행할 SQL:", sql)
            print("📦 SQL 값:", values)

            cursor.execute(sql, tuple(values))
        conn.commit()
        return {"message": "프로젝트 업데이트 완료"}
    except Exception as e:
        import traceback
        print("❌ 예외 발생:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 프로젝트 삭제
@router.delete("/{project_id}")
def delete_project(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = "DELETE FROM project WHERE id = %s"
            cursor.execute(sql, (project_id,))
        conn.commit()
        return {"message": "프로젝트 삭제 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
