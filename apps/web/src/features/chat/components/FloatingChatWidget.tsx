import { MessageCircle, Send, Wrench } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useUserVehicles } from '@/features/garage/hooks/useUserVehicles';
import { extractApiErrorMessage } from '@/lib/api-client';

import {
  chatApi,
  type ChatAction,
  type ChatRequest,
  type ChatVehicleContext,
} from '../server/chat.api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}

const DERIVE_QUOTE_ACTION = 'DERIVE_QUOTE';

export function FloatingChatWidget(): JSX.Element | null {
  const { user } = useAuth();
  const { vehicles } = useUserVehicles();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content:
        'Hola. Soy tu asistente de repuestos. Cuentame que necesitas y te ayudo con compatibilidad, mantenimiento o cotizacion.',
    },
  ]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const vehicleContext = useMemo<ChatVehicleContext[]>(
    () =>
      vehicles.map((vehicle) => ({
        id: vehicle.id,
        alias: vehicle.alias,
        brand: vehicle.model.marca.nombre,
        model: vehicle.model.nombre,
        year: vehicle.year,
        currentMileage: vehicle.currentMileage,
      })),
    [vehicles],
  );

  const selectedVehicle = vehicleContext[0] ?? null;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, open]);

  const appendAssistantError = useCallback((errorText: string): void => {
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: errorText,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (rawMessage: string): Promise<void> => {
      const message = rawMessage.trim();
      if (!message || loading) return;

      const requestPayload: ChatRequest = {
        message,
        context: {
          user: user
            ? {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                role: user.role,
              }
            : null,
          vehicle: selectedVehicle,
          vehicles: vehicleContext,
          currentPath: location.pathname,
        },
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: message,
        },
      ]);
      setDraft('');
      setLoading(true);

      try {
        const response = await chatApi.sendMessage(requestPayload);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.response,
            actions: response.actions,
          },
        ]);
      } catch (error) {
        appendAssistantError(
          `No pude responder en este momento. ${extractApiErrorMessage(error)}. Intentalo otra vez en unos segundos.`,
        );
      } finally {
        setLoading(false);
      }
    },
    [appendAssistantError, loading, location.pathname, selectedVehicle, user, vehicleContext],
  );

  const handleAction = useCallback(
    async (action: ChatAction): Promise<void> => {
      if (action.url) {
        navigate(action.url);
        setOpen(false);
        return;
      }

      const actionType = action.type.toUpperCase();
      if (actionType === DERIVE_QUOTE_ACTION || actionType.includes('COTIZ')) {
        setDraft('Necesito una cotizacion de repuestos para mi vehiculo.');
        return;
      }

      const payloadMessage =
        typeof action.payload?.message === 'string' ? action.payload.message.trim() : '';
      const followUp = payloadMessage || action.label;
      await sendMessage(followUp);
    },
    [navigate, sendMessage],
  );

  const handleSubmit = useCallback(async (): Promise<void> => {
    await sendMessage(draft);
  }, [draft, sendMessage]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/auth/login') ||
    location.pathname.startsWith('/auth/register')
  ) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="lg"
          className="fixed right-5 bottom-5 z-40 rounded-full px-4 shadow-lg shadow-navy-900/20 sm:right-7 sm:bottom-7"
          aria-label="Abrir chat de asistencia"
        >
          <MessageCircle className="size-4" />
          Asistente
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full p-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b bg-gradient-to-r from-navy-700 via-navy-700 to-navy-600 text-white">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/15 p-2">
              <Wrench className="size-4" />
            </span>
            <div>
              <SheetTitle className="text-white">Asistente KORE</SheetTitle>
              <SheetDescription className="text-white/80">
                Respuestas para repuestos, mantenimiento y compatibilidad.
              </SheetDescription>
            </div>
          </div>
          {selectedVehicle && (
            <div>
              <Badge variant="secondary" className="bg-white/15 text-white hover:bg-white/20">
                {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <div className="flex h-full min-h-0 flex-col">
          <div
            ref={scrollContainerRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 min-h-0"
          >
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground'
                    : 'mr-auto w-fit max-w-[90%] rounded-xl rounded-bl-sm border bg-card px-3 py-2 text-sm text-card-foreground'
                }
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((action, index) => (
                      <Button
                        key={action.id ?? `${message.id}-${index}-${action.label}`}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => void handleAction(action)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="border-t bg-background/95 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                disabled={loading}
                rows={2}
                placeholder="Describe que repuesto buscas o que problema tiene tu vehiculo..."
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                size="icon"
                disabled={loading || draft.trim().length === 0}
                onClick={() => void handleSubmit()}
                aria-label="Enviar mensaje"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
