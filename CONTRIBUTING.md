# Como contribuir com o Tripwise

O Tripwise reúne planejamento financeiro e uma comunidade de viagens. Correções de comportamento, melhorias de acessibilidade, ajustes para celular e documentação são boas contribuições para este MVP.

## Antes de começar

Leia o [README](README.md) para conhecer as funções atuais e como abrir a prévia local. Consulte as issues existentes para conferir se o problema ou a proposta já foi registrado.

Para uma funcionalidade nova ou uma mudança maior de experiência, descreva primeiro o problema que deseja resolver e um exemplo de uso. Isso ajuda a alinhar o escopo antes da implementação.

## Relatar um problema

Em **Issues → New issue**, escolha **Relatar um problema** e informe:

- Os passos necessários para reproduzir o comportamento.
- O resultado esperado e o que aconteceu.
- Se usou a prévia estática local ou um ambiente com as APIs configuradas.
- O navegador, o dispositivo e, quando ajudar, uma captura da tela.

Para sugerir uma função, use **Sugerir uma melhoria** e explique o benefício para quem planeja a viagem.

## Preparar uma alteração

1. Crie um fork se você não tiver acesso de escrita ao repositório.
2. Crie uma branch com um nome que descreva a mudança, como `fix/orcamento-mobile`.
3. Mantenha o pull request focado em um problema ou melhoria.
4. Use mensagens de commit que expliquem o que foi alterado.

Para conferir a interface local, execute na raiz do projeto:

```sh
node server.mjs
```

Abra <http://127.0.0.1:4173>. Esse servidor entrega apenas arquivos estáticos: os handlers de `api/` precisam de um ambiente que os execute, conforme a [explicação de interface local e APIs](README.md#interface-local-e-apis).

## Verificar e abrir o pull request

Exercite o fluxo afetado pela mudança. Para ajustes visuais, confira a página em uma tela de computador e em uma largura de celular. Se a mudança envolver dados salvos no navegador, use dados de exemplo e confira o comportamento depois de recarregar a página.

Na descrição do pull request, explique:

- Qual problema ou necessidade motivou a mudança.
- O que mudou para quem usa ou mantém o projeto.
- Como outra pessoa pode verificar o resultado.
- Quais verificações você fez e o que ainda depende de outro ambiente.

Use `Closes #numero` quando o PR resolver uma issue existente. Acrescente capturas quando elas ajudarem a entender uma alteração visual. Inclua somente os arquivos necessários à mudança e mantenha credenciais fora do repositório e das capturas.

Quando houver trabalho conjunto, registre a coautoria no commit com a identidade que cada colaborador utiliza no GitHub.
