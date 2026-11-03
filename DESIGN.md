---
version: alpha
name: RPG System
description: Arquivo de campanha em aço azulado e latão, com leitura tática antes de ornamentação.
colors:
  background: "#0b1118"
  surface: "#141d28"
  raised: "#1c2836"
  border: "#354555"
  text: "#e8edef"
  muted: "#a6b4c2"
  primary: "#d1b77c"
  on-primary: "#171a1c"
  danger: "#e795a1"
  success: "#8ec4a1"
typography:
  body:
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "15px"
    lineHeight: "1.6"
  title:
    fontFamily: 'Georgia, "Times New Roman", serif'
    lineHeight: "1.2"
rounded:
  DEFAULT: "12px"
  control: "8px"
  item: "10px"
spacing:
  small: "8px"
  medium: "12px"
  large: "16px"
  section: "24px"
components:
  item-card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
  item-feature:
    backgroundColor: "{colors.raised}"
  divider:
    backgroundColor: "{colors.border}"
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-danger:
    textColor: "{colors.danger}"
  status-success:
    textColor: "{colors.success}"
  search:
    textColor: "{colors.text}"
  search-clear:
    textColor: "{colors.muted}"
  dialog:
    backgroundColor: "{colors.surface}"
  scrollbar: {}
---

# RPG System — identidade visual

## Overview

**Referência:** um arquivo de campanha consultado durante a partida: fichas, inventário espacial e registros táticos. Aço azulado para a estrutura, latão envelhecido para navegação e decisões, cores de itens como identificação pessoal. A fantasia vem do conteúdo e dos títulos, sem molduras ornamentais competindo com números.

**Prioridade solicitada:** 60% UX / 40% UI. Primeiro localizar, ler e agir; depois expressão visual. Jogadores e mestre entre amigos, com consulta frequente em computador e uso possível em celular. Interface em português brasileiro; não há requisito de mercado japonês. Registro de produto, não de página promocional.

Preserva a direção aprovada em `documentacao/ANALISE-UI-UX-DESIGN-GERAL.txt`: azul escuro, dourado suave, títulos serifados, cabeçalho compacto e mochila tetris. Este arquivo consolida essa identidade, sem substituir decisões de domínio.

**Assinatura:** cada item recebe uma pequena família tonal. Fundo, retrato, características, divisórias e textos auxiliares pertencem à mesma cor. O dourado continua reservado ao sistema e ao item padrão; vermelho escolhido para um item não significa exclusão ou erro.

## Colors

`CSS/rpg-ui.css` é a fonte canônica em execução (modelo B). O frontmatter espelha seus valores; não gera CSS. Evitar novas cores literais em componentes quando há um papel semântico existente.

| Papel | Token em execução | Consumidores |
|---|---|---|
| Fundo / painel / elevação | `--rpg-bg`, `--rpg-surface`, `--rpg-raised` | Ficha, acesso, mestre, menus |
| Borda | `--rpg-line` | Painéis, campos, separadores |
| Texto / secundário | `--rpg-text`, `--rpg-muted` | Conteúdo e orientação |
| Ação / foco | `--rpg-gold`, `--rpg-on-gold` | Botões principais, navegação, foco |
| Erro / sucesso | `--rpg-danger`, `--rpg-success` | Avisos e validação, com texto |
| Rolagem | `--rpg-scroll-*` | Documento e todos os painéis com overflow |
| Matiz de item | `RPGUI.coresItens` → `RPGUI.aplicarTemaItem` → `--item-base-from/to` | Card e prévia do editor |
| Superfícies do item | `--item-start/end/raised/line/text/muted/accent` | Regras `.rpg-item-theme` e `.loot-item-*` |

O tema de item mistura as sementes existentes com o fundo escuro: 58% no início e 45% no fim. Superfícies internas misturam 88% do início com 12% do texto; bordas e textos recebem tintas claras do próprio matiz. O item padrão continua neutro. Valores personalizados antigos são preservados nos dados; sem correspondência na paleta, catálogo e prévia usam apresentação neutra identificada como personalizada.

Os seletores Tailwind existentes são compatibilidade legada. Mudanças novas consomem os tokens CSS; não criar outra paleta independente. Sem tema claro nesta etapa. Em cores forçadas, manter as barras de rolagem do sistema; contrastes não equivalem a certificação completa de acessibilidade.

## Typography

Georgia, com alternativas locais, para títulos e nomes; Inter quando disponível e fontes do sistema para leitura, campos e controles. Nenhuma fonte nova é carregada pela rede. Usar algarismos tabulares em dados, vitais e quantidades. Descrições dos itens: 13px/1.6; nomes: 20px/1.2; rótulos: 12px. Não usar itálico como padrão de orientação.

## Layout

Mestre com largura máxima de 1400px e margens internas de 32px, reduzidas pelos estilos móveis existentes. Ritmo existente: 4/8/12/16/24/32px. Listas em grade adaptável; editor ao lado somente quando houver espaço, abaixo no celular. Formulários mantêm rolagem natural do documento.

Card de item: retrato e nome/subtítulo → características preenchidas → descrição em toda a largura → tipo/peso/tamanho e ações → ocupação da mochila. Não imprimir atributos vazios só para completar uma grade. Peso usa vírgula decimal. Descrições e nomes longos quebram linha. A ocupação espacial permanece expansível e acessível por teclado.

## Elevation & Depth

Separar superfícies por tom e borda. Sombras ficam nos menus e diálogos. Evitar brilhos, animação ambiente e painéis elevados sem função. A cor de um item nunca deve trocar o fundo dos menus de ações: estes pertencem ao sistema e preservam a distinção de exclusão.

## Shapes

Controles com 8px, cards de item com 10px, painéis com 12px. Retrato quadrado com proporção reservada. A borda superior de 3px identifica a família tonal do item, sem representar raridade ou regra de jogo.

## Components

- **Arte de poderes:** `JS/fundos-poderes.js` é o componente compartilhado entre catálogo, figurantes e jogador. Área de arte 16:9 com fundo preenchido e imagem sobreposta sem corte; textos e ações continuam nas superfícies legíveis existentes. O editor usa o select nativo de “Layout de fundo”, Sem fundo ou Estilo 1–8, com prévia e aviso de arquivo ausente. Os recursos públicos são `CSS/imagens/fundos-poderes/estilo-N.png`; só o número do estilo acompanha os dados, não um caminho livre. Ausência de arquivo não bloqueia salvamento nem altera regras.

- **Foco dos campos:** `--rpg-field-focus: #8193a5`, com borda de aço suave e outline de 1px a 2px de distância no foco por teclado. Sem sombra adicional nem anel dourado grosso. Erros continuam com borda semântica de perigo.
- **Seletores:** chevron SVG fixo de 16px, espaço reservado de 36px à direita, fundo escuro e hover discreto. Nos navegadores com `appearance: base-select`, a lista usa painel, borda, raio e seleção do sistema RPG; largura acompanha o controle. Nos demais, o menu aberto mantém o comportamento nativo da plataforma. Setas de hover dos campos numéricos ficam ocultas, preservando digitação e setas do teclado. Escape fecha primeiro a lista, mantendo o editor aberto.

- **Card:** um só renderizador em `mestre/JS/loot.js`, reutilizado pela prévia em `mestre/JS/aparencia.js`. A prévia não contém ações operacionais. Cor e campos conhecidos atualizam sem salvar.
- **Botões:** dourado sólido para a ação principal; borda/fundo neutros para ações secundárias. Exclusão separada dentro do menu. Hover e foco visíveis; desabilitado com cursor não interativo, operação pendente com progresso.
- **Busca:** controle nativo com botão explícito de limpar em `JS/interface.js` nas buscas do mestre. Limpar reaplica o filtro e devolve o foco. O popup dos selects é nativo; geometria pertence ao navegador/SO.
- **Avisos:** mensagens de erro junto ao campo; toasts pelos donos existentes. Ausência de jogadores fica em faixa discreta, sem uma lista vazia ocupando outra linha.
- **Rolagem:** uma base global, propriedades padrão e fallback WebKit, thumb distinguível e alternativa de cores forçadas. Não exigir classe por painel.
- **Movimento:** transições curtas de estado; respeitar `prefers-reduced-motion`. Nenhum deslocamento decorativo nos cards.
- **Editores:** itens e poderes se organizam em fieldsets com legendas serifadas e ritmo de 20px entre grupos. Campos relacionados ficam lado a lado; texto longo ocupa a largura completa. Figurantes mantêm seus fieldsets existentes. Ações usam nomes específicos do objeto.
- **Consulta de poderes:** descrições curtas aparecem completas; textos longos ou com quebras de linha podem ser expandidos pelo summary nativo, mantendo o estado durante atualizações da lista.
- **Confirmações:** `RPGUI.confirmar` é o dono compartilhado. Usa dialog nativo na camada superior, fundo inativo, foco inicial em Cancelar, Escape e restauração do foco. O rótulo de confirmação descreve a ação; a operação aguarda confirmação explícita. Erros de campos usam `RPGUI.validarFormulario` em acesso, seleção, ajuste de vital e Rolagem; editores do mestre mantêm `validarCamposMestre`.
- **Ícones:** SVG local na navegação; Font Awesome legado em itens. Manter nomes e rótulos textuais. Não usar ícone ou cor como único significado.

## Do's and Don'ts

- Agrupar orientação no ponto em que ela ajuda a decidir; separar nome, característica mecânica e narrativa.
- Conferir card padrão e todas as cores disponíveis, no catálogo e no editor, em largura estreita.
- Usar a mesma família de superfícies para a cor escolhida; nunca deixar blocos azulados fixos dentro de um card colorido.
- Não confundir cor decorativa do item com perigo, disponibilidade, raridade ou categoria.
- Não alterar regras, persistência ou dados reais em uma revisão visual.

Validação e limites desta rodada: `documentacao/REVISAO-UI-UX-2026-10-30.md`. Decisões observáveis de fluxo: `documentacao/UX-CONTRACT.md`.

Editores de itens e poderes: apresentação modal centralizada, com painel de até 960px, fundo desfocado em 6px, rolagem interna e ações acessíveis no rodapé. Usam RPGUI.abrirModal/fecharModal; mantêm os IDs e a validação dos editores. Em até 700px os grupos ficam em uma coluna. Checkboxes mantêm largura de 20px e nunca herdam a largura dos campos de texto.

Características de itens: Tipo de rolagem e Tipo compartilham a primeira linha. Dano mostra atributo, dado, categoria e tipo de dano; Cura mostra dado, recurso, atributo e usos. Tipo usa input com datalist nativo editável: sugestões vêm dos tipos existentes; valores novos são salvos no próprio item. O popup de sugestões permanece pertencente ao navegador. Alternar modo mantém o rascunho dos campos, mas envia somente os campos aplicáveis ao modo escolhido.

Peso e armazenamento: peso e pilha máxima alinhados em duas colunas, tamanho físico em largura completa e opções agrupadas acima. Abaixo, grade quadrada de 6 × 6 prepara o futuro editor de formato; nesta etapa é uma figura estática, sem foco, hover de ação ou seleção. Largura e altura ficam fora da interface, com valores existentes preservados. Em telas estreitas, os campos passam a uma coluna e a grade acompanha a largura disponível.

Mini cards de combatentes em Figurantes: coluna de 320px e altura mínima de 84px para acompanhar cinco combatentes no painel de até 472px, conforme a altura da janela. Retrato rente à esquerda com 60px de largura, fade na borda direita e somente 6px (10%) sob os status. Nome de 14px; cada vital apresenta rótulo à esquerda, valores de 15px e ajustes neutros à direita, mais barra de 2px. Fundos recebem apenas 5% da cor semântica; botões de 22px (24px em toque) mantêm foco e hover. Seleção usa borda e filete lateral sem deslocamento. A lista rola para os demais combatentes; a variante de alvos de Rolagem mantém sua apresentação.
