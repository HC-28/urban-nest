import axios from "axios";

// Base API URL
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8085/api";

// User API
export const userApi = axios.create({
  baseURL: `${BASE_URL}/users`,
  withCredentials: true,
});

// Property API
export const propertyApi = axios.create({
  baseURL: `${BASE_URL}/properties`,
  timeout: 10000,
});

// Chat API
export const chatApi = axios.create({
  baseURL: `${BASE_URL}/chat`,
  withCredentials: true,
});

// ✅ DEFAULT EXPORT (VERY IMPORTANT)
const api = axios.create({
  baseURL: `${BASE_URL}/users`,
  withCredentials: true,
});

export default api;
