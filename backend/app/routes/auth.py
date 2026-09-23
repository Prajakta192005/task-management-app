from flask import Blueprint, redirect, session, url_for

from app.oauth import google
from app.supabase_client import supabase


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/google", methods=["GET"])
def google_login():
    redirect_uri = url_for(
        "auth.google_callback",
        _external=True
    )

    return google.authorize_redirect(redirect_uri)


@auth_bp.route("/api/auth/google/callback", methods=["GET"])
def google_callback():
    try:
        token = google.authorize_access_token()

        user_info = token.get("userinfo")

        if not user_info:
            return {
                "status": "error",
                "message": "Could not retrieve Google user information",
            }, 400

        google_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name")
        profile_picture = user_info.get("picture")

        if not google_id or not email:
            return {
                "status": "error",
                "message": "Google account information is incomplete",
            }, 400

        existing_user = (
            supabase
            .table("users")
            .select("*")
            .eq("google_id", google_id)
            .execute()
        )

        if existing_user.data:
            user = existing_user.data[0]

        else:
            new_user = (
                supabase
                .table("users")
                .insert({
                    "google_id": google_id,
                    "name": name or email.split("@")[0],
                    "email": email,
                    "profile_picture": profile_picture,
                })
                .execute()
            )

            if not new_user.data:
                return {
                    "status": "error",
                    "message": "Unable to create user",
                }, 500

            user = new_user.data[0]

        session.clear()

        session["user_id"] = user["id"]

        return redirect("http://localhost:3000")

    except Exception as error:
        return {
            "status": "error",
            "message": "Google authentication failed",
            "error": str(error),
        }, 500


@auth_bp.route("/api/auth/me", methods=["GET"])
def get_current_user():
    user_id = session.get("user_id")

    if not user_id:
        return {
            "status": "error",
            "message": "Not logged in",
        }, 401

    try:
        response = (
            supabase
            .table("users")
            .select(
                "id,name,email,profile_picture,created_at"
            )
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not response.data:
            session.clear()

            return {
                "status": "error",
                "message": "User not found",
            }, 404

        return {
            "status": "success",
            "user": response.data,
        }, 200

    except Exception as error:
        return {
            "status": "error",
            "message": "Unable to retrieve user",
            "error": str(error),
        }, 500


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()

    return {
        "status": "success",
        "message": "Logged out successfully",
    }, 200