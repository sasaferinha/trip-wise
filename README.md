# Tripwise

MVP visual e funcional de um aplicativo de planejamento financeiro e comunidade de viagens.

## Executar localmente

Com o Node.js instalado, execute os comandos a partir da pasta em que deseja guardar o projeto:

```sh
git clone https://github.com/sasaferinha/trip-wise.git
cd trip-wise
node server.mjs
```

Depois, abra <http://127.0.0.1:4173>. Se o repositório já estiver clonado, basta entrar na pasta e executar `node server.mjs`.

O servidor local utiliza somente módulos nativos do Node.js. Este repositório não possui `package.json`, portanto não há uma etapa de `npm install` para essa prévia.

### Interface local e APIs

`server.mjs` serve os arquivos da interface, mas não executa os handlers da pasta `api/`. Por isso, iniciar esse servidor não habilita as chamadas de busca de viagem ou da Trip AI.

| Recurso | Implementação | Configuração existente |
| --- | --- | --- |
| Interface local | `server.mjs` e arquivos HTML, CSS e JavaScript | `node server.mjs`, na porta `4173` |
| Busca integrada | `api/trip-search.mjs` | Rota `/api/trip-search` no ambiente configurado por `vercel.json` |
| Conversa com a Trip AI | `api/trip-ai.mjs` | Rota `/api/trip-ai` e variável de ambiente `ANTHROPIC_API_KEY` no servidor |

Configure a chave da Trip AI no ambiente do servidor, sem incluí-la nos arquivos JavaScript enviados ao navegador. Quando a variável está ausente, uma requisição POST ao handler recebe HTTP `503` e a mensagem de que a Trip AI ainda não foi configurada.

## Incluído no MVP

- Landing page e navegação responsiva
- Criação de viagem com prévia dinâmica e persistência local
- Dashboard financeiro com estimativas e etapas do planejamento
- Seleção de hospedagens simuladas
- Feed social com curtidas e roteiros salvos
- Perfil do viajante, estatísticas e conquistas
- Layout mobile-first com adaptação para desktop

## Evolução Trip AI

A branch `trip-ai-intelligence` adiciona uma base para a Trip AI evoluir de chatbot simples para consultor de viagem: orçamento, roteiro, comparação, checklist, perfil e níveis de confiança.
