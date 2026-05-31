import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: { label: string; onClick: () => void };
}

interface NotificationContextType {
  notify: (n: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

let nextId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((n: Omit<Notification, 'id'>) => {
    const id = nextId++;
    setNotifications(prev => [...prev, { ...n, id }]);
    if (!n.action) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(x => x.id !== id));
      }, 6000);
    }
  }, []);

  const dismiss = (id: number) => {
    setNotifications(prev => prev.filter(x => x.id !== id));
  };

  const bgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-600';
      case 'warning': return 'bg-amber-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-[#1a1a2e]';
    }
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`${bgColor(n.type)} text-white rounded-2xl px-5 py-4 shadow-2xl animate-slide-in`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{n.title}</p>
                <p className="text-xs opacity-90 mt-0.5">{n.message}</p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="text-white/60 hover:text-white flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {n.action && (
              <button
                onClick={() => { dismiss(n.id); n.action!.onClick(); }}
                className="mt-3 w-full py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors"
              >
                {n.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
