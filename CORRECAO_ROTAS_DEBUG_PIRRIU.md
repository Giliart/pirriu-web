# Correção API rotas PIRRIU

- API aceita `coordinates` e `points`.
- Divide rotas grandes em blocos de 10 pontos.
- Simplifica geometria da ORS para reduzir peso no App.
- Salva cache em `route_cache`.
- Retorna fallback se a ORS falhar.

Após deploy, testar:
`https://pirriu.app/api/routes/calculate`
