import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserFile } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { compressImageToBase64, readFileAsDataUrl } from '../utils/imageUtils';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

interface UserStorageContextType {
  files: UserFile[];
  isLoading: boolean;
  uploadFile: (file: File, category?: UserFile['category'], notes?: string, tags?: string[]) => Promise<UserFile>;
  deleteFile: (fileId: string) => Promise<boolean>;
  getFileById: (fileId: string) => UserFile | undefined;
  storageStats: {
    totalFiles: number;
    totalSizeBytes: number;
    formattedSize: string;
    categoryBreakdown: Record<string, number>;
  };
}

const UserStorageContext = createContext<UserStorageContextType | undefined>(undefined);

export const UserStorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<UserFile[]>(() => {
    const saved = localStorage.getItem(`omnistock_files_${currentUser?.id || 'guest'}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync / Listen to Firestore user files in real time
  useEffect(() => {
    if (!currentUser) {
      setFiles([]);
      return;
    }

    const currentUserId = currentUser.id;
    const localKey = `omnistock_files_${currentUserId}`;
    
    // Load local storage initial cache
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch {
        // ignore
      }
    } else {
      setFiles([]);
    }

    // Connect to Firestore collection query
    try {
      const q = query(
        collection(db, 'userFiles'),
        where('userId', '==', currentUserId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteFiles: UserFile[] = [];
            snapshot.forEach((docSnap) => {
              remoteFiles.push(docSnap.data() as UserFile);
            });
            // Sort by createdAt descending
            remoteFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setFiles(remoteFiles);
            localStorage.setItem(localKey, JSON.stringify(remoteFiles));
          } else {
            setFiles([]);
            localStorage.setItem(localKey, JSON.stringify([]));
          }
        },
        (err) => {
          console.warn('Firestore user files sync notice (offline mode active):', err);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('User storage init fallback:', e);
    }
  }, [currentUser]);

  // Persist local storage whenever files change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`omnistock_files_${currentUser.id}`, JSON.stringify(files));
    }
  }, [files, currentUser]);

  const uploadFile = async (
    file: File,
    category: UserFile['category'] = 'document',
    notes = '',
    tags: string[] = []
  ): Promise<UserFile> => {
    if (!currentUser) throw new Error('You must be signed in to upload files.');

    setIsLoading(true);

    try {
      let dataUrl = '';
      if (file.type.startsWith('image/')) {
        // Compress images to lightweight Base64 data URL
        dataUrl = await compressImageToBase64(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          format: 'image/jpeg',
        });
      } else {
        // Generic file data URL
        dataUrl = await readFileAsDataUrl(file);
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newFile: UserFile = {
        id: fileId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileSize: Math.round(dataUrl.length * 0.75), // approximate decoded size
        fileType: file.type || 'application/octet-stream',
        category,
        downloadUrl: dataUrl,
        createdAt: new Date().toISOString(),
        notes,
        tags: tags.length > 0 ? tags : [category],
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'userFiles', fileId), newFile);
      } catch (err) {
        console.warn('Firestore cloud save notice, stored securely locally:', err);
      }

      setFiles((prev) => [newFile, ...prev]);
      return newFile;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    if (!currentUser) throw new Error('You must be signed in to delete files.');

    // Security check: ensure file belongs to current user
    const target = files.find((f) => f.id === fileId);
    if (target && target.userId !== currentUser.id) {
      throw new Error('Permission denied: You can only delete your own files.');
    }

    try {
      await deleteDoc(doc(db, 'userFiles', fileId));
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    return true;
  };

  const getFileById = (fileId: string) => files.find((f) => f.id === fileId);

  // Computed Storage Analytics
  const storageStats = {
    totalFiles: files.length,
    totalSizeBytes: files.reduce((sum, f) => sum + (f.fileSize || 0), 0),
    get formattedSize() {
      const bytes = this.totalSizeBytes;
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },
    get categoryBreakdown() {
      const breakdown: Record<string, number> = {};
      files.forEach((f) => {
        breakdown[f.category] = (breakdown[f.category] || 0) + 1;
      });
      return breakdown;
    },
  };

  return (
    <UserStorageContext.Provider
      value={{
        files,
        isLoading,
        uploadFile,
        deleteFile,
        getFileById,
        storageStats,
      }}
    >
      {children}
    </UserStorageContext.Provider>
  );
};

export const useUserStorage = () => {
  const context = useContext(UserStorageContext);
  if (!context) {
    throw new Error('useUserStorage must be used within a UserStorageProvider');
  }
  return context;
};
