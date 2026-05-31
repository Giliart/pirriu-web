# Correção da redefinição de senha

A tela pública agora está em:

app/nova-senha/page.tsx

Foram removidas rotas conflitantes:

- app/(portal)/seguranca
- app/(public)/seguranca
- app/(public)/nova-senha

No Supabase Auth configure:

Site URL:
https://pirriu.app

Redirect URLs:
https://pirriu.app/nova-senha
https://pirriu.app/**
http://localhost:3000/nova-senha
http://localhost:3000/**

Depois faça novo deploy na Vercel.
