import { WebSocketServer, WebSocket } from 'ws';
import { sql } from './trpc/trpc';

interface ClientSocket extends WebSocket {
  communityId?: string;
  userId?: string;
}

let wss: WebSocketServer | null = null;

export function setupWebSocketServer(port = 8082) {
  if (wss) return wss;

  try {
    wss = new WebSocketServer({ port });
    console.log(`[WebSocket Server] Running on ws://localhost:${port}`);

    wss.on('connection', (ws: ClientSocket) => {
      ws.on('message', async (message: string) => {
        try {
          const payload = JSON.parse(message.toString());

          if (payload.type === 'join_room' && payload.communityId) {
            ws.communityId = payload.communityId;
            console.log(`[WebSocket] Client joined community room: ${payload.communityId}`);
          }

          if (payload.type === 'send_message' && payload.communityId && payload.text) {
            const { communityId, senderId, senderName, text } = payload;
            const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const createdAt = new Date().toISOString();

            // 1. Save to NeonDB
            try {
              await sql`
                INSERT INTO community_messages (id, community_id, sender_id, sender_name, text)
                VALUES (${msgId}, ${communityId}, ${senderId}, ${senderName}, ${text})
              `;
            } catch (dbErr) {
              console.error('[WebSocket DB Error]:', dbErr);
            }

            // 2. Broadcast to all clients in the same community room
            const broadcastPayload = JSON.stringify({
              type: 'new_message',
              message: {
                id: msgId,
                communityId,
                senderId,
                senderName,
                text,
                createdAt,
              },
            });

            wss?.clients.forEach((client: ClientSocket) => {
              if (client.readyState === WebSocket.OPEN && client.communityId === communityId) {
                client.send(broadcastPayload);
              }
            });
          }
        } catch (err) {
          console.error('[WebSocket Message Error]:', err);
        }
      });
    });
  } catch (err) {
    console.error('[WebSocket Setup Error]:', err);
  }

  return wss;
}

// Auto setup on import
setupWebSocketServer(8082);
