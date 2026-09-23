from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, session

from app.email_service import send_email
from app.supabase_client import supabase


tasks_bp = Blueprint("tasks", __name__)


def get_logged_in_user_id():
    return session.get("user_id")


@tasks_bp.route("/api/tasks", methods=["POST"])
def create_task():
    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "Please login first",
        }), 401

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body is required",
        }), 400

    title = data.get("title")
    description = data.get("description")
    assigned_to = data.get("assigned_to")
    due_date = data.get("due_date")

    # Validate title
    if not isinstance(title, str) or not title.strip():
        return jsonify({
            "status": "error",
            "message": "Task title is required",
        }), 400

    if len(title.strip()) > 200:
        return jsonify({
            "status": "error",
            "message": "Task title must be 200 characters or less",
        }), 400

    # Validate assigned user
    if not assigned_to:
        return jsonify({
            "status": "error",
            "message": "assigned_to is required",
        }), 400

    try:
        assigned_to = int(assigned_to)
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "assigned_to must be a valid user ID",
        }), 400

    # Prevent assigning task to yourself
    if assigned_to == user_id:
        return jsonify({
            "status": "error",
            "message": "You cannot assign a task to yourself",
        }), 400

    try:
        # Check assigned user exists
        assigned_user_response = (
            supabase
            .table("users")
            .select("id,name,email")
            .eq("id", assigned_to)
            .execute()
        )

        if not assigned_user_response.data:
            return jsonify({
                "status": "error",
                "message": "Assigned user does not exist",
            }), 404

        assigned_user = assigned_user_response.data[0]

        # Get creator information
        creator_response = (
            supabase
            .table("users")
            .select("id,name,email")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not creator_response.data:
            return jsonify({
                "status": "error",
                "message": "Creator user not found",
            }), 404

        creator = creator_response.data

        # Prepare task data
        task_data = {
            "title": title.strip(),
            "description": (
                description.strip()
                if isinstance(description, str)
                else None
            ),
            "created_by": user_id,
            "assigned_to": assigned_to,
        }

        if due_date:
            task_data["due_date"] = due_date

        # Create task in Supabase
        response = (
            supabase
            .table("tasks")
            .insert(task_data)
            .execute()
        )

        if not response.data:
            return jsonify({
                "status": "error",
                "message": "Unable to create task",
            }), 500

        task = response.data[0]

        # Send email notification to assigned user
        try:
            email_body = f"""
Hello {assigned_user["name"]},

You have been assigned a new task in TaskFlow.

Task: {task["title"]}

Description:
{task["description"] or "No description provided"}

Created by:
{creator["name"]}

Please log in to TaskFlow to view and complete the task.

Regards,
TaskFlow
"""

            send_email(
                assigned_user["email"],
                "New Task Assigned - TaskFlow",
                email_body
            )

        except Exception as email_error:
            # Task should still be created even if email fails
            print(
                "Task created, but email failed:",
                email_error
            )

        return jsonify({
            "status": "success",
            "message": "Task created successfully",
            "task": task,
        }), 201

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": "Unable to create task",
            "error": str(error),
        }), 500


@tasks_bp.route("/api/tasks", methods=["GET"])
def get_tasks():
    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "Please login first",
        }), 401

    try:
        response = (
            supabase
            .table("tasks")
            .select("*")
            .or_(
                f"created_by.eq.{user_id},"
                f"assigned_to.eq.{user_id}"
            )
            .order("created_at", desc=True)
            .execute()
        )

        return jsonify({
            "status": "success",
            "tasks": response.data,
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": "Unable to retrieve tasks",
            "error": str(error),
        }), 500


@tasks_bp.route(
    "/api/tasks/<int:task_id>",
    methods=["GET"]
)
def get_task(task_id):
    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "Please login first",
        }), 401

    try:
        response = (
            supabase
            .table("tasks")
            .select("*")
            .eq("id", task_id)
            .or_(
                f"created_by.eq.{user_id},"
                f"assigned_to.eq.{user_id}"
            )
            .single()
            .execute()
        )

        if not response.data:
            return jsonify({
                "status": "error",
                "message": "Task not found",
            }), 404

        return jsonify({
            "status": "success",
            "task": response.data,
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": "Unable to retrieve task",
            "error": str(error),
        }), 500


@tasks_bp.route(
    "/api/tasks/<int:task_id>/complete",
    methods=["PUT"]
)
def complete_task(task_id):
    user_id = get_logged_in_user_id()

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "Please login first",
        }), 401

    try:
        # Get task
        task_response = (
            supabase
            .table("tasks")
            .select("*")
            .eq("id", task_id)
            .single()
            .execute()
        )

        if not task_response.data:
            return jsonify({
                "status": "error",
                "message": "Task not found",
            }), 404

        task = task_response.data

        # Only assigned user can complete the task
        if task["assigned_to"] != user_id:
            return jsonify({
                "status": "error",
                "message": (
                    "You are not authorized "
                    "to complete this task"
                ),
            }), 403

        # Prevent completing an already completed task
        if task["status"] == "completed":
            return jsonify({
                "status": "error",
                "message": "Task is already completed",
            }), 400

        completed_at = datetime.now(
            timezone.utc
        ).isoformat()

        # Update task
        response = (
            supabase
            .table("tasks")
            .update({
                "status": "completed",
                "completed_at": completed_at,
            })
            .eq("id", task_id)
            .execute()
        )

        if not response.data:
            return jsonify({
                "status": "error",
                "message": "Unable to complete task",
            }), 500

        completed_task = response.data[0]

        # Get creator information
        creator_response = (
            supabase
            .table("users")
            .select("name,email")
            .eq("id", task["created_by"])
            .single()
            .execute()
        )

        if not creator_response.data:
            return jsonify({
                "status": "error",
                "message": "Task creator not found",
            }), 404

        creator = creator_response.data

        # Get assignee information
        assignee_response = (
            supabase
            .table("users")
            .select("name,email")
            .eq("id", task["assigned_to"])
            .single()
            .execute()
        )

        if not assignee_response.data:
            return jsonify({
                "status": "error",
                "message": "Assigned user not found",
            }), 404

        assignee = assignee_response.data

        # Send completion email to creator
        try:
            email_body = f"""
Hello {creator["name"]},

Your task has been completed in TaskFlow.

Task:
{task["title"]}

Completed by:
{assignee["name"]}

Completed at:
{completed_at}

Regards,
TaskFlow
"""

            send_email(
                creator["email"],
                "Task Completed - TaskFlow",
                email_body
            )

        except Exception as email_error:
            # Task should still remain completed if email fails
            print(
                "Task completed, but email failed:",
                email_error
            )

        return jsonify({
            "status": "success",
            "message": "Task completed successfully",
            "task": completed_task,
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": "Unable to complete task",
            "error": str(error),
        }), 500