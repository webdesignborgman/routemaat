import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

function getClientAuth() {
  if (!auth) {
    throw new Error(
      "Firebase is nog niet geconfigureerd. Controleer je NEXT_PUBLIC_FIREBASE_* variabelen."
    );
  }

  return auth;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  await signInWithPopup(getClientAuth(), provider);
}

export async function signOutUser() {
  await signOut(getClientAuth());
}
