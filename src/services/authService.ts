import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { auth } from '../firebase/auth';
import { db } from '../firebase/firestore';

const requireFirebaseServices = () => {
  if (!auth || !db) throw new Error('Firebase Authentication and Firestore must be configured.');
  return { auth, db };
};

export const authService = {
  async isAuthorizedAdmin(uid: string): Promise<UserProfile | null> {
    if (!db || !auth?.currentUser || auth.currentUser.uid !== uid) return null;
    const snapshot = await getDoc(doc(db, 'admins', uid));
    const admin = snapshot.data();
    if (!snapshot.exists() || admin?.active !== true) return null;
    return {
      id: uid,
      name: typeof admin.displayName === 'string' ? admin.displayName : auth.currentUser.displayName || 'Café Staff',
      email: auth.currentUser.email || '',
      role: 'admin',
      createdAt: auth.currentUser.metadata.creationTime || new Date().toISOString()
    };
  },

  async loginAsAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { auth } = requireFirebaseServices();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const admin = await this.isAuthorizedAdmin(credential.user.uid);
      if (!admin) {
        await signOut(auth);
        return { success: false, error: 'This Firebase account is not an authorized café admin.' };
      }
      return { success: true };
    } catch (error) {
      const code = (error as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/invalid-email': 'Enter a valid admin email address.',
        'auth/user-disabled': 'This admin account is disabled.',
        'auth/too-many-requests': 'Too many sign-in attempts. Try again later.'
      };
      return { success: false, error: messages[code || ''] || 'Admin sign-in failed. Check Firebase configuration and try again.' };
    }
  },

  async logoutAdmin(): Promise<void> {
    if (auth) await signOut(auth);
  }
};
