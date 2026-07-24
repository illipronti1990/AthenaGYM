/**
 * Lightweight AI assistant stub — production will call LLM + tool-calling against platform API.
 * Platform Nest already exposes POST /ai/chat; this service is the future extraction point.
 */
const http = require('http');

const PORT = Number(process.env.AI_SERVICE_PORT || 3010);
const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'athenas-ai-service', api: API_URL }));
    return;
  }

  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body || '{}');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        provider: 'ai-service-stub',
        answer: `Stub AI recebeu: "${parsed.question || ''}". Use POST ${API_URL}/ai/chat no Nest até a extração completa.`,
        sources: [],
      }),
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ATHENAS AI service stub on :${PORT}`);
});
