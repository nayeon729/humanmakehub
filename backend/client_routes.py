from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
import pymysql
from database import db_config
from jwt_auth import get_current_user 

router = APIRouter( tags=["Client"])

