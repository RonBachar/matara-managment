import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const serviceAccountPath = path.resolve(
  __dirname,
  "../../firebase-service-account.json",
);

function readServiceAccount(): admin.ServiceAccount {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Missing Firebase service account file at ${serviceAccountPath}`,
    );
  }

  return JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8"),
  ) as admin.ServiceAccount;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(readServiceAccount()),
  });
}

export { admin };
