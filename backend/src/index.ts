import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { createServer } from 'http';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { authenticate } from './auth/middleware.js';
import { uploadRouter } from './upload/router.js';
import type { Context } from './context.js';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// Expose Prisma for upload router via app.locals
app.locals.prisma = prisma;

// Top-level CORS — covers /graphql, /api, /uploads
app.use(cors());

// Static file serving for uploaded images
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Upload REST endpoint
app.use('/api', uploadRouter);

const schema = makeExecutableSchema({ typeDefs, resolvers });

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

useServer(
  {
    schema,
    context: async (ctx) => {
      const token = ctx.connectionParams?.authorization as string | undefined;
      const user = token ? await authenticate(token, prisma) : null;
      return { prisma, user };
    },
  },
  wsServer,
);

const server = new ApolloServer<Context>({ schema });
await server.start();

app.use(
  '/graphql',
  cors<cors.CorsRequest>(),
  express.json({ limit: '10mb' }),
  expressMiddleware(server, {
    context: async ({ req }): Promise<Context> => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = token ? await authenticate(token, prisma) : null;
      return { prisma, user };
    },
  }),
);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🏰 Arcane Ledger API ready at http://localhost:${PORT}/graphql`);
  console.log(`📡 Subscriptions ready at ws://localhost:${PORT}/graphql`);
});
