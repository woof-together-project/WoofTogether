from flask import Blueprint, request
from models.reviews import Review

reviews_bp = Blueprint('reviews', __name__, url_prefix='/reviews')


@reviews_bp.route('/add_review', methods=['POST'])
def add_review():
    data = request.get_json()
    return Review.add_review(data)
