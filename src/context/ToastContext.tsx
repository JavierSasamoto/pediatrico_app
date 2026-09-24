import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

type ToastContextType = {
  showToast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md text-sm font-medium animate-toast-in ${
              toast.type === 'success'
                ? 'bg-teal-600/95 text-white'
                : toast.type === 'error'
                ? 'bg-rose-500/95 text-white'
                : 'bg-sky-500/95 text-white'
            }`}
          >
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
