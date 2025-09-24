import { apiClient } from "@/services/apiClient";
import { mockUsers } from "./mockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";

let users = [...mockUsers].map((u) => ({
  ...u,
  last_login: new Date(
    Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7
  ).toISOString(),
  last_ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
  role_color:
    u.role === "SuperAdmin"
      ? "destructive"
      : u.role === "Operator"
      ? "info"
      : "secondary",
}));

const mockGetUsers = async () => {
  console.log("--- MOCK GET USERS ---");
  return new Promise((resolve) => setTimeout(() => resolve(users), 500));
};

const mockUpdateUser = async (id, data) => {
  console.log("--- MOCK UPDATE USER ---", id, data);
  return new Promise((resolve) => {
    setTimeout(() => {
      users = users.map((u) => (u.id === id ? { ...u, ...data } : u));
      resolve(users.find((u) => u.id === id));
    }, 300);
  });
};

const mockCreateUser = async (data) => {
  console.log("--- MOCK CREATE USER ---", data);
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      const newUser = {
        ...data,
        id: `usr_${Date.now()}`,
        last_login: now,
        last_ip: `127.0.0.1`,
        created_at: now,
        role_color:
          data.role === "SuperAdmin"
            ? "destructive"
            : data.role === "Operator"
            ? "info"
            : "secondary",
      };
      users = [newUser, ...users];
      resolve(newUser);
    }, 300);
  });
};

const mockDeleteUser = async (id) => {
  console.log("--- MOCK DELETE USER ---", id);
  return new Promise((resolve) => {
    setTimeout(() => {
      users = users.filter((u) => u.id !== id);
      resolve({ success: true });
    }, 300);
  });
};

const realGetUsers = async () => {
  return apiClient.get("/admin/users");
};

const realUpdateUser = async (id, data) => {
  return apiClient.patch(`/admin/users/${id}`, data);
};

const realCreateUser = async (data) => {
  return apiClient.post("/admin/users", data);
};

const realDeleteUser = async (id) => {
  return apiClient.delete(`/admin/users/${id}`);
};

export const userService = {
  getUsers: USE_MOCK ? mockGetUsers : realGetUsers,
  updateUser: USE_MOCK ? mockUpdateUser : realUpdateUser,
  createUser: USE_MOCK ? mockCreateUser : realCreateUser,
  deleteUser: USE_MOCK ? mockDeleteUser : realDeleteUser,
};
