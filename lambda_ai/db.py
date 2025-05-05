from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
import os

Base = declarative_base()
SessionLocal = sessionmaker()

def get_engine():
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_endpoint = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")

    return create_engine(
        f"mssql+pyodbc://{db_user}:{db_password}@{db_endpoint}:1433/{db_name}"
        "?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
    )

engine = get_engine()
SessionLocal.configure(bind=engine)
