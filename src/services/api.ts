import { storage } from './storage';

// URL base de la API (Render Backend por defecto):
const DEFAULT_API_URL = 'https://pixel-draw-backend-dce0.onrender.com/api/v1';

const formatApiUrl = (url: string): string => {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api/v1')) {
    cleaned = `${cleaned}/api/v1`;
  }
  return cleaned;
};

export const API_BASE_URL = formatApiUrl(
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL
);

export class ApiError extends Error {
  public status: number;
  public isNetworkError: boolean;
  public isServerWaking: boolean;
  public data?: any;

  constructor(
    message: string,
    options: {
      status?: number;
      isNetworkError?: boolean;
      isServerWaking?: boolean;
      data?: any;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status || 0;
    this.isNetworkError = !!options.isNetworkError;
    this.isServerWaking = !!options.isServerWaking;
    this.data = options.data;
  }
}

export type ServerConnectionStatus = 'online' | 'waking' | 'offline' | 'idle';

export interface ServerStatusEvent {
  status: ServerConnectionStatus;
  attempt?: number;
  maxAttempts?: number;
  message?: string;
}

type ServerStatusListener = (event: ServerStatusEvent) => void;
const statusListeners = new Set<ServerStatusListener>();

let currentServerStatus: ServerConnectionStatus = 'idle';

export const getServerStatus = (): ServerConnectionStatus => currentServerStatus;
export const getActiveRequestsCount = (): number => activeRequestsCount;

export const addServerStatusListener = (listener: ServerStatusListener): (() => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

const notifyServerStatus = (event: ServerStatusEvent) => {
  currentServerStatus = event.status;
  statusListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.warn('[ServerStatusListener Error]', err);
    }
  });
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export interface User {
  id: number;
  username: string;
  email: string;
  coupleId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Couple {
  id: number;
  inviteCode: string | null;
  createdAt: string;
  updatedAt: string;
  members: User[];
  _count?: {
    artworks: number;
  };
}

export interface Artwork {
  id: number;
  name: string | null;
  width: number;
  height: number;
  grid: string[][];
  coupleId: number;
  authorId: number;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedArtworks {
  artworks: Artwork[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SyncStatus {
  user: User;
  couple: Couple | null;
  latestArtwork: Artwork | null;
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  skipRetry?: boolean;
}

const RETRY_DELAYS = [1500, 3000, 6000, 10000];

const isRetryableError = (error: any): boolean => {
  if (error instanceof ApiError) {
    if (error.status === 502 || error.status === 503 || error.status === 504) {
      return true;
    }
    if (error.isNetworkError || error.isServerWaking) {
      return true;
    }
    // Errores de cliente (400, 401, 403, 404, 422) NO deben reintentarse
    return false;
  }
  return true;
};

let activeRequestsCount = 0;
let hasReportedWaking = false;

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 15000,
    maxRetries = 4,
    skipRetry = false,
    ...fetchOptions
  } = options;

  const token = await storage.getItem('pixeldraw_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  activeRequestsCount++;

  // Si la petición tarda más de 3 segundos, advertir a la UI que el servidor posiblemente esté despertando
  const slowTimer = setTimeout(() => {
    if (!hasReportedWaking) {
      hasReportedWaking = true;
      notifyServerStatus({
        status: 'waking',
        message: 'Iniciando servidor en la nube...',
      });
    }
  }, 3000);

  const totalAttempts = skipRetry ? 1 : maxRetries + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Manejo de códigos 502/503/504 específicos de Render durante Cold Start
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new ApiError('El servidor se está iniciando en la nube (Render cold start)', {
          status: response.status,
          isServerWaking: true,
        });
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        const text = await response.text().catch(() => '');
        data = { message: text };
      }

      if (!response.ok || (data && data.success === false)) {
        const errorMessage = data?.message || `Error HTTP ${response.status} en la petición`;
        throw new ApiError(errorMessage, {
          status: response.status,
          data: data?.data || data,
        });
      }

      // Éxito: limpiar temporizador lento
      clearTimeout(slowTimer);
      activeRequestsCount--;

      if (hasReportedWaking) {
        hasReportedWaking = false;
        notifyServerStatus({
          status: 'online',
          message: 'Servidor conectado',
        });
      }

      return (data?.data !== undefined ? data.data : data) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      let processedError: ApiError;

      if (error instanceof ApiError) {
        processedError = error;
      } else if (error?.name === 'AbortError') {
        processedError = new ApiError('Tiempo de espera agotado mientras el servidor inicia', {
          isNetworkError: true,
          isServerWaking: true,
        });
      } else {
        processedError = new ApiError(error?.message || 'Error de conexión con el servidor', {
          isNetworkError: true,
          isServerWaking: true,
        });
      }

      const isLastAttempt = attempt === totalAttempts;
      const canRetry = !skipRetry && isRetryableError(processedError);

      if (!isLastAttempt && canRetry) {
        hasReportedWaking = true;
        const delay = RETRY_DELAYS[attempt - 1] || 10000;

        notifyServerStatus({
          status: 'waking',
          attempt,
          maxAttempts: totalAttempts,
          message: `Despertando servidor en la nube... (Intento ${attempt}/${totalAttempts})`,
        });

        console.warn(
          `[API Cold Start / Retry] ${endpoint} falló (intento ${attempt}/${totalAttempts}). Reintentando en ${delay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Si se agotaron los intentos o no es reintentable
      clearTimeout(slowTimer);
      activeRequestsCount--;

      if (isLastAttempt && processedError.isServerWaking) {
        notifyServerStatus({
          status: 'offline',
          message: 'El servidor está tardando más de lo esperado en iniciar.',
        });
      }

      console.error(`[API Error] ${endpoint}:`, processedError.message);
      throw processedError;
    }
  }

  clearTimeout(slowTimer);
  activeRequestsCount--;
  throw new ApiError('Error inesperado en el ciclo de peticiones', { isNetworkError: true });
}

export const api = {
  health: {
    async check(): Promise<{ status: string; uptime?: number }> {
      return request('/health', {
        method: 'GET',
        timeoutMs: 15000,
        maxRetries: 4,
      });
    },

    async ping(): Promise<boolean> {
      try {
        await request('/health', {
          method: 'GET',
          timeoutMs: 15000,
          maxRetries: 3,
        });
        return true;
      } catch {
        return false;
      }
    },
  },

  auth: {
    async register(data: { email: string; username: string; password: string }): Promise<{ user: User; token: string }> {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async login(data: { emailOrUsername: string; password: string }): Promise<{ user: User; token: string }> {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getMe(): Promise<User & { couple: Couple | null }> {
      return request('/auth/me', {
        method: 'GET',
      });
    },
  },

  couples: {
    async create(userId: number): Promise<Couple> {
      return request('/couples', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },

    async join(userId: number, inviteCode: string): Promise<Couple> {
      return request('/couples/join', {
        method: 'POST',
        body: JSON.stringify({ userId, inviteCode }),
      });
    },

    async leave(userId: number): Promise<{ success: boolean; message: string }> {
      return request('/couples/leave', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },

    async getByUserId(userId: number): Promise<Couple> {
      return request(`/couples/user/${userId}`, {
        method: 'GET',
      });
    },

    async getById(coupleId: number): Promise<Couple> {
      return request(`/couples/${coupleId}`, {
        method: 'GET',
      });
    },

    async getByInviteCode(code: string): Promise<Couple> {
      return request(`/couples/code/${code}`, {
        method: 'GET',
      });
    },

    async regenerateCode(coupleId: number, userId: number): Promise<Couple> {
      return request(`/couples/${coupleId}/regenerate-code`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },
  },

  artworks: {
    async create(data: {
      name?: string;
      width: number;
      height: number;
      grid: string[][];
      coupleId: number;
      authorId: number;
    }): Promise<Artwork> {
      return request('/artworks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getCoupleArtworks(coupleId: number, page = 1, limit = 20): Promise<PaginatedArtworks> {
      return request(`/artworks/couple/${coupleId}?page=${page}&limit=${limit}`, {
        method: 'GET',
      });
    },

    async getLatest(coupleId: number): Promise<Artwork | null> {
      return request(`/artworks/couple/${coupleId}/latest`, {
        method: 'GET',
      });
    },

    async getById(id: number): Promise<Artwork> {
      return request(`/artworks/${id}`, {
        method: 'GET',
      });
    },

    async delete(id: number): Promise<void> {
      return request(`/artworks/${id}`, {
        method: 'DELETE',
      });
    },
  },

  users: {
    async update(id: number, data: { pushToken?: string; username?: string; email?: string }): Promise<User> {
      return request(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async savePushToken(userId: number, pushToken: string): Promise<void> {
      try {
        await request(`/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ pushToken }),
        });
      } catch (err) {
        console.warn('[API] Could not save push token to backend:', err);
      }
    },
  },

  sync: {
    async getStatus(): Promise<SyncStatus> {
      return request('/sync', {
        method: 'GET',
      });
    },
  },
};

