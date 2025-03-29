from datetime import datetime

from db import db


class Review(db.Model):
    __tablename__ = 'Reviews'

    id = db.Column(db.Integer, primary_key=True)
    sitter_id = db.Column(db.Integer, db.ForeignKey('Sitters.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), nullable=False)
    rating = db.Column(db.Numeric, nullable=False)
    comment = db.Column(db.String, nullable=False)
    review_date = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='reviews', lazy=True)

    @classmethod
    def add_review(cls, data):
        try:
            review = cls(sitter_id=data['sitter_id'], user_id=data['user_id'], rating=data['rating'], comment=data['comment'])
            db.session.add(review)
            db.session.commit()
        except Exception as e:
            return {"error": str(e)}, 400

        return {"message": "Review added", "review_id": review.id}, 201
