# config.py
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # --- Confluence Settings ---
    confluence_url: str
    confluence_username: str
    confluence_api_token: str
    confluence_space_key: str

    # --- Database Settings (NEW) ---
    database_url: str

    # --- JWT Security Settings (NEW) ---
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()