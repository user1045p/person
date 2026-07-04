import { CheerioCrawler, RequestQueue } from 'crawlee';
import { insertData } from './db.js';
import { cleanData } from './cleaner.js';

let crawler = null;
const dataCallbacks = new Map();
let callbackId = 0;

export function onCrawlData(cb) {
  const id = ++callbackId;
  dataCallbacks.set(id, cb);
  return () => dataCallbacks.delete(id);
}

function pushToClients(item) {
  for (const cb of dataCallbacks.values()) {
    cb(item);
  }
}

export async function startCrawl({ urls, maxConcurrency = 10 }) {
  if (crawler) {
    console.log('Crawler already running');
    return;
  }

  const requestQueue = await RequestQueue.open();

  crawler = new CheerioCrawler({
    requestQueue,
    maxConcurrency,
    requestHandler: async ({ request, $ }) => {
      const rawItem = {
        url: request.url,
        title: $('title').text().trim(),
      };
      const cleaned = cleanData(rawItem);
      insertData(cleaned);
      pushToClients(cleaned);
    },
    // 示例反封禁设置
    maxRequestsPerMinute: 180,
    useSessionPool: true,
  });

  await requestQueue.addRequests(urls.map(u => ({ url: u })));

  crawler.run().then(() => {
    console.log('Crawler finished');
    crawler = null;
  }).catch(err => {
    console.error('Crawler error:', err);
    crawler = null;
  });
}

export async function stopCrawl() {
  if (crawler) {
    await crawler.teardown();
    crawler = null;
    console.log('Crawler stopped');
  }
}