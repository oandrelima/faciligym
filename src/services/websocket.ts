import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface CommunityMessage {
  id: string;
  communityId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface CommunityItem {
  id: string;
  name: string;
  code: string;
  createdBy: string;
}

function getWsUrl(): string {
  if (Platform.OS === 'web') {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${loc.hostname}:8082`;
  }
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const localhost = debuggerHost?.split(':')[0];
  if (localhost) return `ws://${localhost}:8082`;
  return 'ws://192.168.0.3:8082';
}

class CommunityWebSocketService {
  private ws: WebSocket | null = null;
  private currentCommunityId: string | null = null;
  private onMessageCallbacks: Array<(msg: CommunityMessage) => void> = [];

  connect(communityId: string, onNewMessage: (msg: CommunityMessage) => void) {
    this.currentCommunityId = communityId;
    if (!this.onMessageCallbacks.includes(onNewMessage)) {
      this.onMessageCallbacks.push(onNewMessage);
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.send({ type: 'join_room', communityId });
      return;
    }

    try {
      const url = getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to community server at:', url);
        if (this.currentCommunityId) {
          this.send({ type: 'join_room', communityId: this.currentCommunityId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message' && data.message) {
            this.onMessageCallbacks.forEach(cb => cb(data.message));
          }
        } catch (err) {
          console.log('[WebSocket] Error parsing message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.log('[WebSocket] Connection error:', err);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
      };
    } catch (err) {
      console.log('[WebSocket] Connection setup failed:', err);
    }
  }

  sendMessage(communityId: string, senderId: string, senderName: string, text: string) {
    const msgPayload = {
      type: 'send_message',
      communityId,
      senderId,
      senderName,
      text: text.trim(),
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send(msgPayload);
    } else {
      this.connect(communityId, () => {});
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.send(msgPayload);
        }
      }, 500);
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.onMessageCallbacks = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const communityWs = new CommunityWebSocketService();
