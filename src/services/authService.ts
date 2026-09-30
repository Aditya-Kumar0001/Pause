import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { auth } from '../firebase/auth';
import { db } from '../firebase/firestore';

const requireFirebaseServices = () => {
  if (!auth || !db) throw new Error('Firebase Authentication and Firestore must be configured.');
  return { auth, db };
};

export const authService = {
  async isAuthorizedAdmin(email: string | null | undefined): Promise<UserProfile | null> {
    if (!db || !auth?.currentUser || !email) return null;
    const snapshot = await getDoc(doc(db, 'admin_emails', email.toLowerCase()));
    const admin = snapshot.data();
    if (!snapshot.exists() || admin?.active !== true) return null;
    return {
      id: auth.currentUser.uid,
      name: typeof admin?.displayName === 'string' ? admin.displayName : auth.currentUser.displayName || 'Café Staff',
      email: auth.currentUser.email || '',
      role: 'admin',
      createdAt: auth.currentUser.metadata.creationTime || new Date().toISOString()
    };
  },

  async loginAsAdmin(): Promise<{ success: boolean; error?: string }> {
    try {
      const { auth } = requireFirebaseServices();
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const admin = await this.isAuthorizedAdmin(credential.user.email);
      if (!admin) {
        await signOut(auth);
        return { success: false, error: 'This Google account is not an authorized café admin.' };
      }
      return { success: true };
    } catch (error) {
      const code = (error as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Sign-in was closed before it finished.',
        'auth/popup-blocked': 'Allow pop-ups for this site, then try again.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/network-request-failed': 'Connection problem. Check your internet and try again.',
        'auth/user-disabled': 'This admin account is disabled.',
        'auth/too-many-requests': 'Too many sign-in attempts. Try again later.',
        'auth/unauthorized-domain': 'This site is not authorized for Firebase sign-in.'
      };
      return { success: false, error: messages[code || ''] || 'Admin sign-in failed. Check Firebase configuration and try again.' };
    }
  },

  async logoutAdmin(): Promise<void> {
    if (auth) await signOut(auth);
  }
};
