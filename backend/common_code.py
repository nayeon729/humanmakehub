from fastapi import APIRouter, HTTPException
import pymysql
from pydantic import BaseModel
from database import db_config  # ✅ 원래대로!
 
router = APIRouter(prefix="/common", tags=["공통코드"])

# ✅ Pydantic 모델
class CommonCode(BaseModel):
    code_id: str
    code_name: str

class GroupCodeWithChildren(BaseModel):
    group_id: str
    group_name: str
    common_codes: list[CommonCode]

# ✅ 단일 그룹 코드 목록 조회
@router.get("/codes/{group_id}", response_model=list[CommonCode])
def get_common_codes(group_id: str):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT code_id, code_name 
                FROM common_code 
                WHERE group_id = %s AND use_yn = 'Y' AND del_yn = 'N'
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
