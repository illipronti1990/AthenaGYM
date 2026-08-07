/**
 * G-17 k6 smoke — 50 VU against health + metrics.
 *
 *   k6 run -e BASE_URL=https://api.movvoerp.com.br/api/v1 platform/tests/load/smoke-50vu.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, {
    'health status 200/503': (r) => r.status === 200 || r.status === 503,
  });

  const cache = http.get(`${BASE}/health/cache`);
  check(cache, {
    'cache health responds': (r) => r.status === 200 || r.status === 503,
  });

  const metrics = http.get(`${BASE}/metrics`);
  check(metrics, {
    'metrics 200': (r) => r.status === 200,
  });

  sleep(0.3);
}
