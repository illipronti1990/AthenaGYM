/**
 * G-17 k6 — check-in burst.
 *
 *   k6 run -e BASE_URL=http://localhost:3001/api/v1 \
 *     -e ACCESS_TOKEN=… -e COMPANY_ID=… \
 *     -e CHECKIN_CPF=52998224725 \
 *     platform/tests/load/checkin-burst.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const TOKEN = __ENV.ACCESS_TOKEN || '';
const COMPANY = __ENV.COMPANY_ID || '';
const CPF = __ENV.CHECKIN_CPF || '00000000000';

export const options = {
  scenarios: {
    burst: {
      executor: 'constant-arrival-rate',
      rate: 40,
      timeUnit: '1s',
      duration: '45s',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.15'],
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  if (COMPANY) headers['X-Company-Id'] = COMPANY;

  const res = http.post(
    `${BASE}/operations/checkin`,
    JSON.stringify({ cpf: CPF, source: 'k6-g17' }),
    { headers },
  );

  check(res, {
    'check-in status acceptable': (r) =>
      [200, 201, 400, 401, 403, 404, 409, 422].includes(r.status),
  });

  sleep(0.05);
}
