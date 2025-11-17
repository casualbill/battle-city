export interface WebSocketMessage {
  action: string;
  [key: string]: any;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private connectAttempts: number = 0;
  private maxConnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const connect = () => {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.connectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
      };

      connect();
    });
  }

  private attemptReconnect(): void {
    if (this.connectAttempts < this.maxConnectAttempts) {
      this.connectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.connectAttempts}/${this.maxConnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.connectAttempts);
    } else {
      console.error('Failed to reconnect after multiple attempts');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    console.error('WebSocket is not open. Cannot send message:', message);
    return false;
  }

  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event)?.filter(h => h !== handler);
      if (handlers?.length) {
        this.eventHandlers.set(event, handlers);
      } else {
        this.eventHandlers.delete(event);
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const { action } = message;
    if (this.eventHandlers.has(action)) {
      this.eventHandlers.get(action)?.forEach(handler => handler(message));
    }
    // 也触发"message"事件，用于处理所有消息
    if (this.eventHandlers.has('message')) {
      this.eventHandlers.get('message')?.forEach(handler => handler(message));
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 创建一个全局WebSocket客户端实例
export const wsClient = new WebSocketClient('ws://localhost:8765');