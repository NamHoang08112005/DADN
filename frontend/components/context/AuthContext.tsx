'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import User from '@/models/User';

// Auth context type definition
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, password: string, email: string, dateOfBirth: Date) => Promise<void>;
  logout: () => Promise<void>;
}

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for user data in localStorage first, then sessionStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        console.log('Checking auth status, stored user:', storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('User authenticated from storage:', userData);
        }
      } catch (error) {
        // If user data is invalid, clear it
        console.error('Error checking auth status:', error);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function - connect to backend API
  const login = async (username: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login/authentication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.message !== "Login successful") {
        throw new Error(data.message || 'Authentication failed');
      }
      
      // Convert backend user model to frontend model
      const userData: User = {
        ...data.user,
        id: data.user.User_Id?.toString(),
        name: data.user.Name,
        role: 'user', // Default role
      };

      // Save user data to localStorage if rememberMe is true, otherwise to sessionStorage
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Saved user data to localStorage:', userData);
      } else {
        sessionStorage.setItem('user', JSON.stringify(userData));
        console.log('Saved user data to sessionStorage:', userData);
      }
      
      setUser(userData);
      console.log('User logged in:', userData);
    } catch (error) {
      // console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - connect to backend API
  const register = async (username: string, password: string, email: string, dateOfBirth: Date) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          date_of_birth: dateOfBirth.toISOString(),
          SSN: "000000000" // Giá trị mặc định vì backend yêu cầu
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Không cần chuyển hướng ở đây, để RegisterForm xử lý
      console.log('Registration successful');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function 
  const logout = async () => {
    console.log('Logout function called');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/about');
  };
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;