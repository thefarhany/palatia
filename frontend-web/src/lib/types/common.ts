export interface NavItem {
  href: string;
  label: string;
}

export interface Notification {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type SocketHandler = (...args: unknown[]) => void;

export interface SocketCtx {
  on: (event: string, handler: SocketHandler) => () => void;
}
