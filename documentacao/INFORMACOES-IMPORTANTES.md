# RPG System — Informações importantes

Consolidado em 20/10/2026. Projeto: `RPG-System-Public`.

## Documentação mantida

- **ANALISE-UI-UX-DESIGN-GERAL.txt:** diagnóstico anterior à remodelação, diretrizes aprovadas e limites de avaliação.
- **PATCH-LOG-REMODELACAO-VISUAL.md:** histórico consolidado da remodelação e dos 21 ajustes de usabilidade.
- **INFORMACOES-IMPORTANTES.md:** este guia de operação, estrutura, manutenção e testes.

Relatórios de sprints/etapas concluídos, capturas, log antigo de testes e guias redundantes foram substituídos por estes três arquivos. O diagnóstico histórico não é uma lista de bugs atuais. O Patch Log descreve implementação, não certifica todo o funcionamento.

## Iniciar e acessar

Use Node.js 24.21.0 (referência em `.nvmrc`). Também são compatíveis Node 22.22.2+, 24.15.0+ e 26+, conforme as dependências. A instalação recusa versões incompatíveis por `engine-strict`.

Na raiz do projeto, com Node.js/npm e as dependências instaladas:

```powershell
npm start
```

- Porta padrão: **3000**, substituível pela variável de ambiente `PORT`.
- `/login`: acesso/criação de conta, servido por `login/entrar.html`.
- `/selecao`: seleção/criação/exclusão de personagens, servido por `login/login.html`.
- `/`: ficha do personagem selecionado, em `index.html`.
- `/mestre`: Mesa; demais áreas em `/mestre/rolagem`, `/mestre/figurantes`, `/mestre/loot` e `/mestre/habilidades-magias`.
- `/mestre/inimigos` e `/mestre/npc` são caminhos compatíveis da área unificada de figurantes.
- Use **Ctrl+F5** se o navegador ainda apresentar arquivos visuais antigos.

O painel `/mestre` e suas ações funcionam sem chave. Qualquer pessoa com acesso ao endereço do servidor pode usar as funções do mestre. O login dos jogadores continua obrigatório para suas fichas.

## Rascunhos e navegação do mestre — 28/10/2026

- Os editores mantêm rascunhos no armazenamento local do navegador. Reabra o mesmo tipo de registro (ou Novo, para uma criação) e escolha Restaurar rascunho. Os campos restaurados só vão ao servidor quando você salvar. Alterações já confirmadas no servidor continuam sendo a referência ao abrir o editor.
- Salvar ou confirmar o descarte da edição limpa o rascunho correspondente. Enquanto a oferta de recuperação estiver pendente, escolha restaurar ou descartar para liberar os campos. A cópia depende do mesmo navegador/origem e de armazenamento disponível.
- Aba, busca e seleção de Figurantes são lembradas na sessão. Filtrar a lista não muda a ficha escolhida; Limpar filtro traz o card de volta. Use Carregar mais para consultar além dos primeiros 100 resultados.
- Em Rolagem, confira a lista completa de alvos junto do resultado antes de aplicar dano. Ela inclui os selecionados nas duas categorias.

## Rolagens do mestre — atualização de 26/10/2026

- Reinicie `node server.js` e use **Ctrl+F5** em `/mestre/rolagem` após atualizar. Há mudanças pontuais no backend, não apenas no CSS.
- Os seis dados instantâneos rolam ao clicar. **Quantidade de dados** começa em 1 e só afeta esses atalhos; não multiplica a expressão personalizada nem o dano por alvo.
- O campo personalizado aceita soma/subtração de grupos e valores fixos: `2d20+5+3d6+1`, `2d6-1d4-2` ou `20`. Limites: 300 caracteres, 40 termos, 999 dados no total, dados de até 1000 lados e cada modificador fixo de até ±100000. Não executa código nem aceita multiplicação/divisão/parênteses.
- **Atacar começa desligado.** Desligado: seleção amarela, nenhum dano. Ligado: seleção vermelha, toda rolagem aplica seu resultado aos alvos selecionados nas duas categorias. Durante o envio, os controles envolvidos ficam bloqueados para preservar o contexto do clique.
- Clique no card para selecionar/desmarcar. Os multiplicadores individuais são não negativos, aceitam decimais e não alteram o resultado original. O dano final arredonda para baixo, com produto decimal exato (por exemplo, 100 × 0,29 = 29).
- **Jogadores** mostra fichas conectadas; **Inimigos** reúne cópias em batalha e NPCs da mesa, mantendo compatibilidade com os alvos existentes. Trocar categoria não limpa seleção/multiplicadores. Alvos selecionados que saem da lista ficam identificados como indisponíveis e continuam desmarcáveis; o servidor não aplica dano em alvos ausentes.
- Imagem, HP e energia vêm de `master_listar_alvos`, com atualização pelos eventos existentes de jogadores, vitais e campanha. Os cards usam `mestre/JS/cartao-resumo.js`, compartilhado com a batalha, e os estilos dos resumos táticos.
- `master_rolar` aceita `{ expressao }` ou o contrato legado `{ componentes }`. `master_aplicar_dano` continua recebendo `rolagemId` ou valor manual. O total de uma rolagem vem do servidor. A mesma rolagem só causa dano uma vez: repetição idêntica reutiliza a resposta; seleção/multiplicadores divergentes são recusados. A proteção não depende apenas do botão desabilitado.
- O histórico fica recolhido; **Desfazer último dano** mantém a regra existente: somente a última aplicação e somente para HP que não mudou desde o ataque. O valor manual antigo pode ser feito diretamente como expressão fixa, sem um segundo formulário.
- Em timeout não há reenvio automático. Confira os vitais antes de repetir; a operação pode ter sido concluída. Dano nunca altera energia, não passa de HP zero e não atinge alvos não selecionados.

Conferência local: com fichas/figurantes fictícios, role os seis atalhos com Atacar desligado; use quantidade 3 e `2d20+5+3d6+1`; selecione dois jogadores e um inimigo com multiplicadores 0,5 / 1,5 / 3; alterne as categorias; ligue Atacar e role `20`; confira os danos 10 / 30 / 60 na ficha, na batalha e após reabrir os dados. Desligue Atacar e confirme que a seleção permanece, mas a próxima rolagem não causa dano. Teste também uma expressão inválida, um multiplicador negativo, o desfazer e uma largura de celular.

Teste focado novo: `node --test testes/rolagem-simples.test.js`. Regressões diretamente relacionadas: `testes/rolagem.test.js` e `testes/figurantes-cartoes.test.js`. Não é necessário executar a suíte inteira para esta conferência inicial.

## Estrutura e responsabilidades

| Local | Responsabilidade |
|---|---|
| `server.js`, `servidor/acesso.js` | Servidor Express/Socket.IO, acesso, rotas e eventos |
| `servidor/personagem.js` | Formatos/normalização dos dados do personagem |
| `JS/`, `CSS/`, `index.html` | Ficha, componentes e estilos do jogador |
| `login/` | Login e seleção |
| `mestre/` | Páginas, scripts e estilos do mestre |
| `servidor/comandos.js` | Convenção de comandos autenticados `master_*` |
| `servidor/campanha.js`, `campanha/` | Estado persistente da campanha e recuperação |
| `catalogo/` | Catálogos de habilidades, magias e itens |
| `servidor/entregas.js` | Caixa de entregas para os personagens |
| `servidor/batalha.js`, `servidor/rolagem.js`, `servidor/dano.js` | Regras de combate, rolagem e dano |
| `JS/regras.js` | Regras compartilhadas entre cliente e servidor |
| `players/<player>/<nomePasta>/` | Arquivos de cada personagem |
| `servidor/figurantes.js`, `Figurante/` | Organização das cópias individuais de NPCs/inimigos |
| `testes/` | Testes e auxiliares de simulação/preview |

### Identidade e salvamento do personagem

- Use sempre `CHARACTER.player` + `CHARACTER.nomePasta`. Nome visível, índice da lista e socket id não substituem essa identidade.
- Fluxo: login → lista do player → seleção → `carregar_personagem` → `personagem_carregado` → preenchimento do `STATE`.
- Vitais: `hp`, `vigor` e `sanity`, cada um com `{ current, max }`; persistência em `status.json`.
- Perícias: `STATE.skills` corresponde a `pericias.json`; preservar a conversão para os identificadores usados pelo JSON.
- Poderes continuam separados em `habilidades.json` e `magias.json`.
- Inventário/equipamento usam o formato atual de `inventario.json`; não reintroduzir nomes legados de arquivos sem conferir o código.
- Reutilize os salvamentos centrais e a validação do servidor; não crie gravações paralelas por nome ou personagem fixo.
- O mestre pode ajustar vitais pelo fluxo existente: o servidor também grava o status e envia o delta à ficha. Não vale a afirmação antiga de que o mestre nunca provoca gravação de status.

### Configuração e conexão

- `config.json` e `sync_config` controlam `AtivarRiquezas`, `UsarEx`, `AtivarSlotMochila` e `AtivarMana`.
- Vigor da ficha depende de `AtivarMana`. A **Energia dos figurantes** é outro recurso; não unificar suas regras só por causa do nome.
- O painel carrega a campanha automaticamente ao conectar; não armazena token do mestre.
- Não foi implementada conexão única entre páginas. Mestre e jogador mantêm sessões/conexões separadas.
- Indicador online representa a conexão com o servidor. As ações continuam validando formato, limites e identificador contra duplicação.

## Figurantes e entregas

```text
Figurante/
  Inimigos/<nome>_ini_<id>/figurante.json
  NPCs/<nome>_npc_<id>/figurante.json
```

- `campanha/inimigos.json` e `campanha/npcs.json` continuam sendo a referência interna. Os arquivos individuais são cópias organizadas, reconstruídas ao iniciar/restaurar: **edite pelo painel**, pois alterações manuais nessas cópias podem ser sobrescritas.
- Renomear pelo painel atualiza a pasta. A exclusão remove o JSON gerenciado e a pasta se estiver vazia; arquivos extras do usuário são preservados.
- Inimigos mantêm a vida do modelo em `hpMax` e notas em `nota`; NPCs usam `hp: { atual, max }` e `notas`. Energia usa `{ atual, max }`.
- Poderes de catálogo adicionados ao figurante são cópias independentes. Criar um poder com a opção de salvar no catálogo o grava nesse catálogo imediatamente, mesmo se a ficha do figurante for cancelada depois.
- `cost.vital: "vigor"` é apresentado como energia para figurantes. **Usar** desconta esse custo no servidor e recusa energia insuficiente; não aplica dano/efeitos automaticamente. Outros custos antigos não recebem consumo automático nessa tela.
- Cada cópia em batalha mantém seus recursos independentemente do modelo.
- Arma opcional dos figurantes: `arma: { nome, icone, alcance, dano, categoria }` ou `null`. Configure em **Criar/Editar → Possui arma**. Ícones locais: `sword`, `axe`, `bow`, `staff`, `dagger`; categorias `leve`, `media`, `pesada`, `natural`, `outra`. Dano aceita a expressão de dados já usada no sistema ou um inteiro como `5`; não aplica dano automaticamente.
- A arma é salva no JSON do modelo (`campanha/inimigos.json` / `campanha/npcs.json` e cópia em `Figurante/.../figurante.json`) e copiada para `campanha/batalha.json` ao adicionar combatentes. Editar o modelo não modifica automaticamente cópias anteriores. Quando a arma diverge, a ficha de batalha oferece **Atualizar arma do modelo**, pelo comando autenticado `master_batalha_arma_modelo`: atualiza só aquela arma, mantendo HP, energia, notas e demais cópias. Também permite remover a arma quando o modelo está sem arma. Dados anteriores continuam válidos; o inventário dos jogadores não foi alterado.
- Reinicie `node server.js` depois de alterações no backend: atualizar a página não recarrega módulos Node. Foi encontrado um servidor iniciado às 20:26 executando código anterior ao suporte à arma, salvo às 20:45 de 20/10/2026. Essa versão descartava o campo. O editor agora exige a capacidade `recursos.armaFigurante` de `master_entrar` e verifica a arma na resposta do salvamento; incompatibilidades não geram confirmação de sucesso nem fecham o formulário preenchido.
- Biblioteca: figurantes começam recolhidos, com retrato maior (60 × 64 px), nome, vida/energia atuais e máximas e os seis atributos por extenso na mesma linha no desktop, além de **Mais ações** (inclui editar). Os dois vitais usam o texto **Atual / máximo**. Clique no nome/retrato/seta para expandir os recursos editáveis, arma, descrição, lore, notas e poderes. O estado aberto é preservado nas atualizações e mudanças de tipo, mas não após recarregar a página.
- Atributos no cabeçalho de batalha: **FOR, DES, INT, SAB, PRE, VON**, com o nome completo acessível e no tooltip; ausentes mostram `—`, zero continua `0`. Vida/energia mais estreitas mantêm barras, botões e edição. Vigor continua sendo o recurso de energia, não um sétimo atributo. Na biblioteca inimigos continuam usando `hpMax` (vida cheia do modelo, atual = máximo); NPCs usam seus valores atuais reais. Não há novos campos ou mudanças nas regras/JSONs.
- A ficha em batalha reúne identidade, vida/energia e **Mais ações** no cabeçalho. Marcar como derrotado/reviver fica nesse menu. A arma aparece em um bloco próprio; a coluna lateral tem painel de fundo, títulos em faixa e retratos arredondados maiores.
- Anotações de combate: ficam numa camada acima dos poderes, ancorada embaixo. Arraste a barra superior para cima/baixo ou clique em **Expandir/Recolher**. Com foco nessa barra, setas ajustam a altura e **Escape** recolhe. A altura é lembrada por combatente durante a página, inclusive após atualizações/salvamento; não é persistida no JSON nem após F5. O texto continua com salvamento automático independente. A camada é limitada à área dos poderes, sem cobrir arma/cabeçalho ou esticar a ficha.
- Cards **Comando tático**: biblioteca com descrição/lore/anotações e poderes expansíveis; batalha com coluna de resumos à esquerda e uma ficha completa ao lado, escolhida pelo retrato/nome. Recursos são editáveis por menos/mais ou digitando o valor atual; confirme com Enter ou saindo do campo.
- Inimigos na biblioteca também têm menos/mais: alteram `hpMax` do modelo (mínimo 1), sem modificar combatentes existentes. NPCs e cópias em batalha continuam ajustando `hp.atual`. Reinicie o servidor após atualizar o código para carregar `master_inimigo_hp`.
- Escala compacta somente nesta página: resumo em linha na coluna lateral, controles menores nos resumos e área ampliada para toque. Vida e energia da ficha ficam no cabeçalho e mantêm as barras. Não foi alterado o zoom do navegador nem o tamanho da ficha dos jogadores.
- Se uma cópia antiga não tiver imagem, o card procura a URL do modelo. Se a URL não carregar, exibe `/CSS/retrato-padrao.svg`; confira o endereço em **Editar ficha**. Uma foto válida própria da cópia continua sendo respeitada.
- Os botões **NPCs / Inimigos** filtram o tipo sem sair da aba atual. A busca também funciona na batalha. Até cinco resumos ficam centralizados verticalmente; acima disso, somente a lista ganha rolagem vertical, com cinco posições visíveis. Setas cima/baixo, Home/End alternam a seleção; esquerda/direita continuam compatíveis. Cada grupo lembra seu selecionado nesta página.
- No desktop, a Batalha ocupa a altura disponível da janela sem rolar o documento. Poderes longos têm sua própria rolagem dentro da ficha; notas e controles ficam acessíveis. Abaixo de 761 px, as áreas se empilham e a página pode rolar para manter a leitura em telas pequenas.
- Caídos têm **Excluir / Reviver** no retrato. A exclusão confirmada remove somente a cópia em combate, não o modelo da biblioteca. Reviver recupera ao menos 1 HP, respeitando a máxima; não enche a vida. **Limpar batalha inteira** remove todas as cópias dos dois tipos.
- NPCs também entram em batalha como cópias, com os recursos atuais do modelo; inimigos continuam entrando com a vida cheia. Os IDs das cópias são independentes dos IDs da biblioteca.
- Notas rápidas são salvas automaticamente em `campanha/batalha.json` → `combatentes[]` → `notasCombate`, até 2000 caracteres. `nota`/`notas` da biblioteca não são alteradas. A última gravação confirmada prevalece se dois mestres editarem a mesma nota.
- Falha ao salvar notas mantém o texto nesta página e oferece **Salvar notas novamente**. Aguarde “Salvo na batalha” antes de sair. Remover o combatente/limpar batalha também remove suas notas; o rascunho da página não substitui backup.
- Os cards usam `mestre/JS/figurantes-cartoes.js` e `mestre/CSS/figurantes-cartoes.css`; os editores continuam em `mestre/JS/figurantes.js`. Ícones de espada/bola de fogo estão no SVG local.
- Entregas de poderes/itens usam os fluxos existentes de caixa de entregas e confirmação da ficha; não substitua por escrita direta em arquivos de outro personagem.
- Publicar, entregar, liberar baú e recolher baú são ações diferentes. Não exponha dados privados do mestre em respostas gerais para jogadores.

## Rascunhos, falhas e recuperação

- Alterações da ficha ainda não confirmadas podem ter cópia no `localStorage`, por personagem e abertura da página, sem credenciais.
- Restaurar uma cópia é uma escolha explícita e pode substituir dados mais novos dos arquivos envolvidos. Não há resolução automática de conflitos.
- Limpar dados do site, impedir armazenamento ou usar outro navegador/dispositivo pode impedir a recuperação. O rascunho local **não é backup da campanha**.
- Texto de um poder ainda não adicionado fica no rascunho da página ao fechar/reabrir o editor; não confundir isso com recuperação persistente após fechar o navegador.
- Timeout não significa que o servidor desfez a ação. Em criação/exclusão/entrega/dano sem confirmação, confira o estado antes de repetir.

### Backup da campanha

O sistema mantém backups em `campanha/_backup/`, com limite atual de sete. Arquivos corrompidos podem ser preservados em `campanha/_corrompidos/`, com aviso; não apague esses diretórios numa limpeza de documentação.

Com o **servidor parado**:

```powershell
node servidor/campanha.js backups
node servidor/campanha.js restaurar NOME_DO_BACKUP
```

A restauração guarda o estado anterior antes de restaurar. Não presuma que o backup da campanha cobre todos os personagens, configurações e credenciais: antes de uma intervenção arriscada, faça cópia separada dos dados relevantes, incluindo `players/`, `campanha/`, `catalogo/` e `config.json`.

O **Desfazer dano** é mantido em memória; reiniciar o servidor elimina a possibilidade de desfazer a aplicação anterior por esse comando.

## Manutenção do front-end e segurança

- Base: `CSS/rpg-ui.css`; acesso: `CSS/acesso.css`; ficha: `CSS/ficha.css`; mestre: `mestre/CSS/painel-visual.css`.
- `JS/interface.js` reúne foco/modais, mensagens, espera HTTP limitada e componentes compartilhados de apresentação. Não contém o `STATE` do personagem.
- `mestre/JS/comum.js` reúne navegação, socket, `pedirAoServidor` e proteção dos editores. `mestre/JS/aparencia.js` alimenta os campos existentes de ícone/cor.
- Preserve IDs, atributos `data-campo`, ordem/dependências dos scripts e eventos quando alterar HTML.
- Não substitua fórmulas, formatos JSON, autenticação ou regras para resolver um problema visual.
- Use `textContent` para dados de usuário, nomes acessíveis nos botões e confirmação em ações destrutivas.
- Em modais, preserve foco, Escape, fundo inativo, rolagem e retorno ao controle de origem. Figurantes têm controle próprio de janelas empilhadas.
- Registre novos comandos autenticados pelo mecanismo existente, valide entradas no servidor e use o mesmo `acaoId` para repetir uma mesma ação quando o protocolo oferecer esse suporte. Há eventos legados; não presuma que todos usam o mesmo envelope.
- `campanha.ler()` devolve cópia. `campanha.ver()` expõe o estado vivo para consulta interna; não o altere diretamente. Gravações passam por `campanha.atualizar()`.
- Respeite as salas/versões públicas de dados. Dados privados do mestre não devem virar broadcast geral.
- Erros tratados não devem vazar pilhas internas. Mantenha os logs operacionais úteis; não esconda uma falha apenas parando de imprimir.
- Partes legadas da ficha/mestre ainda usam Tailwind/Font Awesome por CDN. Não há garantia de aparência completa sem esses serviços.

## Verificação local

`npm test` encontra todos os arquivos `testes/*.test.js`, aplica um limite de 60 segundos por teste e executa um arquivo por vez, para controlar a carga dos servidores e páginas temporários. Pode demorar mais que a execução paralela; uma falha no preparo de uma suíte cancela seus casos dependentes, sem significar que cada caso encontrou um defeito diferente.

Os testes de integração usam cópias temporárias sem os dados reais de `players/`, `campanha/` ou `catalogo/`; cada cenário cria seus próprios registros. As expectativas acompanham o painel sem chave, as confirmações atuais e o salvamento serializado.

Por preferência do usuário, executar apenas uma checagem básica por alteração, em proporção ao risco; as demais ficam para o teste local. Limpeza de documentação não exige rodar testes do jogo.

Um caso virtual básico:

```powershell
node --test testes/protecoes-ux-etapa-3.test.js
```

Outros arquivos focados existentes: `protecoes-ux-basico.test.js`, `protecoes-ux-etapa-2.test.js`, `figurantes.test.js`, `estabilidade.test.js` e `integracao.test.js`, dentro de `testes/`. Escolha o relevante, sem rodar tudo por padrão. `npm test` executa o runner geral e pode levar mais tempo.

Para a alteração mais recente dos cards, um único caso básico (servidor real em cópia temporária + DOM simulado):

```powershell
node --test testes/figurantes-cartoes.test.js
```

Conferência manual dos cards: abra `/mestre/figurantes` e use **Ctrl+F5**. Confira os três textos da biblioteca, expanda os poderes e adicione cópias de inimigos e NPCs. Na **Batalha**, alterne os tipos e selecione os resumos: somente a ficha escolhida deve aparecer à direita no desktop. Confira a centralização com 1, 3 e 5 resumos; adicione o sexto e role só a coluna para visualizar os resumos 2 a 6, sem mover o documento. Busque por nome, digite vida/energia e confira a barra da ficha; use os ícones dos poderes. Zere a vida e teste **Reviver** (1 HP). Exclua uma cópia e confira que o modelo permanece na biblioteca. Escreva uma nota, espere **Salvo na batalha** e recarregue para conferir a persistência. Confira também teclado e largura de celular. Remova as cópias fictícias ao terminar.

Conferência adicional da arma: reinicie o servidor, recarregue a página e confirme que a biblioteca começa recolhida. Expanda uma ficha, edite/salve a arma e reabra após F5. Em uma cópia antiga na batalha, use **Atualizar arma do modelo** e confira que só a arma muda, preservando HP, energia e notas. Para conferir a persistência completa, reinicie o servidor e reabra o mesmo figurante.

Para conferir apresentação em ambiente descartável:

```powershell
node testes/ajuda/preview-ui.js --ficha
```

Use a URL e as instruções do terminal; ao terminar, digite `sair`. Não dependa da cópia temporária para testar recuperação após encerrá-la: o helper a remove.

Checklist essencial, preferencialmente com dados fictícios:

1. Login, criação/seleção e exclusão de personagem descartável; recarregar e conferir a persistência.
2. Ajustar vitais/perícias, salvar e reabrir o mesmo personagem; não misturar identidades.
3. Mochila: buscar, abrir detalhes, alterar quantidade, equipar e descartar parcialmente; grade/lista/peso coerentes.
4. Grimório: filtrar, criar habilidade própria e editar descrição/anotações; magias entram por entrega do mestre, sem alterar o catálogo global.
5. Mestre: abrir diretamente sem chave; salvar/reabrir NPC/inimigo e conferir energia.
6. Entregas online/offline; baús liberados/recolhidos; privacidade de poderes e segredos.
7. Rolagem, alvo/multiplicador, dano/desfazer e sincronização com a ficha.
8. Interromper/reconectar o servidor com alteração pendente; ler o aviso e conferir antes de reenviar/restaurar.
9. Teclado e largura móvel, nomes/listas longas, janelas, foco, mensagens e dependências visuais.

**Limite conhecido:** os casos básicos virtuais das três etapas de UX passaram nas respectivas entregas. Não houve regressão completa da versão acumulada, validação integral em aparelhos físicos ou auditoria formal de acessibilidade. Logs antigos de testes não comprovam o estado atual; registre uma reprodução nova ao investigar um erro.

## Otimizações de execução — 27/10/2026

Figurantes também aceitam o campo próprio `defesa` (0–999; padrão 10). O formulário salva esse valor nos registros da biblioteca e nos JSONs individuais. Novas cópias de combate herdam a defesa do modelo e a mantêm em `campanha/batalha.json`; cópias já existentes continuam com seu próprio valor. O cabeçalho exibe DEF em combate e Defesa na biblioteca.

- Nos caminhos executados durante a sessão, aguarde `gravarJsonAsync()`, `trocarArquivoAsync()` e as variantes assíncronas de criação/carga do personagem. Os auxiliares síncronos permanecem compatíveis com inicialização e migração offline.
- Operações de carga, registro, salvamento, ajuste vital e exclusão são serializadas por personagem. Não confirme uma operação antes de sua gravação terminar. O desfazer também confere a vida esperada dentro dessa fila.
- A campanha continua sendo a referência. A sincronização individual compara o estado anterior em memória e grava somente inclusões/alterações; renomeações/exclusões removem apenas o JSON gerenciado. Inicialização, restauração e recuperação conferem todas as pastas.
- O mestre reconcilia cards por identidade. Recursos e notas não devem invalidar a estrutura inteira. Biblioteca oculta não é reconstruída; conteúdo recolhido é montado ao abrir.
- A lista de alvos compartilha consultas em andamento e atende invalidações posteriores. O avatar em memória é atualizado ao salvar o perfil ou recarregar explicitamente o personagem.
- O índice de busca do catálogo acompanha cada lista recebida. Ao mudar entradas por código, substitua a lista para invalidar o índice. Todas as entradas continuam acessíveis pela paginação de 40 resultados.

Checagem integrada executada e aprovada, com arquivos temporários e servidor isolado:

```powershell
node --test testes/otimizacao.test.js
```

Verificação manual após reiniciar o servidor e recarregar a página:

1. Em batalha, altere vida/energia, use um poder e confirme que seleção, notas e detalhes abertos permanecem estáveis. Confira a mudança em outra página do mestre.
2. Na biblioteca, expanda um figurante, edite, renomeie e reabra. Ao excluir um figurante descartável, confira que um arquivo extra colocado manualmente na pasta é preservado.
3. Na ficha, altere a quantidade de uma pilha e confira quantidade/peso. Busque poderes e percorra as páginas do catálogo.
4. Ajuste a vida pelo mestre, aplique dano e desfaça. Confira a ficha e os valores após recarregar.
5. Com um personagem descartável, desconecte a rede, edite um texto e reconecte. Confira o aviso de rascunho e a confirmação de salvamento.

Limite desta entrega: um cenário integrado aprovado; sem suíte geral, perfil de CPU/FPS no navegador ou validação em aparelho físico. Não use os tempos do DOM simulado como estimativa da fluidez real.


## Organização dos arquivos — 02/11/2026

- `servidor/`: módulos Node de autenticação, personagens, campanha, figurantes, batalha, dano, rolagens, comandos, entregas e imagens.
- `server.js`: ponto de entrada mantido na raiz; `npm start` e `node server.js` continuam funcionando.
- `JS/`, `CSS/`, `login/` e `mestre/`: interface do jogador e do mestre, com os endereços existentes.
- `documentacao/UX-CONTRACT.md`: regras de interação e comportamento da interface; `premium-ui.json` aponta para esse caminho.
- `ferramentas/remocao-fundo/`: utilitários Python opcionais; imagens de trabalho não acompanham a publicação.
- `players/`, `campanha/`, `catalogo/`, `Figurante/`, `imagens/` e `config.json`: dados locais mantidos nas localizações originais.
- README, manifesto e lock do npm, configurações de Git/Node, CODEX e DESIGN permanecem na raiz para descoberta pelas ferramentas.

Os comandos de manutenção agora usam `node servidor/campanha.js backups`, `node servidor/campanha.js restaurar NOME_DO_BACKUP` e `node servidor/imagens.js` (simulação de limpeza; `--aplicar` efetiva a remoção).
