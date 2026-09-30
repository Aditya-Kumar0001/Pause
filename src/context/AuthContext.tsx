import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { UserProfile, UserRole } from '../types';
import { auth } from '../firebase/auth';
import { authService } from '../services/authService';
import { AuthResult, customerAuthService } from '../services/customerAuthService';

interface AuthContextType {
  currentUser: UserProfile;
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  currentRole: UserRole;
  isAdmin: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (name: string, phone: string, email: string, password: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Guest',
  email: '',
  role: 'customer',
  createdAt: ''
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_PROFILE);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        let adminProfile: UserProfile | null = null;
        try {
          adminProfile = await authService.isAuthorizedAdmin(user.uid);
        } catch {
          adminProfile = null;
        }
        setIsAdmin(Boolean(adminProfile));
        setCurrentUser({
          ...(adminProfile || {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Pause Guest',
            email: user.email || '',
            phone: user.phoneNumber || undefined,
            role: 'customer' as const,
            avatarUrl: user.photoURL || undefined,
            createdAt: user.metadata.creationTime || new Date().toISOString()
          })
        });
      } else {
        setIsAdmin(false);
        setCurrentUser(GUEST_PROFILE);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAsAdmin = async (email: string, password: string) => {
    const result = await authService.loginAsAdmin(email, password);
    const user = auth.currentUser;

    // The dashboard can mount before onAuthStateChanged finishes after sign-in.
    // Update the context immediately so its admin guard does not redirect back
    // to the login page during that gap.
    if (result.success && user) {
      setFirebaseUser(user);
      setIsAdmin(true);
      setCurrentUser({
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Cafe Staff',
        email: user.email || '',
        phone: user.phoneNumber || undefined,
        role: 'admin',
        avatarUrl: user.photoURL || undefined,
        createdAt: user.metadata.creationTime || new Date().toISOString()
      });
    }

    return result;
  };

  const logoutAdmin = () => authService.logoutAdmin();

  const signOut = () => customerAuthService.signOut();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        authLoading,
        currentRole: isAdmin ? 'admin' : 'customer',
        isAdmin,
        loginAsAdmin,
        logoutAdmin,
        signInWithGoogle: customerAuthService.signInWithGoogle,
        signInWithEmail: customerAuthService.signInWithEmail,
        signUpWithEmail: customerAuthService.signUpWithEmail,
        sendPasswordReset: customerAuthService.sendPasswordReset,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
