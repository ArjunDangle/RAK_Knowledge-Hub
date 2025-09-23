// client/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LoginResponse } from '@/lib/api/api-client'; // Make sure this is imported

interface User {
  username: string;
  role: 'MEMBER' | 'ADMIN';
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      try {
        // This is where the error was happening.
        // The check below in the `login` function will prevent "undefined" from ever being stored again.
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to parse auth user from localStorage", error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  const login = (data: LoginResponse) => {
    // This is the critical part that prevents the error
    if (data && data.access_token && data.user) {
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
    } else {
      console.error("Login function received invalid data:", data);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = '/login';
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};