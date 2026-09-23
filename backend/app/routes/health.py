from flask import Blueprint, jsonify

from app.supabase_client import supabase


health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health", methods=["GET"])
def health_check():
    try:
        response = supabase.table("users").select("id").limit(1).execute()

        return jsonify({
            "status": "success",
            "message": "Task Management API is running",
            "database": "connected"
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": "Database connection failed",
            "error": str(error)
        }), 500