import { v4 as uuidv4 } from "uuid";

const MOCK_KEYS_KEY = "mockAdminKeys";

const getInitialKeys = () => {
  return [
    {
      id: "1",
      name: "Khóa Production",
      key: "prod_sk_live_[REDACTED_FOR_SECURITY]",
      key_preview: "prod_...c123xyz789",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_used_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: "active",
      permissions: ["full_access"],
    },
    {
      id: "2",
      name: "Khóa Staging (Read-only)",
      key: "stage_sk_test_[REDACTED_FOR_SECURITY]",
      key_preview: "stage_...456uvw123",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      last_used_at: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: "active",
      permissions: ["read:logs", "read:users"],
    },
    {
      id: "3",
      name: "Khóa Dev cũ",
      key: "dev_sk_test_[REDACTED_FOR_SECURITY]",
      key_preview: "dev_...789rst456",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_used_at: null,
      status: "revoked",
      permissions: ["read:logs"],
    },
  ];
};

const getKeysFromStorage = () => {
  try {
    const storedKeys = localStorage.getItem(MOCK_KEYS_KEY);
    if (storedKeys) {
      return JSON.parse(storedKeys);
    }
    const initialKeys = getInitialKeys();
    localStorage.setItem(MOCK_KEYS_KEY, JSON.stringify(initialKeys));
    return initialKeys;
  } catch (error) {
    console.error("Failed to access localStorage:", error);
    return getInitialKeys();
  }
};

const saveKeysToStorage = (keys) => {
  try {
    localStorage.setItem(MOCK_KEYS_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

export const adminKeyService = {
  getAdminKeys: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const keys = getKeysFromStorage();
        resolve(
          keys.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
      }, 1000);
    });
  },

  createAdminKey: ({ name }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const keys = getKeysFromStorage();
        const secret = `bvote_${uuidv4().replace(/-/g, "")}`;
        const newKey = {
          id: uuidv4(),
          name,
          key: secret,
          key_preview: `${secret.substring(0, 10)}...${secret.substring(
            secret.length - 8
          )}`,
          created_at: new Date().toISOString(),
          last_used_at: null,
          status: "active",
          permissions: ["full_access"],
        };
        keys.push(newKey);
        saveKeysToStorage(keys);
        resolve(newKey);
      }, 500);
    });
  },

  revokeAdminKey: (keyId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let keys = getKeysFromStorage();
        const keyIndex = keys.findIndex((k) => k.id === keyId);
        if (keyIndex > -1) {
          keys[keyIndex].status = "revoked";
          saveKeysToStorage(keys);
          resolve({ success: true });
        } else {
          reject(new Error("Key not found"));
        }
      }, 500);
    });
  },
};
