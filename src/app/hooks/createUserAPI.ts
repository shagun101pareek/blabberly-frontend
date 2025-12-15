import { CreateUser } from "../constants/createUser";

export const createUserAPI = async (user: CreateUser) => {
  const response = await fetch("http://localhost:5000/api/users/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return response.json();
};