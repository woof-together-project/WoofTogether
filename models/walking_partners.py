from db import db


class WalkingPartner(db.Model):
    __tablename__ = 'WalkingPartners'

    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('Users.id'), nullable=False)
    dog_id = db.Column(db.Integer, db.ForeignKey('Dogs.id'), nullable=False)
    partner_dog_id = db.Column(db.Integer, db.ForeignKey('Dogs.id'), nullable=False)
    walk_date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String, nullable=False)
    status = db.Column(db.String, nullable=False)

    # Relationships
    partner = db.relationship('User', backref='walking_partner_profile', lazy=True)

    # Important: specify foreign_keys explicitly when referencing same table twice
    user_dog = db.relationship('Dog', foreign_keys=[dog_id], backref='walks_as_owner', lazy=True)
    partner_dog = db.relationship('Dog', foreign_keys=[partner_dog_id], backref='walks_as_partner', lazy=True)

    @classmethod
    def insert_walk(cls, partner_id, dog_id, partner_dog_id, walk_date, location, status):
        walk = cls(partner_id=partner_id, dog_id=dog_id, partner_dog_id=partner_dog_id, walk_date=walk_date,
                   location=location, status=status)
        db.session.add(walk)
        db.session.commit()
        return walk
