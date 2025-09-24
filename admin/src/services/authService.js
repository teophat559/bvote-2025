import { adminKeyService } from "./adminKeyService";
import { configService } from "./configService";

// Get admin key from configuration
const MASTER_KEY =
  configService.getConfig("auth")?.adminKey || "WEBBVOTE2025$ABC";
const verifyToken = (token) => {
  return new Promise(async (resolve, reject) => {
    if (!token) {
      return reject(new Error("No token provided."));
    }

    if (token === MASTER_KEY) {
      const user = {
        name: "Super Admin",
        email: "admin@bvote.com",
        role: "superadmin",
        permissions: ["super"],
      };
      return resolve(user);
    }

    try {
      const adminKeys = await adminKeyService.getAdminKeys();
      const validKey = adminKeys.find(
        (key) => key.key === token && key.status === "active"
      );
      if (validKey) {
        const user = {
          name: validKey.name,
          email: `${validKey.name
            .replace(/\s+/g, ".")
            .toLowerCase()}@bvote.com`,
          role: "api",
          permissions: validKey.permissions || ["read"],
        };
        return resolve(user);
      }
      reject(new Error("Invalid or expired key."));
    } catch (error) {
      reject(new Error("Error during key verification."));
    }
  });
};

export const authService = {
  login: async (key) => {
    try {
      const user = await verifyToken(key);
      return { token: key, user };
    } catch (error) {
      throw new Error("Khóa truy cập không hợp lệ hoặc đã hết hạn.");
    }
  },

  logout: () => {
    // This is primarily handled client-side by clearing the token
    return Promise.resolve();
  },

  verifyToken: async (token) => {
    try {
      const user = await verifyToken(token);
      return user;
    } catch (error) {
      throw new Error("Phiên làm việc đã hết hạn hoặc không hợp lệ.");
    }
  },
};
