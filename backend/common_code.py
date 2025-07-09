from fastapi import APIRouter, HTTPException, Depends, Body
import pymysql
from pydantic import BaseModel
from database import db_config  # ✅ 원래대로!
from typing import List
from jwt_auth import get_current_user 

 
router = APIRouter(prefix="", tags=["공통코드"])

# ✅ Pydantic 모델
class CommonCode(BaseModel):
    code_id: str
    code_name: str

class GroupCodeWithChildren(BaseModel):
    group_id: str
    group_name: str
    common_codes: List[CommonCode]

# ✅ 단일 그룹 코드 목록 조회
@router.get("/codes/{group_id}", response_model=List[CommonCode])
def get_common_codes(group_id: str):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT code_id, code_name 
                FROM common_code 
                WHERE group_id = %s AND del_yn = 'N'
            """, (group_id,))
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ✅ 전체 그룹 + 공통코드 함께 조회
@router.get("/groups", response_model=list[GroupCodeWithChildren])
def get_groups_with_codes():
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT group_id, group_name 
                FROM group_code 
                WHERE use_yn = 'Y' AND del_yn = 'N'
            """)
            groups = cursor.fetchall()

            cursor.execute("""
                SELECT code_id, code_name, group_id 
                FROM common_code 
                WHERE use_yn = 'Y' AND del_yn = 'N'
            """)
            codes = cursor.fetchall()

        group_map = {g["group_id"]: {**g, "common_codes": []} for g in groups}
        for code in codes:
            if code["group_id"] in group_map:
                group_map[code["group_id"]]["common_codes"].append({
                    "code_id": code["code_id"],
                    "code_name": code["code_name"]
                })

        return list(group_map.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/alerts")
def get_alerts(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT alert_id, title, message, link
                FROM alerts
                WHERE target_user = %s AND del_yn = 'N'
                ORDER BY create_dt DESC
            """, (user["user_id"],))
            return cursor.fetchall()
    finally:
        conn.close()


@router.put("/alerts/{alert_id}/delete")
def delete_alert(alert_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # 해당 알림을 del_yn = 'Y'로 업데이트
            cursor.execute("""
                UPDATE alerts
                SET del_yn = 'Y', update_dt = NOW(), update_id = %s
                WHERE alert_id = %s AND target_user = %s
            """, (user["user_id"], alert_id, user["user_id"]))
        conn.commit()
        return {"message": "알림이 삭제되었습니다."}
    finally:
        conn.close()