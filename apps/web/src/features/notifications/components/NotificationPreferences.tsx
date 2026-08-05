import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

/**
 * Panel de preferencias de notificación (US#2). Interruptores para activar los
 * recordatorios y elegir canales (app / email) y días de anticipación.
 */
export function NotificationPreferences(): JSX.Element {
  const { preferences, loading, saving, error, update } = useNotificationPreferences();

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Preferencias de notificación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading && <p className="text-sm text-muted-foreground">Cargando preferencias…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {preferences && (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="pref-enabled" className="text-sm font-medium">
                  Recordatorios de mantenimiento
                </Label>
                <p className="text-xs text-muted-foreground">
                  Avisos cuando un servicio está próximo o vencido.
                </p>
              </div>
              <Switch
                id="pref-enabled"
                checked={preferences.remindersEnabled}
                disabled={saving}
                onCheckedChange={(v) => void update({ remindersEnabled: v })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pref-app" className="text-sm font-normal">
                Notificaciones en la app
              </Label>
              <Switch
                id="pref-app"
                checked={preferences.appChannel}
                disabled={saving || !preferences.remindersEnabled}
                onCheckedChange={(v) => void update({ appChannel: v })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pref-email" className="text-sm font-normal">
                Notificaciones por email
              </Label>
              <Switch
                id="pref-email"
                checked={preferences.emailChannel}
                disabled={saving || !preferences.remindersEnabled}
                onCheckedChange={(v) => void update({ emailChannel: v })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pref-days" className="text-sm font-normal">
                Días de anticipación
              </Label>
              <Input
                id="pref-days"
                type="number"
                min={0}
                max={365}
                className="w-24"
                defaultValue={preferences.daysBefore}
                disabled={saving || !preferences.remindersEnabled}
                onBlur={(e) => {
                  const value = Number(e.currentTarget.value);
                  if (Number.isFinite(value) && value !== preferences.daysBefore) {
                    void update({ daysBefore: Math.max(0, Math.min(365, Math.round(value))) });
                  }
                }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
