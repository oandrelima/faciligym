import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/trpc';
import './websocket'; // Initialize TypeScript WebSocket Server for Communities

const app = new Hono();

// Enable CORS for Expo frontend calls
app.use('*', cors());

// Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'online',
    app: 'FaciliGym API (T3 Stack + WebSocket)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// tRPC Endpoint
app.all('/trpc/*', (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

export default app;
