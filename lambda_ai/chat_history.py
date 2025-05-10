from db import SessionLocal, Base
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime


class ChatHistory(Base):
    __tablename__ = 'ChatHistory'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    @classmethod
    def get_chat_history(cls, user_id):
        with SessionLocal() as db_session:
            return db_session.query(cls).filter_by(user_id=user_id)\
                .order_by(ChatHistory.timestamp.desc()).limit(6).all()

    @classmethod
    def save_message(cls, user_id, role, content):
        with SessionLocal() as db_session:
            new_message = ChatHistory(user_id=user_id, role=role, content=content)
            db_session.add(new_message)
            db_session.commit()
            return new_message
