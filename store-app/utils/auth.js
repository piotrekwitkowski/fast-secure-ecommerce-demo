import { verify } from 'jsonwebtoken';
import config from '../aws-backend-config.json';
import Cookies from 'js-cookie';  // replace with https://nextjs.org/docs/app/api-reference/functions/cookies 
import {deleteCartItems} from './cart'

const SECRET_KEY = config.login_secret_key; // In a real app, use an environment variable

export function isAuthenticated(req) {
  const list = {};
  const cookieHeader = req.headers?.cookie

  if (!cookieHeader) return false;

  cookieHeader.split(`;`).forEach(function(cookie) {
    let [ name, ...rest] = cookie.split(`=`);
    name = name?.trim();
    if (!name) return;
    const value = rest.join(`=`).trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });

  const token = list.token;
  console.log(token);

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
    const token =  Cookies.get("token"); 
    return !!token;
  }
  return false;
}

// Client-side logout function
export function logout() {
  if (typeof window !== 'undefined') {
    Cookies.remove("token");
    localStorage.removeItem('username');
    deleteCartItems();
  }
}

// Client-side login function
export function login(username, token) {

    localStorage.setItem('username', username);
    Cookies.set('token', token);

}

// Client-side get the name of the user
export function getUsername() {
  if (typeof window !== 'undefined') {
     ;
    return localStorage.getItem('username') || '';
  }
  return '';
}

// Client-side get the token value
export function getToken() {
  if (typeof window !== 'undefined') {
    return Cookies.get("token"); 
  }
  return "";
}