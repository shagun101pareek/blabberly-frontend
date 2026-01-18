export type LoginUser = {
  emailOrUsername: string;
  password: string;
};

export const loginUserAPI = async (user: LoginUser) => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${BASE_URL}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
};

