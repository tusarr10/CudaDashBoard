
// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_CENTRAL_API_URL,
});

let logoutHandler = () => {
  console.error("Logout handler not set");
};

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

api.interceptors.request.use(config => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      logoutHandler();
    }
    return Promise.reject(error);
  }
);

export default api;
