import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_D7dywqTpAH3l@ep-twilight-violet-axiojrl6.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

export const sql = neon(DATABASE_URL);

export const createContext = async (opts?: any) => {
  return {
    sql,
    req: opts?.req,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
