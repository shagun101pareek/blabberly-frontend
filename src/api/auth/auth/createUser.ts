export type CreateUser = {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
};

export const createUserAPI = async (user: CreateUser) => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${BASE_URL}/api/users/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error("User registration failed");
  }

  return response.json();
};
