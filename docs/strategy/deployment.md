# Deployment Strategy

## Local
- Docker compose: postgres + api + web.
- Or run: db -> api -> web with env vars.

## Optional Cloud
- Web: Vercel
- API: Render/Fly
- DB: Supabase/Neon

## Env Vars
- DATABASE_URL
- JWT_SECRET or SESSION_SECRET
- STORAGE_DIR
- LLM_API_KEY (optional)
