let currentSessionId: string | null = null;

export function setCurrentSessionId(id: string | null) {
  currentSessionId = id;
}

export function getCurrentSessionId(): string | null {
  return currentSessionId;
}
