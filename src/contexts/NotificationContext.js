import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full animate-slide-in">
          <div className={`p-4 rounded-2xl elegant-shadow flex items-start justify-between gap-4 border text-sm font-semibold backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-green-50/95 border-green-200 text-green-800' 
              : notification.type === 'error'
              ? 'bg-red-50/95 border-red-200 text-red-800'
              : 'bg-yellow-50/95 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-start gap-2.5">
              <span className="text-base select-none mt-0.5">
                {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : '⚠️'}
              </span>
              <p className="whitespace-pre-line leading-relaxed">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none p-1 flex items-center justify-center rounded-full hover:bg-gray-100/30 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
