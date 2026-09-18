import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api, User, Couple, Artwork, ApiError } from '../services/api';
import { storage } from '../services/storage';
import { widgetService } from '../services/widget-service';
import { registerForPushNotificationsAsync } from '../services/notifications';

interface AuthContextType {
  user: User | null;
  couple: Couple | null;
  latestArtwork: Artwork | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  syncNow: () => Promise<void>;
  setCouple: React.Dispatch<React.SetStateAction<Couple | null>>;
  setLatestArtwork: React.Dispatch<React.SetStateAction<Artwork | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [latestArtwork, setLatestArtwork] = useState<Artwork | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refs síncronos para evitar cierres obsoletos y controlar el ciclo de sincronización
  const userRef = useRef(user);
  userRef.current = user;
  const coupleRef = useRef(couple);
  coupleRef.current = couple;
  const latestArtworkRef = useRef(latestArtwork);
  latestArtworkRef.current = latestArtwork;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const isSyncingRef = useRef(false);

  const syncNow = useCallback(async () => {
    const curToken = tokenRef.current;
    if (!curToken || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      const syncData = await api.sync.getStatus();

      // 1. Sincronizar Usuario
      if (syncData.user) {
        const curUser = userRef.current;
        if (
          !curUser ||
          curUser.coupleId !== syncData.user.coupleId ||
          curUser.username !== syncData.user.username ||
          curUser.email !== syncData.user.email
        ) {
          setUser(syncData.user);
        }
      }

      // 2. Sincronizar Pareja en tiempo real
      const newCouple = syncData.couple;
      const curCouple = coupleRef.current;
      const coupleChanged =
        (!curCouple && !!newCouple) ||
        (!!curCouple && !newCouple) ||
        (curCouple && newCouple && (
          curCouple.id !== newCouple.id ||
          curCouple.inviteCode !== newCouple.inviteCode ||
          (curCouple.members?.length ?? 0) !== (newCouple.members?.length ?? 0) ||
          JSON.stringify(curCouple.members?.map(m => m.id)) !==
            JSON.stringify(newCouple.members?.map(m => m.id))
        ));

      if (coupleChanged) {
        setCouple(newCouple);
      }

      // 3. Sincronizar Último Dibujo
      const newArtwork = syncData.latestArtwork;
      const curArtwork = latestArtworkRef.current;
      const artworkChanged =
        (!curArtwork && !!newArtwork) ||
        (!!curArtwork && !newArtwork) ||
        (curArtwork && newArtwork && (
          curArtwork.id !== newArtwork.id ||
          curArtwork.updatedAt !== newArtwork.updatedAt
        ));

      if (artworkChanged) {
        setLatestArtwork(newArtwork);
      }
    } catch {
      // Respaldo transparente si /sync tuviera alguna interrupción
      try {
        const profile = await api.auth.getMe();
        setUser(profile);
        const pCouple = profile.couple as Couple | null;
        setCouple(pCouple);

        if (pCouple?.id) {
          const latest = await api.artworks.getLatest(pCouple.id);
          if (latestArtworkRef.current?.id !== latest?.id) {
            setLatestArtwork(latest);
          }
        } else {
          setLatestArtwork(null);
        }
      } catch {
        // Fallback silencioso para no interrumpir la experiencia de usuario
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const loadStoredSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await storage.getItem('pixeldraw_token');

      if (storedToken) {
        setToken(storedToken);
        tokenRef.current = storedToken;

        try {
          const syncData = await api.sync.getStatus();
          setUser(syncData.user);
          setCouple(syncData.couple);
          setLatestArtwork(syncData.latestArtwork);
        } catch (syncError: any) {
          // Si el token es explícitamente inválido (401), invalidar sesión
          if (syncError instanceof ApiError && syncError.status === 401) {
            throw syncError;
          }

          // Fallback con getMe()
          try {
            const profile = await api.auth.getMe();
            setUser(profile);
            const pCouple = profile.couple as Couple | null;
            setCouple(pCouple);
            if (pCouple?.id) {
              const latest = await api.artworks.getLatest(pCouple.id);
              setLatestArtwork(latest);
            }
          } catch (profileError: any) {
            if (profileError instanceof ApiError && profileError.status === 401) {
              throw profileError;
            }
            // Si el servidor está hibernando o hubo error de red, NO borrar el token
            console.warn(
              '[AuthContext] Servidor despertando o no disponible al cargar sesión. Se preserva el token local:',
              profileError?.message
            );
          }
        }
      }
    } catch (error: any) {
      // Únicamente cerrar sesión si el backend responde con 401 Unauthorized
      if (error instanceof ApiError && error.status === 401) {
        console.warn('[AuthContext] Sesión expirada o no autorizada (401):', error.message);
        await storage.removeItem('pixeldraw_token');
        setToken(null);
        tokenRef.current = null;
        setUser(null);
        setCouple(null);
        setLatestArtwork(null);
      } else {
        console.warn('[AuthContext] Error transitorio al verificar sesión:', error?.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Pre-calentar el contenedor en Render tan pronto como se monta la app
    api.health.ping();
    loadStoredSession();
  }, [loadStoredSession]);

  // Sincronizar y pre-calentar al volver a poner la aplicación en primer plano
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        api.health.ping();
        if (tokenRef.current) {
          syncNow();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [syncNow]);

  // Sincronizar widget con el último dibujo disponible
  useEffect(() => {
    widgetService.updateLatestDrawing(latestArtwork, user?.id);
  }, [latestArtwork, user?.id]);

  // Registrar notificaciones push para actualizar el widget cuando la pareja dibuje
  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync(user.id);
    }
  }, [user?.id]);

  const login = async (emailOrUsername: string, password: string) => {
    const data = await api.auth.login({ emailOrUsername, password });
    await storage.setItem('pixeldraw_token', data.token);
    setToken(data.token);
    tokenRef.current = data.token;
    setUser(data.user);
    await syncNow();
  };

  const register = async (email: string, username: string, password: string) => {
    const data = await api.auth.register({ email, username, password });
    await storage.setItem('pixeldraw_token', data.token);
    setToken(data.token);
    tokenRef.current = data.token;
    setUser(data.user);
    setCouple(null);
    setLatestArtwork(null);
    await widgetService.clearWidget();
  };

  const logout = async () => {
    await storage.removeItem('pixeldraw_token');
    setToken(null);
    tokenRef.current = null;
    setUser(null);
    setCouple(null);
    setLatestArtwork(null);
    await widgetService.clearWidget();
  };

  const refreshProfile = async () => {
    await syncNow();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        couple,
        latestArtwork,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
        syncNow,
        setCouple,
        setLatestArtwork,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
