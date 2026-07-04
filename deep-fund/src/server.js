import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { startCrawl, stopCrawl, onCrawlData } from './crawler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({ logger: true });

await fastify.register(fastifyCors);
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
});

// WebSocket 端点
await fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const sendData = (data) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify(data));
      }
    };
    const unsubscribe = onCrawlData(sendData);

    socket.on('message', (rawMsg) => {
      try {
        const { action, payload } = JSON.parse(rawMsg);
        if (action === 'start') startCrawl(payload);
        else if (action === 'stop') stopCrawl();
      } catch (e) {
        console.error('Invalid message:', e);
      }
    });

    socket.on('close', () => {
      unsubscribe();
    });
  });
});

// 可选 HTTP API
fastify.post('/api/start', async (req) => {
  await startCrawl(req.body);
  return { status: 'started' };
});

fastify.post('/api/stop', async (req) => {
  await stopCrawl();
  return { status: 'stopped' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();