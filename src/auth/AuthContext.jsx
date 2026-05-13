import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("olh_user");
    const storedToken = localStorage.getItem("olh_token");
    if (storedUser && storedUser !== "undefined" && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (err) {
        console.error("Error parsing stored user data:", err);
        localStorage.removeItem("olh_user");
        localStorage.removeItem("olh_token");
      }
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setUser(data);
      setToken(data.token);
      localStorage.setItem("olh_user", JSON.stringify(data));
      localStorage.setItem("olh_token", data.token);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const googleLogin = async (credential, role = null) => {
    try {
      const body = role ? { credential, role } : { credential };
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // If user is new, return isNewUser flag
      if (data.isNewUser) {
        return { success: true, isNewUser: true };
      }
      
      // Existing user or new user with role selected
      const userData = data.user;
      setUser(userData);
      setToken(data.token);
      localStorage.setItem("olh_user", JSON.stringify(userData));
      localStorage.setItem("olh_token", data.token);
      return { success: true, isNewUser: false };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setUser(data);
      setToken(data.token);
      localStorage.setItem("olh_user", JSON.stringify(data));
      localStorage.setItem("olh_token", data.token);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("olh_user");
    localStorage.removeItem("olh_token");
  };

  const value = useMemo(() => ({ user, token, login, register, googleLogin, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
