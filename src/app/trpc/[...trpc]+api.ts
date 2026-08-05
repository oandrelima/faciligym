import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../backend/src/trpc/router';
import { createContext } from '../../../backend/src/trpc/trpc';

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: request,
    router: appRouter,
    createContext,
  });
};

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
