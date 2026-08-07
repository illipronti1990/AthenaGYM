# ATHENA AI Service (stub)

Microserviço separado para o assistente IA. Enquanto o stub roda aqui, o Nest já expõe `POST /api/v1/ai/chat`.

```bash
pnpm --filter @movvo/ai-service dev
# GET  http://localhost:3010/health
# POST http://localhost:3010/chat  { "question": "..." }
```
