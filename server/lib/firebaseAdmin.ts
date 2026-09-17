import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const serviceAccountPath = path.resolve(
  __dirname,
  "../../firebase-service-account.json",
);

function readServiceAccountFromEnv(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as admin.ServiceAccount;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is set but contains invalid JSON",
    );
  }
}

function readServiceAccountFromFile(): admin.ServiceAccount | null {
  if (!fs.existsSync(serviceAccountPath)) return null;

  try {
    return JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8"),
    ) as admin.ServiceAccount;
  } catch {
    throw new Error(
      `Firebase service account file at ${serviceAccountPath} contains invalid JSON`,
    );
  }
}

function readServiceAccount(): admin.ServiceAccount {
  const fromEnv = readServiceAccountFromEnv();
  if (fromEnv) return fromEnv;

  const fromFile = readServiceAccountFromFile();
  if (fromFile) return fromFile;

  throw new Error(
    "Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or provide firebase-service-account.json in the backend directory.",
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(readServiceAccount()),
  });
}

export { admin };
