# ATHENAS GYM — App Mobile (Flutter) · Sprint 11.0

Scaffold do aplicativo do aluno. A UI completa será implementada nas próximas iterações;
a API já está em `cloud/api`.

## Telas planejadas

- Splash Screen
- Login
- Home
- Meu Treino
- Evolução
- Frequência
- Financeiro (PIX)
- Agenda
- Notificações
- Perfil / Configurações

## Criar o projeto

```bash
flutter create athenas_gym_app
cd athenas_gym_app
```

## Endpoint

```
API_BASE=http://127.0.0.1:8000
POST /auth/login  { "usuario": "aluno", "senha": "123456" }
GET  /alunos/{matricula}
GET  /alunos/{matricula}/treino
GET  /notificacoes
```

## Arquitetura alvo

```
Flutter App ──► FastAPI ──► Sync JSON (Excel) / SQL futuro
Excel ERP   ──► modPortal.Sincronizar() ──► Sync/portal_export.json
```
