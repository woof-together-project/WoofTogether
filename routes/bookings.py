from flask import Blueprint, request
from models.bookings import Booking

bookings_bp = Blueprint('bookings', __name__, url_prefix='/bookings')


@bookings_bp.route('/book_sitter', methods=['POST'])
def book_sitter():
    data = request.get_json()
    return Booking.book_sitter(data)


