import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserData, UserData } from '@/lib/auth';
import { getCurrentFallbackUser } from '@/lib/fallback-auth';
import { onAuthStateChangeDev } from '@/lib/auth-dev';
import { storeService } from '@/lib/firestore';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  isOfflineMode: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  isOfflineMode: false,
  refreshUserData: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const data = await getUserData(currentUser.uid);
        setUserData(data);
      } catch (error) {
        console.warn('⚠️ Failed to refresh user data:', error);
        // Create mock user data for offline mode
        if (isOfflineMode) {
          // تحديث بيانات المستخدم مع البحث عن الأسماء الحقيقية
          let actualFirstName = 'مستخدم';
          let actualLastName = 'تجريبي';
          let actualUserType = 'admin';

          // البحث عن بيانات المستخدم المحفوظة
          const stored = localStorage.getItem('fallback_user');
          if (stored) {
            try {
              const userData = JSON.parse(stored);
              actualUserType = userData.userType || 'admin';
              actualFirstName = userData.firstName || actualFirstName;
              actualLastName = userData.lastName || actualLastName;
            } catch (error) {
              console.error('Error parsing stored user data:', error);
            }
          }

          setUserData({
            uid: currentUser.uid,
            email: currentUser.email || '',
            firstName: actualFirstName,
            lastName: actualLastName,
            userType: actualUserType as 'admin' | 'merchant' | 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          });
        }
      }
    }
  };

  useEffect(() => {
    console.log('🔥 Initializing Firebase Authentication');

    try {
      const unsubscribe = onAuthStateChange(async (user) => {
        setCurrentUser(user);
        setIsOfflineMode(false);

        if (user) {
          try {
            console.log('👤 Loading user data for:', user.email);
            const data = await getUserData(user.uid);

            if (data) {
              setUserData(data);
              console.log('✅ User data loaded:', { email: data.email, userType: data.userType });
            } else {
              console.log('⚠️ No user data found, creating default data');
              // Create default user data if not found
              const defaultUserData = {
                uid: user.uid,
                email: user.email || '',
                firstName: 'مستخدم',
                lastName: 'جديد',
                userType: 'customer' as 'admin' | 'merchant' | 'customer',
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
              };
              setUserData(defaultUserData);
            }
          } catch (error) {
            console.warn('⚠️ Failed to get user data:', error);
            setUserData({
              uid: user.uid,
              email: user.email || '',
              firstName: 'مستخدم',
              lastName: '',
              userType: 'customer',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true
            });
          }
        } else {
          setUserData(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Firebase auth initialization failed:', error);
      setLoading(false);
      setIsOfflineMode(true);
    }
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    isOfflineMode,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
