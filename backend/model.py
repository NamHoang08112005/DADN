from pydantic import BaseModel, Field
from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import List, Optional

class Config:
        # Allow None for any fields that are optional
        orm_mode = True
        anystr_strip_whitespace = True

class login_info(BaseModel):
    username: str = Field(..., min_length=1, max_length= 200) 
    password: str = Field(..., min_length=1, max_length= 255) 

class register_info(BaseModel):
    username: str = Field(..., min_length=1, max_length= 200) 
    password: str = Field(..., min_length=1, max_length= 255)
    email : str = Field(..., min_length=1, max_length= 255)
    date_of_birth : datetime
    SSN : str = Field(..., min_length=9, max_length= 9)


# Pydantic model to validate input
class FanSpeed(BaseModel):
    speed: int = Field(..., ge=0, le=100, description="Fan speed from 0 (off) to 100 (max)")

class ColorCode(str, Enum):
    RED =  "#FF0000"
    BLACK = "#2E2E2E"
    WHITE = "#F2F2F2"
    PURPLE = "#7E3F98"
    MAGENTA = "#FF00FF"
    CYAN = "#00CFFF"
    GREEN = "#00B050"
    YELLOW = "#FFFF00"
    ORANGE = "#F79646"

class Color(BaseModel):
     code : ColorCode