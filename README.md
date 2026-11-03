# RPG System

Sistema web para apoiar sessões de RPG entre amigos, reunindo fichas de personagens e ferramentas para o mestre. O projeto está em desenvolvimento e utiliza JavaScript no navegador, Node.js, Express e Socket.IO, com persistência local em arquivos JSON.

## Objetivo

Facilitar a consulta e a atualização das informações durante as partidas: acompanhar personagens, organizar inimigos e NPCs, distribuir itens e poderes e resolver rolagens e dano com sincronização entre as páginas.

## Conteúdo atual

- Cadastro e login de jogadores, com seleção, criação e exclusão de personagens.
- Ficha com vitais, atributos, perícias, inventário em grade, magias e habilidades.
- Painel do mestre com resumo dos jogadores, biblioteca e batalha de figurantes, catálogo de loot e gerenciamento de poderes.
- Rolagens de dados, aplicação de dano e opção de desfazer a última aplicação conforme as regras do servidor.
- Edição e enquadramento de imagens, salvamento em JSON e rotinas de backup da campanha.
- Testes automatizados de regras, interface simulada e integração com servidor temporário.

## Desenvolvimento com IA e aprendizados

Este projeto nasceu para ser usado nas minhas partidas de RPG entre amigos. A prioridade foi chegar a um sistema útil e funcional, por isso a produção e o resultado tiveram mais peso do que aprender a escrever cada parte do código manualmente.

A implementação foi conduzida principalmente com auxílio de IA, que atuou na linha de frente da escrita e alteração do código. Meu papel foi definir as necessidades, orientar as mudanças, avaliar os resultados e organizar a evolução do projeto. Não apresento este repositório como um trabalho inteiramente escrito à mão nem como demonstração de domínio de todas as tecnologias utilizadas.

Os principais aprendizados até aqui foram:

- **Git e GitHub:** versionar alterações, entender commits e enviar o histórico ao repositório remoto.
- **Organização do código:** adquirir uma noção básica de separar arquivos e responsabilidades.
- **Documentação:** registrar decisões, instruções de uso, mudanças e problemas encontrados.
- **Uso de IA no desenvolvimento:** transformar necessidades em pedidos claros, fornecer contexto, revisar resultados e solicitar correções.
- **Administração do projeto:** definir prioridades, dividir o trabalho em etapas e acompanhar as entregas conforme o uso real.

O aprendizado de programação continua em andamento. A existência de uma funcionalidade no sistema não significa que eu já saiba implementá-la sozinho; o repositório registra tanto o produto em construção quanto minha experiência de conduzir um projeto com apoio de IA.

## Como executar

Requisitos: Git, npm e uma versão compatível do Node.js. A referência do projeto é **Node.js 24.21.0**, registrada em `.nvmrc`; as faixas aceitas estão em `package.json`.

```bash
git clone https://github.com/vitubeck007/RPG-System-Public.git
cd RPG-System-Public
npm ci
npm start
```

Acesse no navegador:

| Página | Endereço local |
| --- | --- |
| Login e cadastro | http://localhost:3000/login |
| Seleção de personagem | http://localhost:3000/selecao |
| Ficha do personagem selecionado | http://localhost:3000/ |
| Painel do mestre | http://localhost:3000/mestre |

O servidor usa a porta `3000` por padrão, configurável pela variável de ambiente `PORT`. Execute os comandos na raiz do projeto e encerre o servidor com `Ctrl+C`.

**Acesso do mestre:** o painel e suas ações atualmente funcionam sem chave. Quem tiver acesso ao endereço do servidor poderá usar essas funções. O login dos jogadores continua obrigatório para suas fichas; considere essa diferença antes de expor o servidor na internet.

Os dados locais de jogadores, campanha, catálogos e imagens enviadas não acompanham o repositório. O servidor cria a estrutura necessária durante o uso. Alguns recursos visuais dependem de serviços externos por CDN.

## Como testar

Instale também as dependências de desenvolvimento com `npm ci`. Para executar todos os arquivos de teste:

```bash
npm test
```

O comando executa um arquivo por vez e configura um prazo de 60 segundos por teste. A suíte completa pode levar alguns minutos. Os testes de integração usam cópias temporárias e registros próprios, separados dos dados reais da mesa.

Para uma verificação focada, por exemplo na estabilidade do servidor:

```bash
node --test testes/estabilidade.test.js
```

Os testes com JSDOM simulam a interface; não substituem a conferência visual em navegadores e dispositivos reais.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `server.js` | Entrada do servidor HTTP e dos eventos de comunicação |
| `servidor/` | Módulos de regras, persistência, autenticação e imagens |
| `ferramentas/` | Utilitários e exemplos auxiliares de desenvolvimento |
| `JS/` e `CSS/` | Comportamento e apresentação da ficha |
| `login/` | Acesso e seleção de personagens |
| `mestre/` | Páginas e ferramentas do mestre |
| `servidor/personagem.js`, `servidor/campanha.js`, `servidor/entregas.js` | Dados de personagens, campanha e entregas |
| `testes/` | Testes automatizados e auxiliares |
| `servidor/campanha.js` | Comandos de backup e restauração da campanha |
| `documentacao/` | Guia de operação e histórico das alterações |

## Próximos passos

Prioridades propostas para a continuidade do projeto:

1. Validar os fluxos principais em uma partida real, incluindo reconexão e edição simultânea.
2. Conferir responsividade, navegação por teclado e legibilidade em telas menores.
3. Ajustar os pontos encontrados no uso e manter os testes alinhados às regras atuais.
4. Definir o controle de acesso do mestre antes de ampliar a exposição do sistema.

Para detalhes de operação, manutenção e persistência, consulte [Informações importantes](documentacao/INFORMACOES-IMPORTANTES.md). O [Patch Log](documentacao/PATCH-LOG-REMODELACAO-VISUAL.md) registra o histórico das alterações.

## Publicação

Este repositório público reúne uma versão selecionada do projeto, com histórico iniciado do zero. Contas, personagens, campanhas, catálogos preenchidos, uploads e relatórios gerados permanecem fora do versionamento. O desenvolvimento é mantido separadamente; versões revisadas são publicadas aqui.
