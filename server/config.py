# config.py
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    confluence_url: str
    confluence_username: str
    confluence_api_token: str
    confluence_space_key: str # <-- ADD THIS LINE

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()