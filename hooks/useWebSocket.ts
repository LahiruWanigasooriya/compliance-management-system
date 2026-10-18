import { useEffect, useRef, useCallback, useState } from "react";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  sendMessage: (data: unknown) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    cleanup();
    setStatus("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        reconnectCountRef.current = 0;
        onOpen?.();
      };

      ws.onclose = () => {
        setStatus("disconnected");
        onClose?.();

        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts && enabled) {
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          // If not JSON, pass raw data
          onMessage?.(event.data);
        }
      };
    } catch (error) {
      setStatus("error");
      console.error("WebSocket connection error:", error);
    }
  }, [url, enabled, onMessage, onOpen, onClose, onError, reconnectAttempts, reconnectInterval, cleanup]);

  // Keep the ref updated with the latest connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    reconnectCountRef.current = reconnectAttempts; // Prevent reconnection
    cleanup();
    setStatus("disconnected");
  }, [cleanup, reconnectAttempts]);

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    connect();
  }, [connect]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Status updates are intentional for tracking WebSocket connection state
      connect();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Status updates are intentional for tracking WebSocket connection state
      disconnect();
    }

    return () => {
      cleanup();
    };
  }, [enabled, connect, disconnect, cleanup]);

  return {
    status,
    sendMessage,
    reconnect,
    disconnect,
  };
}
