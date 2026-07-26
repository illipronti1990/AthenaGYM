# Deploy agora (sessão guiada)

Código já está no GitHub: https://github.com/illipronti1990/AthenaGYM

Arquivos locais de produção (gitignored) já gerados:
- `apps/api/.env.production.local`
- `apps/web/.env.production.local`

---

## A) Conta Render (API) — 5 min

1. Abra: https://dashboard.render.com/login  
2. Entre com **GitHub** (mesmo usuário do repo).  
3. **New → Blueprint**  
4. Selecione o repo **AthenaGYM**  
5. Blueprint Path: `render.yaml`  
6. Preencha as variáveis pedidas (copie de `apps/api/.env`):

| Variável | De onde copiar |
|----------|----------------|
| `SUPABASE_URL` | `apps/api/.env` |
| `SUPABASE_ANON_KEY` | `apps/api/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | `apps/api/.env` |
| `SUPABASE_JWT_SECRET` | Supabase → Project Settings → API → JWT Secret |
| `CORS_ORIGINS` | deixe `http://localhost:3000` por enquanto (atualiza depois) |
| `PASSWORD_RESET_REDIRECT` | `http://localhost:3000/login` por enquanto |

7. **Apply** / Deploy  
8. Copie a URL da API (ex.: `https://athena-api-xxxx.onrender.com`)

Teste: `https://SUA-API.onrender.com/api/v1/health`

---

## B) Conta Vercel (site) — 5 min

1. Abra: https://vercel.com/login  
2. Entre com **GitHub**  
3. **Add New… → Project** → importe **AthenaGYM**  
4. Configure:
   - **Root Directory:** `platform/apps/web` (Edit → selecione a pasta)
   - Framework: Next.js
5. Environment Variables (Production):

| Key | Valor |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | igual ao do `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | igual ao do `.env.local` |
| `NEXT_PUBLIC_API_URL` | `https://SUA-API.onrender.com/api/v1` |
| `NEXT_PUBLIC_DEV_AUTH` | `false` |
| `NEXT_PUBLIC_GYM_INSTAGRAM` | `https://www.instagram.com/athenagym.oficial/` |

6. **Deploy**  
7. Copie a URL do site (ex.: `https://athena-gym.vercel.app`)

---

## C) Ajustes finais (obrigatório)

### Render
Atualize e faça Redeploy:
- `CORS_ORIGINS` = `https://SEU-APP.vercel.app`
- `PASSWORD_RESET_REDIRECT` = `https://SEU-APP.vercel.app/login`

### Supabase
Authentication → URL Configuration:
- **Site URL:** `https://SEU-APP.vercel.app`
- **Redirect URLs:** adicione `https://SEU-APP.vercel.app/**`

### Local (opcional)
```bash
cd platform
node scripts/prepare-prod-env.mjs https://SUA-API.onrender.com https://SEU-APP.vercel.app
```

---

## D) Me avise

Quando terminar A e B, me mande:
1. URL da API (Render)
2. URL do site (Vercel)

Eu valido health, CORS e te digo o próximo ajuste fino.
