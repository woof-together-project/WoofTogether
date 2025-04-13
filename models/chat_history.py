from db import db
from datetime import datetime


class ChatHistory(db.Model):
    __tablename__ = 'ChatHistory'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def get_chat_history(cls, user_id):
        return cls.query.filter_by(user_id=user_id)\
                .order_by(ChatHistory.timestamp.desc()).limit(6).all()

    @classmethod
    def save_message(cls, user_id, role, content):
        new_message = ChatHistory(user_id=user_id, role=role, content=content)
        db.session.add(new_message)
        db.session.commit()
        return new_message
