import { LoginUser } from "../constants/loginUser";

export const loginUserAPI = async (user: LoginUser) => {
  const response = await fetch("http://localhost:5000/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return response.json();
};