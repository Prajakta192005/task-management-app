from flask import Blueprint, jsonify, session

from app.supabase_client import supabase


users_bp = Blueprint("users", __name__)


@users_bp.route("/api/users", methods=["GET"])
def get_users():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "Please login first",
        }), 401

    try:
        response = (
            supabase
            .table("users")
            .select(
                "id,name,email,profile_picture"
            )
            .neq("id", user_id)
            .order("name")
            .execute()
        )

        return jsonify({
            "status": "success",
            "users": response.data,
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": "Unable to retrieve users",
            "error": str(error),
        }), 500