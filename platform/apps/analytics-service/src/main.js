/**
 * Future extraction point for warehouse ETL + KPI computation.
 * Nest AnalyticsModule remains the source of truth for Sprint 8.
 */
const http = require('http');

const PORT = Number(process.env.ANALYTICS_SERVICE_PORT || 3011);
const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'athena-analytics-service', api: API_URL }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ATHENA analytics-service stub on :${PORT}`);
});
