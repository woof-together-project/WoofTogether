from flask import Blueprint, request
from models.sitters import Sitter

sitters_bp = Blueprint('sitters', __name__, url_prefix='/sitters')


@sitters_bp.route('/signup_sitter', methods=['POST'])
def signup_sitter():
    data = request.get_json()
    return Sitter.insert_sitter(data)
