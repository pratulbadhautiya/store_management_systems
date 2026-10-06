import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Business, UserRole } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoTenant: (tenantKey: 'sharma' | 'green' | 'sharma-cashier' | 'sharma-manager') => Promise<void>;
  hasPerm: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
  updateBusinessState: (updated: Business) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      // Auto sign in to Demo Tenant 1 (Sharma General Store) on first arrival so user immediately enters the active shop OS!
      try {
        const res = await api.switchDemoTenant('sharma');
        setStoredToken(res.token);
        setUser(res.user);
        setBusiness(res.business);
        setPermissions(res.permissions);
      } catch (err) {
        console.error('Failed auto-init demo tenant:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setBusiness(data.business);
      setPermissions(data.permissions);
    } catch (err) {
      console.warn('Session expired, re-initializing default demo tenant:', err);
      removeStoredToken();
      try {
        const res = await api.switchDemoTenant('sharma');
        setStoredToken(res.token);
        setUser(res.user);
        setBusiness(res.business);
        setPermissions(res.permissions);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setUser(res.user);
      setBusiness(res.business);
      setPermissions(res.permissions);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setStoredToken(res.token);
      setUser(res.user);
      setBusiness(res.business);
      setPermissions(res.permissions);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      removeStoredToken();
      setUser(null);
      setBusiness(null);
      setPermissions([]);
    }
  };

  const switchDemoTenant = async (tenantKey: 'sharma' | 'green' | 'sharma-cashier' | 'sharma-manager') => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoTenant(tenantKey);
      setStoredToken(res.token);
      setUser(res.user);
      setBusiness(res.business);
      setPermissions(res.permissions);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPerm = (perm: string): boolean => {
    if (user?.role === 'OWNER') return true;
    return permissions.includes(perm);
  };

  const refreshProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setBusiness(data.business);
      setPermissions(data.permissions);
    } catch (err) {
      console.error(err);
    }
  };

  const updateBusinessState = (updated: Business) => {
    setBusiness(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        permissions,
        isAuthenticated: !!user && !!business,
        isLoading,
        login,
        register,
        logout,
        switchDemoTenant,
        hasPerm,
        refreshProfile,
        updateBusinessState,
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
