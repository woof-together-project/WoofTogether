from flask import Blueprint, request, jsonify
from models.dogs import Dog
from db import db

dogs_bp = Blueprint('dogs', __name__, url_prefix='/dogs')


@dogs_bp.route('/', methods=['POST'])
def add_dog():
    data = request.get_json()

    try:
        dog = Dog(
            user_id=data['user_id'],
            name=data['name'],
            breed=data['breed'],
            age=data['age'],
            weight=data['weight'],
            size=data['size'],
            temperament=data['temperament'],
            health_conditions=data.get('health_conditions'),
            is_neutered=data['is_neutered'],
            favorite_activities=data.get('favorite_activities'),
            vaccination_status=data['vaccination_status']
        )

        db.session.add(dog)
        db.session.commit()

        return jsonify({"message": "Dog added", "dog_id": dog.id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@dogs_bp.route('/<int:user_id>', methods=['GET'])
def get_dogs_by_user(user_id):
    dogs = Dog.get_all_users_dogs(user_id)

    dog_list = [{
        "id": dog.id,
        "name": dog.name,
        "breed": dog.breed,
        "age": dog.age,
        "weight": dog.weight,
        "size": dog.size,
        "temperament": dog.temperament,
        "health_conditions": dog.health_conditions,
        "is_neutered": dog.is_neutered,
        "favorite_activities": dog.favorite_activities,
        "vaccination_status": dog.vaccination_status
    } for dog in dogs]

    return jsonify(dog_list), 200

