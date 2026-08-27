# PIRRIU RC1 - redefinição de senha (SSR)

O fluxo foi ajustado para o padrão SSR recomendado pelo Supabase usando `token_hash` + `verifyOtp`.

## 1. Supabase > Authentication > Emails > Reset password

No botão/link do template de recuperação, use exatamente:

```html
<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nova-senha">
  Redefinir senha
</a>
```

Se o template premium tiver um botão existente, altere somente o `href` dele para o endereço acima.

Não use `{{ .ConfirmationURL }}` nesse botão para o fluxo SSR do Portal PIRRIU.

## 2. Supabase > Authentication > URL Configuration

Site URL:

```text
https://pirriu.app
```

Mantenha entre as Redirect URLs:

```text
https://pirriu.app/**
https://www.pirriu.app/**
https://pirriu.app/nova-senha
```

A rota `/api/auth/confirm` usa `SiteURL`, portanto não depende de adicionar manualmente cada callback, embora `https://pirriu.app/**` já cubra as rotas do domínio.

## 3. Fluxo final

```text
/login -> resetPasswordForEmail()
   -> email de recuperação
   -> /api/auth/confirm?token_hash=...&type=recovery
   -> verifyOtp()
   -> cookies de sessão SSR
   -> /nova-senha
   -> updateUser({ password })
   -> signOut()
   -> /login
```

## 4. Teste

Depois do deploy e da alteração do template, solicite um NOVO e-mail de redefinição. Links antigos podem já ter sido consumidos e não validam o fluxo novo.
