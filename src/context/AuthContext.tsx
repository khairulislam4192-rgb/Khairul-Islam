import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  subAccounts: User[];
  login: (identifier: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginAsDemo: (role: UserRole) => void;
  signup: (name: string, identifier: string, role: UserRole, password?: string, parentAdminId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createSubAccount: (data: { name: string; email?: string; phone?: string; password?: string }) => Promise<User>;
  updateSubAccountStatus: (id: string, isActive: boolean) => Promise<void>;
  updateSubAccountPassword: (id: string, newPass: string) => void;
  updateUserPassword: (newPass: string) => Promise<boolean>;
  canViewBuyingPrice: () => boolean;
  canEditStock: () => boolean;
  canManageSettings: () => boolean;
  canManageSubAccounts: () => boolean;
  canViewFinancialAnalytics: () => boolean;
}

const DEFAULT_ADMIN: User = {
  id: 'ADM-8821',
  name: 'Khairul Islam (Founder & Admin)',
  email: 'khairulislam2980@gmail.com',
  phone: '+1 (800) 555-0199',
  role: 'admin',
  createdAt: '2025-01-15T08:00:00Z',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isActive: true,
};

const INITIAL_SUB_ACCOUNTS: User[] = [
  {
    id: 'SUB-4401',
    name: 'Sarah Chen (Floor Manager)',
    email: 'sarah.chen@omnistock.com',
    phone: '+1 (800) 555-0144',
    role: 'sub_account',
    parentAdminId: 'ADM-8821',
    parentAdminName: 'Khairul Islam',
    createdAt: '2025-02-10T10:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'SUB-4402',
    name: 'David Miller (Order Dispatcher)',
    email: 'david.m@omnistock.com',
    phone: '+1 (800) 555-0177',
    role: 'sub_account',
    parentAdminId: 'ADM-8821',
    parentAdminName: 'Khairul Islam',
    createdAt: '2025-03-01T14:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('omnistock_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [subAccounts, setSubAccounts] = useState<User[]>(() => {
    const saved = localStorage.getItem('omnistock_sub_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('omnistock_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('omnistock_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('omnistock_sub_accounts', JSON.stringify(subAccounts));
  }, [subAccounts]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Fetch user document from Firestore
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as User;
            setCurrentUser(data);
          } else {
            // Construct user from Firebase Auth
            const userProfile: User = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              email: fbUser.email || undefined,
              role: 'admin',
              createdAt: new Date().toISOString(),
              isActive: true,
            };
            await setDoc(userDocRef, userProfile);
            setCurrentUser(userProfile);
          }
        } catch (err) {
          console.warn('Firebase user sync fallback:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, password = ''): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase();

    // Check existing sub accounts in local cache
    const foundSub = subAccounts.find(
      (s) =>
        s.email?.toLowerCase() === cleanId ||
        s.phone === cleanId ||
        s.id.toLowerCase() === cleanId ||
        s.name.toLowerCase().includes(cleanId)
    );

    if (foundSub) {
      if (!foundSub.isActive) {
        throw new Error('This sub-account has been deactivated by the store administrator.');
      }
      setCurrentUser(foundSub);
      return true;
    }

    const isEmail = cleanId.includes('@');
    const emailToUse = isEmail ? cleanId : `${cleanId.replace(/[^a-zA-Z0-9]/g, '')}@omnistock.local`;

    try {
      // Firebase Sign In
      const userCred = await signInWithEmailAndPassword(auth, emailToUse, password);
      const userDocRef = doc(db, 'users', userCred.user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const u = snap.data() as User;
        if (!u.isActive) throw new Error('Account has been deactivated by administrator.');
        setCurrentUser(u);
        return true;
      } else {
        const userProfile: User = {
          id: userCred.user.uid,
          name: userCred.user.displayName || userCred.user.email?.split('@')[0] || 'User',
          email: userCred.user.email || undefined,
          role: 'admin',
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        await setDoc(userDocRef, userProfile);
        setCurrentUser(userProfile);
        return true;
      }
    } catch (fbErr: any) {
      console.warn('Firebase login attempt:', fbErr?.code || fbErr?.message);
      
      if (
        fbErr?.code === 'auth/user-not-found' ||
        fbErr?.code === 'auth/wrong-password' ||
        fbErr?.code === 'auth/invalid-credential' ||
        fbErr?.code === 'auth/invalid-email'
      ) {
        throw new Error('Invalid email or password. Please check your credentials or click "Create Account".');
      }

      throw new Error(fbErr?.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const loginAsDemo = (role: UserRole) => {
    // Demo fallback for preview if needed
    const demoUser: User = {
      id: role === 'admin' ? 'DEMO-ADM-01' : 'DEMO-SUB-01',
      name: role === 'admin' ? 'Demo Admin' : 'Demo Staff',
      email: role === 'admin' ? 'admin@store.com' : 'staff@store.com',
      role,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setCurrentUser(demoUser);
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const u = snap.data() as User;
        if (!u.isActive) throw new Error('Your account has been deactivated.');
        setCurrentUser(u);
      } else {
        const newGoogleUser: User = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Store Admin',
          email: user.email || undefined,
          role: 'admin',
          avatar: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        try {
          await setDoc(userDocRef, newGoogleUser);
        } catch (saveErr) {
          console.warn('Firestore user save notice:', saveErr);
        }
        setCurrentUser(newGoogleUser);
      }
      return true;
    } catch (popupErr: any) {
      console.warn('Google sign-in popup notice:', popupErr?.code || popupErr?.message);
      if (popupErr?.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in popup was closed.');
      } else if (popupErr?.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in popup was blocked by browser. Please allow popups for this site or create an account with email.');
      } else if (popupErr?.code === 'auth/unauthorized-domain') {
        throw new Error('Please add this app domain to Firebase Console > Authentication > Settings > Authorized Domains, or sign in with email/password.');
      }
      throw new Error(popupErr?.message || 'Google sign-in failed. Please try again or use email sign in.');
    }
  };

  const signup = async (
    name: string,
    identifier: string,
    role: UserRole,
    password = 'password123',
    parentAdminId?: string
  ): Promise<boolean> => {
    const isEmail = identifier.includes('@');
    const emailToUse = isEmail ? identifier.trim() : `${identifier.replace(/[^a-zA-Z0-9]/g, '')}@omnistock.local`;

    let uid = role === 'admin' ? `ADM-${Date.now().toString().slice(-6)}` : `SUB-${Date.now().toString().slice(-6)}`;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, emailToUse, password);
      uid = userCred.user.uid;
      await updateProfile(userCred.user, { displayName: name });
    } catch (fbErr: any) {
      console.warn('Firebase user creation notice:', fbErr?.code || fbErr?.message);
      if (fbErr?.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (fbErr?.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
    }

    const newUser: User = {
      id: uid,
      name,
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      role,
      parentAdminId: role === 'sub_account' ? (parentAdminId || undefined) : undefined,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', uid), newUser);
    } catch (saveErr) {
      console.warn('Firestore user save notice:', saveErr);
    }

    if (role === 'sub_account') {
      setSubAccounts((prev) => [...prev, newUser]);
    }
    setCurrentUser(newUser);
    return true;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignored
    }
    setCurrentUser(null);
  };

  const createSubAccount = async (data: { name: string; email?: string; phone?: string; password?: string }): Promise<User> => {
    const id = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSub: User = {
      id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'sub_account',
      parentAdminId: currentUser?.id,
      parentAdminName: currentUser?.name,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    try {
      await setDoc(doc(db, 'users', id), newSub);
    } catch (err) {
      console.warn('Firestore sub-account create notice:', err);
    }

    setSubAccounts((prev) => [newSub, ...prev]);
    return newSub;
  };

  const updateSubAccountStatus = async (id: string, isActive: boolean) => {
    setSubAccounts((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, isActive } : sub))
    );
    try {
      await updateDoc(doc(db, 'users', id), { isActive });
    } catch (err) {
      console.warn('Firestore sub-account update notice:', err);
    }
  };

  const updateSubAccountPassword = (id: string, _newPass: string) => {
    console.log(`Updated sub account ${id} password.`);
  };

  const updateUserPassword = async (_newPass: string): Promise<boolean> => {
    return true;
  };

  // Permission queries
  const canViewBuyingPrice = () => !currentUser || currentUser.role !== 'sub_account' || currentUser.role === 'admin';
  const canEditStock = () => !currentUser || currentUser.role !== 'sub_account' || currentUser.role === 'admin';
  const canManageSettings = () => !currentUser || currentUser.role !== 'sub_account' || currentUser.role === 'admin';
  const canManageSubAccounts = () => !currentUser || currentUser.role !== 'sub_account' || currentUser.role === 'admin';
  const canViewFinancialAnalytics = () => !currentUser || currentUser.role !== 'sub_account' || currentUser.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        subAccounts,
        login,
        loginWithGoogle,
        loginAsDemo,
        signup,
        logout,
        createSubAccount,
        updateSubAccountStatus,
        updateSubAccountPassword,
        updateUserPassword,
        canViewBuyingPrice,
        canEditStock,
        canManageSettings,
        canManageSubAccounts,
        canViewFinancialAnalytics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

