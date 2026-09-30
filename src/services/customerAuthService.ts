import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '../firebase/auth';
import { db } from '../firebase/firestore';

export interface AuthResult {
  success: boolean;
  error?: string;
}

const requireFirebaseServices = () => {
  if (!auth || !db) {
    throw new Error('Firebase is not configured. Check the VITE_FIREBASE environment variables.');
  }
  return { auth, db };
};

const readableAuthError = (error: unknown): string => {
  const code = (error as { code?: string })?.code;
  const errorMessage = (error as { message?: string })?.message;

  const messages: Record<string, string> = {
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/popup-blocked': 'Allow pop-ups for this site, then try Google sign-in again.',
    'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Connection problem. Check your internet and try again.',
    'auth/user-disabled': 'This account has been disabled. Contact Pause for help.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/unauthorized-domain': 'This site is not authorized for Firebase sign-in.'
  };

  if (code && messages[code]) return messages[code];
  if (errorMessage?.startsWith('Firebase is not configured.')) return errorMessage;
  return 'We could not complete sign-in. Please try again.';
};

const syncUserProfile = async (user: User): Promise<void> => {
  const { db } = requireFirebaseServices();
  const userReference = doc(db, 'users', user.uid);
  const existingProfile = await getDoc(userReference);
  const provider = user.providerData.find((item) => item.providerId !== 'firebase')?.providerId ?? 'google.com';

  const profile: Record<string, unknown> = {
    uid: user.uid,
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (user.displayName || !existingProfile.exists()) {
    profile.displayName = user.displayName ?? '';
  }
  if (user.email || !existingProfile.exists()) {
    profile.email = user.email ?? '';
  }
  if (user.photoURL || !existingProfile.exists()) {
    profile.photoURL = user.photoURL ?? null;
  }
  if (provider || !existingProfile.exists()) {
    profile.provider = provider;
  }
  if (!existingProfile.exists()) {
    profile.createdAt = serverTimestamp();
    profile.role = 'customer';
    profile.active = true;
  }

  await setDoc(userReference, profile, { merge: true });
};

const finishSignIn = async (user: User): Promise<AuthResult> => {
  try {
    await syncUserProfile(user);
    return { success: true };
  } catch (error) {
    if (auth) await signOut(auth).catch(() => undefined);
    const code = (error as { code?: string })?.code;
    const message = code === 'permission-denied'
      ? 'Your account could not be set up because Firestore rules do not allow saving its profile. Deploy the current firestore.rules and try again.'
      : 'Your account could not be set up because its profile could not be saved. Please try again.';
    return { success: false, error: message };
  }
};

export const customerAuthService = {
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { auth } = requireFirebaseServices();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      return await finishSignIn(result.user);
    } catch (error) {
      return { success: false, error: readableAuthError(error) };
    }
  },

  async signOut(): Promise<AuthResult> {
    try {
      const { auth } = requireFirebaseServices();
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: readableAuthError(error) };
    }
  }
};