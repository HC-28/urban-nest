import axios from "axios";

const BASE_URL = "http://localhost:8082/api";

// User API
export const userApi = axios.create({
  baseURL: `${BASE_URL}/users`,
});

// Property API
export const propertyApi = axios.create({
  baseURL: `${BASE_URL}/properties`,
});

// Default export for backward compatibility
export default axios.create({
  baseURL: `${BASE_URL}/users`,
});


