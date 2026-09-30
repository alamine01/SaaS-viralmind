import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App | undefined;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;
let adminStorage: Storage | null = null;

try {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      try {
        const parsedKey = typeof serviceAccountKey === "string" ? JSON.parse(serviceAccountKey) : serviceAccountKey;
        app = initializeApp({
          credential: cert(parsedKey),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      } catch (e) {
        console.warn("Invalid FIREBASE_SERVICE_ACCOUNT_KEY format, falling back to default init:", e);
      }
    }

    if (!app) {
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "viralmind-8a284",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  } else {
    app = getApps()[0];
  }

  if (app) {
    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
    adminStorage = getStorage(app);
  }
} catch (error) {
  console.warn("Firebase Admin Initialization Warning (Safe fallback to client SDK):", error);
}

export { adminDb, adminAuth, adminStorage };
