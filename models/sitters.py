from db import db
from flask import jsonify

class Sitter(db.Model):
    __tablename__ = 'Sitters'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), nullable=False)
    experience_years = db.Column(db.Integer, nullable=False)
    availability = db.Column(db.String, nullable=False)
    rate = db.Column(db.Numeric, nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    reviews_count = db.Column(db.Integer, nullable=False)

    bookings = db.relationship('Booking', backref='sitter_profile', lazy=True)
    reviews = db.relationship('Review', backref='sitter', lazy=True)

    @classmethod
    def insert_sitter(cls, data):
        existing = cls.get_sitter_by_id(data['user_id'])
        if existing:
            return_json = jsonify({"message": "Sitter already exists", "user_id": existing.id}), 200

        else:
            try:
                sitter = cls(user_id=data['user_id'], experience_years=data['experience_years'],
                             availability=data['availability'], rate=data['rate'], rating=data['rating'],
                             reviews_count=data['reviews_count'])
                db.session.add(sitter)
                db.session.commit()
                return_json = jsonify({"message": "Sitter created", "user_id": sitter.id}), 201
            except Exception as e:
                print(e)
                return_json = jsonify({"message": "Error creating sitter"}), 500
        return return_json

    @classmethod
    def get_sitter_by_id(cls, user_id):
        return cls.query.filter_by(user_id=user_id).first()