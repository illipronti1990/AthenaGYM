/**
 * G-17 k6 — 500 VU login + dashboard scenario.
 *
 * Expects:
 *   BASE_URL — API base (…/api/v1)
 *   LOGIN_EMAIL / LOGIN_PASSWORD — optional; without them hits public health + branding only
 *
 *   k6 run -e BASE_URL=http://localhost:3001/api/v1 \
 *     -e LOGIN_EMAIL=a@b.com -e LOGIN_PASSWORD=secret \
 *     platform/tests/load/scenario-500vu-login-dashboard.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const EMAIL = __ENV.LOGIN_EMAIL || '';
const PASSWORD = __ENV.LOGIN_PASSWORD || '';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, { 'health okish': (r) => r.status === 200 || r.status === 503 });

  let token = '';
  if (EMAIL && PASSWORD) {
    const login = http.post(
      `${BASE}/auth/login`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    check(login, { 'login 200/201': (r) => r.status === 200 || r.status === 201 });
    try {
      const body = login.json();
      token = body.accessToken || body.access_token || '';
    } catch {
      token = '';
    }
  }

  const headers = token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    : { Accept: 'application/json' };

  const dash = http.get(`${BASE}/dashboard`, { headers });
  check(dash, {
    'dashboard responds': (r) => [200, 401, 403, 404].includes(r.status),
  });

  const branding = http.get(`${BASE}/branding`);
  check(branding, { 'branding 200': (r) => r.status === 200 });

  sleep(0.5);
}
