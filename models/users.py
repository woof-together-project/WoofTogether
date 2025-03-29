from datetime import datetime
from db import db
from flask import jsonify


class User(db.Model):
    __tablename__ = 'Users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, nullable=False)
    provider = db.Column(db.String, nullable=False)
    provider_id = db.Column(db.String,  nullable=False)
    phone = db.Column(db.String, nullable=True)
    profile_picture_url = db.Column(db.String, nullable=True)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)

    dogs = db.relationship('Dog', backref='owner', lazy=True)
    sitter_profile = db.relationship("Sitter", uselist=False, backref="user")
    bookings = db.relationship('Booking', backref='user', lazy=True)

    @classmethod
    def insert_user(cls, data):
        existing = User.get_user_by_id(data['provider_id'])
        if existing:
            return_json = jsonify({"message": "User already exists", "user_id": existing.id}), 200
        else:
            try:
                user = cls(name=data['name'], email=data['email'], provider=data['provider'],
                           provider_id=data['provider_id'], phone=data['phone'], profile_picture_url=data['profile_picture_url'])
                db.session.add(user)
                db.session.commit()
                return_json = jsonify({"message": "User created", "user_id": user.id}), 201
            except Exception as e:
                print(e)
                return_json = jsonify({"message": "Error creating user"}), 500
        return return_json

    @classmethod
    def get_user_by_id(cls, provider_id):
        return cls.query.filter_by(provider_id=provider_id).first()
