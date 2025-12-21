export type CreateUser = {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
};

export const createUserAPI = async (user: CreateUser) => {
  const response = await fetch("http://localhost:5000/api/users/create", {
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
