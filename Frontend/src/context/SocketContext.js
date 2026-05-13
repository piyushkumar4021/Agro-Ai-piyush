import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      socket.emit('register', user._id || user.id);
    });

    socket.on('notification', (data) => {
      console.log('🔔 Real-time notification:', data);
      setNotifications(prev => [{ ...data, id: Date.now(), read: false, time: new Date() }, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);

      // Browser notification (if permitted)
      if (Notification.permission === 'granted') {
        new Notification(data.title || 'AgroAI', { body: data.message, icon: '🌾' });
      }
    });

    socketRef.current = socket;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => { socket.disconnect(); };
  }, [user]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{ notifications, unreadCount, markAllRead, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}
