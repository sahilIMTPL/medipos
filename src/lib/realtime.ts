"use client";

import { ShiftSummary } from "./api";

export type RealtimeEventType =
  | "CONNECTED"
  | "HEARTBEAT"
  | "SHIFT_OPENED"
  | "SHIFT_CLOSED"
  | "SHIFT_UPDATED"
  | "CASH_MOVEMENT"
  | "SALE_COMPLETED"
  | "SALE_RETURNED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  storeId?: string;
  data: {
    shift?: ShiftSummary | any;
    shiftSummary?: ShiftSummary | null;
    movement?: any;
    sale?: any;
    return?: any;
    message?: string;
    [key: string]: any;
  };
  timestamp: string;
}

type RealtimeListener = (event: RealtimeEventPayload) => void;

class RealtimeClient {
  private socket: WebSocket | null = null;
  private currentStoreId: string | null = null;
  private listeners: Set<RealtimeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private isConnected = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        if ("BroadcastChannel" in window) {
          this.broadcastChannel = new BroadcastChannel("medipos_realtime_shifts");
          this.broadcastChannel.onmessage = (ev) => {
            if (ev.data) {
              this.dispatchToListeners(ev.data, false);
            }
          };
        }
      } catch (err) {
        console.warn("BroadcastChannel not supported in this environment:", err);
      }
    }
  }

  public setStoreId(storeId?: string) {
    if (!storeId || storeId === this.currentStoreId) return;
    this.currentStoreId = storeId;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "SUBSCRIBE", storeId }));
    } else {
      this.connect();
    }
  }

  public connect() {
    if (typeof window === "undefined") return;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isExplicitlyClosed = false;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const hostname = window.location.hostname || "localhost";
      const wsUrl = `${protocol}//${hostname}:5000/ws${
        this.currentStoreId ? `?storeId=${this.currentStoreId}` : ""
      }`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        if (this.currentStoreId) {
          this.socket?.send(JSON.stringify({ type: "SUBSCRIBE", storeId: this.currentStoreId }));
        }

        // Notify app
        window.dispatchEvent(new CustomEvent("medipos_socket_status", { detail: { connected: true } }));
      };

      this.socket.onmessage = (event) => {
        try {
          const payload: RealtimeEventPayload = JSON.parse(event.data);
          this.handleIncomingEvent(payload);
        } catch (err) {
          console.error("Failed to parse incoming WebSocket message:", err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        window.dispatchEvent(new CustomEvent("medipos_socket_status", { detail: { connected: false } }));

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        try {
          this.socket?.close();
        } catch {}
      };
    } catch (err) {
      console.warn("WebSocket connection initialization failed:", err);
      this.scheduleReconnect();
    }
  }

  private handleIncomingEvent(payload: RealtimeEventPayload) {
    if (payload.type === "HEARTBEAT" || payload.type === "CONNECTED") {
      return;
    }

    // Filter store if payload has specific storeId and we have one
    if (
      payload.storeId &&
      this.currentStoreId &&
      payload.storeId !== this.currentStoreId
    ) {
      return;
    }

    // 1. Dispatch to all active in-page listeners
    this.dispatchToListeners(payload, true);

    // 2. Dispatch window DOM event for existing listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("medipos_shift_updated", {
          detail: payload,
        })
      );
    }
  }

  private dispatchToListeners(payload: RealtimeEventPayload, broadcastToOtherTabs = true) {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch (err) {
        console.error("Error executing real-time listener:", err);
      }
    }

    // Broadcast across browser tabs
    if (broadcastToOtherTabs && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch {}
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    this.connect();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // Exponential backoff capped at 8 seconds
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: "PING" }));
        } catch {}
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }
}

export const realtimeClient = new RealtimeClient();
