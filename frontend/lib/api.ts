const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  return response.json();
}

export function loginWithGoogle() {
  window.location.href = `${API_URL}/api/auth/google`;
}

export async function getUsers() {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "GET",
    credentials: "include",
  });

  return response.json();
}

export async function createTask(taskData: {
  title: string;
  description: string;
  assigned_to: number;
  due_date: string;
}) {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(taskData),
  });

  return response.json();
}

export async function completeTask(taskId: number) {
  const response = await fetch(
    `${API_URL}/api/tasks/${taskId}/complete`,
    {
      method: "PUT",
      credentials: "include",
    }
  );

  return response.json();
}

export async function logout() {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  return response.json();
}