import { api } from '@/lib/api-client';

export interface ChatAction {
  id?: string;
  type: string;
  label: string;
  payload?: Record<string, unknown>;
  url?: string;
}

export interface ChatUserContext {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ChatVehicleContext {
  id: number;
  alias?: string;
  brand: string;
  model: string;
  year: number;
  currentMileage: number;
}

export interface ChatRequest {
  message: string;
  context: {
    user: ChatUserContext | null;
    vehicle: ChatVehicleContext | null;
    vehicles: ChatVehicleContext[];
    currentPath: string;
  };
}

export interface ChatResponse {
  response: string;
  actions: ChatAction[];
}

const CHAT_ENDPOINT = (import.meta.env.VITE_CHAT_ENDPOINT as string | undefined) ?? '/chat';

export const chatApi = {
  sendMessage: async (payload: ChatRequest): Promise<ChatResponse> => {
    const result = await api.post<{
      response?: string;
      respuesta?: string;
      message?: string;
      actions?: ChatAction[];
      acciones?: ChatAction[];
    }>(CHAT_ENDPOINT, {
      ...payload,
      mensaje: payload.message,
      contexto: payload.context,
    });

    const responseText = result.response ?? result.respuesta ?? result.message ?? '';
    const actions = Array.isArray(result.actions)
      ? result.actions
      : Array.isArray(result.acciones)
        ? result.acciones
        : [];

    return {
      response: responseText,
      actions,
    };
  },
};
