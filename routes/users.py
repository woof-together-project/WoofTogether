from flask import Blueprint, request, jsonify
from models.users import User

users_bp = Blueprint('users', __name__, url_prefix='/users')


@users_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    return User.insert_user(data)


@users_bp.route('/test', methods=['POST'])
def test_route():
    data = request.get_json()
    print("Received:", data)
    return jsonify({"status": "received", "data": data}), 200

