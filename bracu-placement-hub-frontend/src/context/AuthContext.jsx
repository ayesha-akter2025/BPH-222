import React, { createContext, useState } from "react";
import { setAuthToken } from "../api/axiosConfig";

// 1. Create the context
export const AuthContext = createContext();

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const loginAction = (data) => {
    setToken(data.token);
    setUser(data.user);
    setAuthToken(data.token);
    // In a real app, you would also save the token to localStorage here
  };

  const logOut = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    // And remove from localStorage
  };

  return (
    <AuthContext.Provider value={{ token, user, loginAction, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
