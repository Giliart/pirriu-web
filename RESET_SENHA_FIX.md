# Correção da rota de Nova Senha

Mantida apenas a rota pública:

app/(public)/nova-senha/page.tsx

Removidas rotas duplicadas que causavam conflito no Next.js:

app/nova-senha
app/(public)/seguranca

URL correta:

/nova-senha

No Supabase, use Redirect URLs:

https://pirriu.app/nova-senha
https://pirriu.app/**
http://localhost:3000/nova-senha
http://localhost:3000/**
