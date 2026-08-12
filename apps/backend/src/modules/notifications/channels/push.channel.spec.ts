import * as webpush from 'web-push';

import { PushChannel } from './push.channel';

import type { PushSubscription } from '../entities/push-subscription.entity';
import type { ConfigService } from '@nestjs/config';
import type { ObjectLiteral, Repository } from 'typeorm';

jest.mock('web-push');

type RepoMock<T extends ObjectLiteral> = jest.Mocked<Pick<Repository<T>, 'find' | 'remove'>>;

function buildRepo<T extends ObjectLiteral>(): RepoMock<T> {
  return { find: jest.fn(), remove: jest.fn() } as unknown as RepoMock<T>;
}

function buildConfig(vapid: boolean): ConfigService {
  const values: Record<string, string> = vapid
    ? { VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv' }
    : {};
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('PushChannel', () => {
  let subsRepo: RepoMock<PushSubscription>;

  beforeEach(() => {
    subsRepo = buildRepo<PushSubscription>();
    jest.clearAllMocks();
  });

  it('sin VAPID configurado, no envía ni consulta suscripciones (dev/CI)', async () => {
    const channel = new PushChannel(
      buildConfig(false),
      subsRepo as unknown as Repository<PushSubscription>,
    );
    await channel.send({ userId: 1, titulo: 'T', mensaje: 'M' });
    expect(subsRepo.find).not.toHaveBeenCalled();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it('lanza si el usuario no tiene suscripciones', async () => {
    subsRepo.find.mockResolvedValue([]);
    const channel = new PushChannel(
      buildConfig(true),
      subsRepo as unknown as Repository<PushSubscription>,
    );
    await expect(channel.send({ userId: 1, titulo: 'T', mensaje: 'M' })).rejects.toThrow(
      /sin suscripciones/,
    );
  });

  it('envía a cada suscripción del usuario', async () => {
    const subs = [
      { id: 1, userId: 1, endpoint: 'https://a', p256dh: 'p1', auth: 'a1' },
    ] as PushSubscription[];
    subsRepo.find.mockResolvedValue(subs);
    (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

    const channel = new PushChannel(
      buildConfig(true),
      subsRepo as unknown as Repository<PushSubscription>,
    );
    await channel.send({ userId: 1, titulo: 'T', mensaje: 'M' });

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    expect(subsRepo.remove).not.toHaveBeenCalled();
  });

  it('borra las suscripciones expiradas (410/404) y no falla si otra sí entrega', async () => {
    const expired = { id: 1, userId: 1, endpoint: 'https://expired', p256dh: 'p1', auth: 'a1' };
    const alive = { id: 2, userId: 1, endpoint: 'https://alive', p256dh: 'p2', auth: 'a2' };
    subsRepo.find.mockResolvedValue([expired, alive] as PushSubscription[]);
    (webpush.sendNotification as jest.Mock)
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockResolvedValueOnce(undefined);

    const channel = new PushChannel(
      buildConfig(true),
      subsRepo as unknown as Repository<PushSubscription>,
    );
    await channel.send({ userId: 1, titulo: 'T', mensaje: 'M' });

    expect(subsRepo.remove).toHaveBeenCalledWith([expired]);
  });
});
