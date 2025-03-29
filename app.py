from flask import Flask
from flask_cors import CORS
from db import db
from config import Config

# Import your models so SQLAlchemy registers them
from models.users import User
from models.dogs import Dog
from models.sitters import Sitter
from models.bookings import Booking
from models.walking_partners import WalkingPartner
from models.reviews import Review

# Import your blueprints (routes)
from routes.users import users_bp
from routes.dogs import dogs_bp
from routes.sitters import sitters_bp
from routes.bookings import bookings_bp
from routes.reviews import reviews_bp
# from routes.walks import walks_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)

    db.init_app(app)

    # Register blueprints
    app.register_blueprint(users_bp)
    app.register_blueprint(dogs_bp)
    app.register_blueprint(sitters_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(reviews_bp)
    # app.register_blueprint(walks_bp)

    # Create all tables (optional: only needed locally at first)
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
