import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

type CommentItem = {
  _id: string;
  isRead?: boolean;
};

type CommentsContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
  removeUnreadIfNeeded: (wasUnread: boolean) => void;
};

const CommentsContext = createContext<CommentsContextValue | undefined>(undefined);

export const CommentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await api.get<CommentItem[]>('/comments/my');
      const unread = Array.isArray(res.data)
        ? res.data.filter((comment) => !comment.isRead).length
        : 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur récupération commentaires :', error);
    }
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const removeUnreadIfNeeded = useCallback((wasUnread: boolean) => {
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const value = useMemo(
    () => ({ unreadCount, refreshUnreadCount, decrementUnreadCount, removeUnreadIfNeeded }),
    [unreadCount, refreshUnreadCount, decrementUnreadCount, removeUnreadIfNeeded]
  );

  return <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>;
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};
