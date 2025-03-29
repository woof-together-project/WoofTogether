from db import db
from flask import jsonify

class Booking(db.Model):
    __tablename__ = 'Bookings'

    id = db.Column(db.Integer, primary_key=True)
    sitter_id = db.Column(db.Integer, db.ForeignKey('Sitters.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), nullable=False)
    dog_id = db.Column(db.Integer, db.ForeignKey('Dogs.id'), nullable=False)
    booking_start_date = db.Column(db.DateTime, nullable=False)
    booking_end_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String, nullable=False)
    notes = db.Column(db.String, nullable=True)

    @classmethod
    def book_sitter(cls, data):
        overlapping_sitter = cls.query.filter(
            cls.sitter_id == data['sitter_id'],
            cls.booking_start_date < data['booking_end_date'],
            cls.booking_end_date > data['booking_start_date']
        ).first()

        already_booked_this = cls.query.filter(
            cls.user_id == data['user_id'],
            cls.booking_start_date < data['booking_end_date'],
            cls.booking_end_date > data['booking_start_date']
        ).first()

        if overlapping_sitter:
            return_json = jsonify({"error": "This sitter is already booked during the selected time."}), 409

        elif already_booked_this:
            return_json = jsonify({"error": "You already have a booking during this time."}), 409

        else:
            booking = cls(sitter_id=data['sitter_id'], user_id=data['user_id'], dog_id=data['dog_id'],
                          booking_start_date=data['booking_start_date'], booking_end_date=data['booking_end_date'],
                          status=data['status'], notes=data['notes'])
            db.session.add(booking)
            db.session.commit()
            return_json = jsonify({"message": "Booking created", "booking_id": booking.id}), 201
        return return_json

    @classmethod
    def get_all_bookings(cls):
        return cls.query.all()

    @classmethod
    def get_booking_by_id(cls, booking_id):
        return cls.query.filter_by(id=booking_id).first()

