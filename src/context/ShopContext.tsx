import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification, Sale } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from './AuthContext.tsx';

interface ShopContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  activeReceiptSale: Sale | null;
  setActiveReceiptSale: (sale: Sale | null) => void;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (show: boolean) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { business, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      if (business && !business.onboardingCompleted) {
        setShowOnboardingModal(true);
      }
    }
  }, [isAuthenticated, business?.id]);

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ShopContext.Provider
      value={{
        activeTab,
        setActiveTab,
        notifications,
        unreadCount,
        refreshNotifications: fetchNotifications,
        markNotificationRead,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        activeReceiptSale,
        setActiveReceiptSale,
        showOnboardingModal,
        setShowOnboardingModal,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
