import type { ViewportMeasurement } from './viewportMeasurement';

const STORAGE_KEY = 'effective-viewport.measurement-queue.v1';

export interface QueuedMeasurement {
  id: string;
  savedAt: string;
  deviceName: string;
  edgeToEdgeConfirmed: boolean;
  measurement: ViewportMeasurement;
}

export function readQueue(): QueuedMeasurement[] {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    return rawValue ? (JSON.parse(rawValue) as QueuedMeasurement[]) : [];
  } catch {
    return [];
  }
}

export function addToQueue(
  measurement: ViewportMeasurement,
  deviceName: string,
  edgeToEdgeConfirmed: boolean,
): QueuedMeasurement[] {
  const entry: QueuedMeasurement = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    deviceName,
    edgeToEdgeConfirmed,
    measurement,
  };
  const queue = [...readQueue(), entry];
  writeQueue(queue);

  return queue;
}

export function removeFromQueue(id: string): QueuedMeasurement[] {
  const queue = readQueue().filter((entry) => entry.id !== id);
  writeQueue(queue);

  return queue;
}

export function clearQueue(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function serializeQueue(queue: QueuedMeasurement[]): string {
  return JSON.stringify(queue, null, 2);
}

function writeQueue(queue: QueuedMeasurement[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}
