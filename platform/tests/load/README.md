# k6 load scripts — Sprint G-17

Requires [k6](https://k6.io/docs/get-started/installation/).

```bash
export BASE_URL=http://localhost:3001/api/v1

# Smoke 50 VU
k6 run platform/tests/load/smoke-50vu.js

# Login + dashboard ramp to 500 VU
k6 run -e LOGIN_EMAIL=… -e LOGIN_PASSWORD=… platform/tests/load/scenario-500vu-login-dashboard.js

# Check-in burst (p95 < 800ms threshold)
k6 run -e ACCESS_TOKEN=… -e COMPANY_ID=… -e CHECKIN_CPF=… platform/tests/load/checkin-burst.js
```

SLA docs: `Documentacao/MOVVO_SCALE_G17.md`.
