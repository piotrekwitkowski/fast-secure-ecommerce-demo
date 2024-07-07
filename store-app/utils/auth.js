import { verify } from 'jsonwebtoken';
import config from '../aws-backend-config.json';

const SECRET_KEY = config.login_secret_key; // In a real app, use an environment variable

export function isAuthenticated(req) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return false;
  }

  try {
    verify(token, SECRET_KEY);
    return true;
  } catch (error) {
    return false;
  }
}


// Client-side authentication check
export function isLoggedIn() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return !!token;
  }
  return false;
}

// Client-side logout function
export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }
}

// Client-side get the name of the user
export function getUsername() {
  if (typeof window !== 'undefined') {
     ;
    return localStorage.getItem('username') || 'Unknown';
  }
  return 'Unknown';
}