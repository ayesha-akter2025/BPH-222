import axios from "axios";

// Create a new instance of axios
const api = axios.create({
  baseURL: "http://localhost:1350/api",
});

// This function will allow us to set the token from anywhere in our app
export const setAuthToken = (token) => {
  if (token) {
    // Apply the authorization token to every request if logged in
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    // Delete the auth header if not logged in
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
