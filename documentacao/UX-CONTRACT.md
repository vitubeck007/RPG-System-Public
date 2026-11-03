# UX Contract

Contrato da rodada visual de 30/10/2026. Registra o comportamento das superfícies tocadas e os donos existentes; não declara toda a aplicação migrada.

## Product context

Mestre e jogadores consultam a campanha em português brasileiro. Prioridade de 60% usabilidade e 40% apresentação. Datas do domínio seguem as fontes existentes; números apresentados nesta rodada usam `pt-BR`. Meta de acessibilidade: WCAG 2.2 AA, sem certificação nesta entrega.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Permissões e identidade | `documentacao/INFORMACOES-IMPORTANTES.md`, `server.js`, `acesso.js` | Guia mantido e servidor | 2026-10-30 |
| Catálogo e persistência de itens | `mestre/JS/loot.js`, `campanha.js` | Implementação do fluxo e domínio | 2026-10-30 |
| Exclusão e backup | `documentacao/INFORMACOES-IMPORTANTES.md` | Guia mantido | 2026-10-30 |
| Direção visual e público | Pedido atual, `documentacao/ANALISE-UI-UX-DESIGN-GERAL.txt` | Decisão explícita e guia mantido | 2026-10-30 |

## Visual contract

`DESIGN.md` explica os valores canônicos de `CSS/rpg-ui.css`. `JS/interface.js` possui a paleta e o aplicador do tema de itens. `mestre/JS/aparencia.js` adapta os campos existentes, sem converter valores persistidos. Tema escuro; cores forçadas e movimento reduzido mantêm as alternativas do sistema.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Select nativo em `mestre/JS/aparencia.js` e HTML; tema em `CSS/rpg-ui.css` | DESIGN.md | native; base-select temático onde suportado, fallback do SO | Teclado, abertura do popup e troca de cor no navegador |
| Form | `validarCamposMestre`, `protegerEditorMestre` em `mestre/JS/comum.js` | Guia mantido e validadores existentes | Editor de item/baú/poder; preservar campos em falha | `testes/loot-card-item.test.js`, `testes/protecoes-ux-etapa-2.test.js` |
| Scrollbar | `CSS/rpg-ui.css` | DESIGN.md | Global; gutter local para geometria | Estilos computados no navegador |
| Toast | `toast` em `mestre/JS/comum.js`; ficha em `JS/ui.js` | Primitivas existentes por superfície | info, success, error; sem novo emissor | Teste focado de falha no salvamento |
| CRUD | `mestre/JS/loot.js` e comandos existentes | Guia mantido e servidor | Criar/editar mantém catálogo; excluir exige confirmação existente | Testes de Loot e edição no navegador temporário |

## Dataset navigation

Catálogo de itens: filtros locais sobre a coleção recebida, grade com rolagem natural. A rodada não muda a API ou introduz paginação fictícia. Busca, tipo e aba mantêm o contexto da sessão pelo dono existente (`guardarContextoMestre`); esta é a exceção à URL para esta interface. Listas grandes precisam de avaliação própria antes de migrar o contrato.

Busca usa o evento existente da página. Limpar remove o termo imediatamente, reaplica o filtro e restaura o foco no input. Restaurar uma busca da sessão também deve mostrar o botão de limpar.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|---|
| Criar/editar item | Novo/Editar → Salvar | Bloqueio existente durante envio | Catálogo, editor fechado somente após confirmação | Card atualizado e toast existente | Manter editor e valores; erro existente | Reutilizar dono existente; novos controles não roubam foco | `mestre/JS/loot.js` |
| Escolher cor | Select Cor do item | Atualização local imediata | Permanecer no editor | Prévia do mesmo card | Valor desconhecido preservado; prévia neutra | Select permanece focado | `mestre/JS/aparencia.js` |
| Cancelar editor | Cancelar | Confirmação existente se houver alterações | Catálogo | Sem salvar | Rascunho pelo dono existente | Fluxo existente | `mestre/JS/comum.js` |
| Consultar ocupação | Summary do card | Nenhum envio | Mesmo card expandido | Grade e dimensões em texto | Não aplicável | Summary nativo | `mestre/JS/loot.js` |

## Navigation and responsive behavior

Não alterar rotas, seleção de personagem ou regras de batalha. Editor em coluna própria no desktop e abaixo do catálogo em tela estreita. Menus ancorados fora do fluxo; nomes e descrições quebram linha. Campos opcionais vazios não geram blocos no card. Imagem ausente ou inválida mantém o ícone e sua área reservada.

## Overlays and feedback

Reutilizar `RPGUI` e os mecanismos de rascunho do mestre. `RPGUI.confirmar` centraliza descarte e exclusão, substituindo confirmações nativas do navegador e confirmação em dois cliques no mesmo botão. Retorna uma promessa; nenhuma mutação é disparada antes da resposta positiva. Ações em andamento bloqueiam repetição pelo dono `executarAcaoMestre`. Cancelar/Escape preservam os campos e restauram o foco. O dialog nativo pode sobrepor o editor de Figurantes sem fechar o formulário abaixo; os valores anteriores de inert e rolagem são restaurados.

`RPGUI.validarFormulario` mantém erros textuais junto aos campos e associa `aria-invalid`/`aria-describedby`, focando o primeiro inválido. Login, seleção e ajuste não usam mais bolhas de `reportValidity()`. Toasts do mestre exibem confirmação de sucesso e orientação, além dos erros e eventos.

## Async and resilience

Nenhuma escrita nova no servidor. Falhas continuam preservando os campos do editor. Não repetir automaticamente operações de resultado incerto. Prévia e alteração de tema são locais, sem timers de rede ou atualização de arquivos de campanha.

## Verification scope

Testes focados de itens, prévia, busca e regressões de UX. Navegador real sobre cópia temporária; dados reais da campanha não são alterados. Auditoria estática é evidência auxiliar: listeners externos ao HTML e regras CSS compartilhadas exigem triagem manual. Pendências de migração e limitações ficam no relatório da rodada.

Ajuste solicitado: itens e poderes abrem em modal centralizado, por RPGUI, com fundo inativo e desfocado. Escape segue a mesma proteção de descarte do botão Cancelar. O dialog nativo de enquadramento de imagens tem precedência no teclado. Fechar/salvar restaura fundo, rolagem e foco. O aviso Público abaixo de Efeitos ocupa a largura disponível ao lado de um checkbox fixo.

## Imagens da ficha de jogador

O bloco de imagem na biografia da ficha reutiliza `EditorRetrato` de `JS/editor-imagem.js`, com Foto/Retrato independentes e lápis sobre a prévia. `perfil.avatar` guarda a foto e `perfil.avatarRetrato` o recorte quadrado, derivado da foto atual. A ficha e o mestre usam o recorte nas miniaturas, com fallback para a foto. O clique na imagem abre a foto completa; o menu + reúne câmera e lápis; a câmera pede o nome com extensão de uma imagem em `imagens/players/`; não há campos de link nem botão Alterar. As alterações aplicadas no editor são salvas automaticamente. Cancelar o editor de enquadramento mantém a imagem anterior.

A ampliação utiliza `perfil.avatarOriginal`, preservado ao enquadrar Foto ou Retrato. Sem esse campo, perfis antigos usam `avatar` como fallback; selecionar a foto pelo nome define novamente a origem. A imagem ampliada ocupa a área de visualização, sem limitar a apresentação ao tamanho da miniatura.
