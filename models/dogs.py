from datetime import datetime
from db import db
from flask import jsonify


class Dog(db.Model):
    __tablename__ = 'Dogs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), nullable=False)
    name = db.Column(db.String, nullable=False)
    breed = db.Column(db.String, nullable=False)
    age = db.Column(db.Integer, nullable=False)
    weight = db.Column(db.Integer, nullable=False)
    size = db.Column(db.String, nullable=False)
    temperament = db.Column(db.String, nullable=False)
    health_conditions = db.Column(db.String, nullable=True)
    is_neutered = db.Column(db.Boolean, nullable=False)
    favorite_activities = db.Column(db.String, nullable=True)
    vaccination_status = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    bookings = db.relationship('Booking', backref='dog', lazy=True)

    @classmethod
    def insert_dog(cls, data):
        try:
            dog = cls(user_id=data['user_id'], name=data['name'], breed=data['breed'], age=data['age'],
                        weight=data['weight'], size=data['size'], temperament=data['temperament'],
                        health_conditions=data['health_conditions'], is_neutered=data['is_neutered'],
                        favorite_activities=data['favorite_activities'], vaccination_status=data['vaccination_status'])
            db.session.add(dog)
            db.session.commit()
            return_json = jsonify({"message": "Dog added", "dog_id": dog.id}), 201
        except Exception as e:
            print(e)
            return_json = jsonify({"message": "Error adding dog"}), 500

        return return_json

    @classmethod
    def get_all_users_dogs(cls, user_id):
        return cls.query.filter_by(user_id=user_id).all()
