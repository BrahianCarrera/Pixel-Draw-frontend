import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  addServerStatusListener,
  ServerConnectionStatus,
  ServerStatusEvent,
  api,
} from '../services/api';

export interface ServerStatusContextType {
  status: ServerConnectionStatus;
  isWaking: boolean;
  isOnline: boolean;
  isOffline: boolean;
  message: string;
  attempt: number;
  maxAttempts: number;
  retryNow: () => Promise<void>;
  dismiss: () => void;
  triggerPrewarm: () => void;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

export const ServerStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ServerConnectionStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [attempt, setAttempt] = useState<number>(1);
  const [maxAttempts, setMaxAttempts] = useState<number>(4);
  const onlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = addServerStatusListener((event: ServerStatusEvent) => {
      setStatus(event.status);

      if (event.message) {
        setMessage(event.message);
      }

      if (event.attempt !== undefined) {
        setAttempt(event.attempt);
      }

      if (event.maxAttempts !== undefined) {
        setMaxAttempts(event.maxAttempts);
      }

      // Si el servidor se conectó con éxito, ocultar el banner tras 2.5 segundos
      if (event.status === 'online') {
        if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current);
        onlineTimerRef.current = setTimeout(() => {
          setStatus('idle');
        }, 2500);
      }
    });

    return () => {
      unsubscribe();
      if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    setStatus('idle');
  }, []);

  const triggerPrewarm = useCallback(() => {
    api.health.ping();
  }, []);

  const retryNow = useCallback(async () => {
    setStatus('waking');
    setMessage('Comprobando estado del servidor...');
    try {
      await api.health.check();
      setStatus('online');
      setMessage('Servidor conectado con éxito');
      if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current);
      onlineTimerRef.current = setTimeout(() => {
        setStatus('idle');
      }, 2500);
    } catch {
      setStatus('offline');
      setMessage('El servidor aún no responde. Intenta nuevamente en unos momentos.');
    }
  }, []);

  return (
    <ServerStatusContext.Provider
      value={{
        status,
        isWaking: status === 'waking',
        isOnline: status === 'online',
        isOffline: status === 'offline',
        message,
        attempt,
        maxAttempts,
        retryNow,
        dismiss,
        triggerPrewarm,
      }}
    >
      {children}
    </ServerStatusContext.Provider>
  );
};

export const useServerStatus = (): ServerStatusContextType => {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error('useServerStatus debe usarse dentro de un ServerStatusProvider');
  }
  return context;
};
