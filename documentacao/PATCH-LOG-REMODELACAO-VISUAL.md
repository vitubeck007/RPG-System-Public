# Patch Log — Remodelação Visual do RPG System

Atualização acumulada · 19–20 de outubro de 2026
Três rodadas de remodelação + os 21 ajustes de usabilidade. Extensões posteriores identificadas por data.

## Painel do mestre sem chave — 29/10/2026

- Removidos campo de chave, armazenamento, cookie de acesso do mestre e verificação de senha dos eventos. O painel carrega diretamente e mantém validação de dados e ações idempotentes.
- Removidos estilos e listeners da chave, o verificador de endereço local sem uso e os antigos HTML/scripts separados de NPCs e inimigos. Os endereços antigos continuam redirecionando à página unificada.
- Esta mudança substitui os requisitos históricos de token descritos abaixo. Testes antigos que exigem rejeição por chave ausente ou que manipulam o campo removido não representam mais o comportamento esperado.

## 🧭 Uso do painel do mestre — 28/10/2026

- **Rascunhos recuperáveis:** editores de figurantes, poderes, itens e baús guardam uma cópia local, incluindo poderes anexados e linhas dos baús. Ao reabrir o mesmo editor, escolha restaurar ou descartar. Restaurar não envia dados ao servidor; salvar ou descartar explicitamente limpa a cópia.
- **Alvos claros:** junto de Aplicar dano aparecem todos os selecionados, incluindo a categoria oculta, seus multiplicadores e a prévia do dano. É possível desmarcar cada alvo ali.
- **Modelos e combate:** a biblioteca identifica a vida máxima do modelo de inimigo e a energia atual; a ficha permanece selecionada mesmo quando fica fora da busca, com aviso e botão para limpar o filtro.
- **Confirmações e erros:** exclusões identificam o item ou figurante; limpar a batalha informa quantos combatentes serão removidos e permite cancelar. Erros de criação dos figurantes e danos extras aparecem junto ao campo, com foco no primeiro inválido.
- **Navegação:** Figurantes guarda tipo, aba, busca e seleção por sessão; Poderes e Loot lembram filtros/abas. Rolagem lembra categoria, expressão e quantidade, mantendo a ativação de ataque e seleção de alvos explícitas.
- **Biblioteca completa:** Carregar mais permite percorrer resultados em lotes de 100, com contagem visível, sem exigir lembrar o nome para buscar.
- **Verificação:** um cenário virtual passou sem servidor e sem escrita em dados da campanha. Conferiu recuperação de rascunho com poderes, limpeza ao salvar, validação/foco, seleção fora da busca, carregamento de 105 registros, cancelamento de limpeza, contexto e resumo dos alvos. Sem suíte completa ou inspeção visual em navegador real.

## 🎲 Dados compostos em poderes — 28/10/2026

- **Criação e edição:** habilidades e magias aceitam fórmulas como `1d6+1d4+2`, inclusive nos poderes dos figurantes e na ficha do jogador. Os campos mostram o novo exemplo e mantêm o limite de 30 caracteres.
- **Salvamento e uso:** navegador e servidor reutilizam o leitor compartilhado de expressões; a fórmula permanece no JSON e o combo da ficha rola todos os grupos, incluindo modificadores positivos ou negativos.
- **Verificação:** um teste com servidor temporário passou, verificando criação pela interface, preservação da fórmula no JSON, normalização da ficha, rejeição de expressões inválidas e cálculo determinístico. A suíte completa não foi executada.

## 🛡️ Defesa dos figurantes — 27/10/2026

- **Novo status:** Defesa é editável na criação/edição de inimigos e NPCs. Aparece como **DEF** no cabeçalho de combate e **Defesa** na biblioteca, com dica indicando a dificuldade para acertar o alvo.
- **JSON e cópias:** campo próprio `defesa`, inteiro entre 0 e 999, padrão 10 para registros antigos. É preservado nos agregados, JSONs individuais e estado de batalha; novas cópias herdam o valor do modelo.
- **Atributos alinhados:** sete colunas iguais no cabeçalho, com altura e alinhamento uniformes. A biblioteca mantém nomes completos e a adaptação para telas menores.
- **Verificação:** um cenário básico com servidor temporário passou, conferindo edição, exibição, defesa zero, limites, JSON individual e persistência após reiniciar. Sem suíte completa ou medição visual em aparelho físico.

## ⚔️ Aplicar dano após rolar — 27/10/2026

- **Botão compacto:** “Aplicar dano” junto ao resultado permite usar a última rolagem mesmo com Atacar desligado. Selecione os alvos e seus multiplicadores antes de clicar; não é feita outra rolagem.
- **Proteção contra repetição:** o botão fica bloqueado durante o envio e após a aplicação, inclusive quando o dano foi automático. Reutiliza o identificador da rolagem e a proteção existente no servidor. Desfazer continua disponível.
- **Verificação:** um caso virtual aprovado conferiu alvo obrigatório, multiplicador, clique repetido, uso do resultado original, desfazer disponível e bloqueio após ataque automático. Sem execução da suíte completa.

## 📦 Entregas simultâneas e execução dos testes — 27/10/2026

- **Confirmação após persistir:** uma confirmação antiga de salvamento não confirma mais as entregas das versões seguintes. Poderes e recibos já presentes na tela também aguardam gravações pendentes antes de confirmar ao servidor.
- **Suíte com carga controlada:** `npm test` executa um arquivo de testes por vez. Isso reduz a disputa de CPU, memória e portas entre os servidores temporários. A preparação informa erro se o processo encerrar antes de responder; consultas de prontidão têm prazo próprio.
- **Verificação:** executado somente o cenário de seis entregas por dois mestres, com servidor temporário. Passou, exercitando salvamentos sobrepostos e verificando ausência de confirmações prematuras. A suíte completa e o cancelamento anterior da Fase 2 não foram reexecutados nesta entrega.

## 🔧 Correções após o log da suíte — 27/10/2026

- **Pastas no Windows:** corrigida a comparação de caminhos ao renomear um figurante mudando apenas maiúsculas/minúsculas. A verificação de links e de permanência no diretório permitido continua ativa.
- **Ambiente virtual:** as páginas que usam o `fetch` do Node recebem seu `AbortController`/`AbortSignal`, corrigindo a incompatibilidade com os objetos do JSDOM.
- **Testes atualizados:** abertura explícita de baús/cards recolhidos, mensagens de erro junto aos campos, aviso de resultado incerto, autorização exibida na página, página unificada de NPCs e ordem dos scripts auxiliares. O teste de catálogo cria uma habilidade pública fictícia na cópia temporária.
- **Verificação limitada:** o caso de pastas/renomeação/exclusão/restauração passou e os 24 arquivos de testes mais os dois scripts alterados passaram na checagem de sintaxe. A suíte completa deve ser executada novamente; o log anterior não representa essas correções.

## ⚡ Otimizações — 27/10/2026

- **Combate mais leve:** vida, energia, seleção e notas atualizam os cards existentes. A aba oculta não é reconstruída; detalhes da biblioteca e seus poderes são montados quando abertos.
- **Menos sincronizações repetidas:** consultas simultâneas dos alvos compartilham a mesma requisição. Eventos recebidos durante a consulta continuam sendo atendidos. Retratos ficam em memória e são atualizados ao salvar ou recarregar o personagem.
- **Salvamento incremental:** alterar um figurante sincroniza somente seu arquivo individual. Renomear e excluir preservam arquivos extras do usuário. Conferência completa na inicialização, restauração e recuperação de falhas.
- **Retentativas sem paralisar a sessão:** gravações em execução usam espera assíncrona, mantendo ordem por arquivo/personagem e confirmação após gravar. Dano e desfazer aguardam a persistência.
- **Ficha:** quantidade de uma pilha atualiza seus indicadores sem reconstruir a mochila; removido o redesenho no redimensionamento. Rascunhos idênticos não são regravados. Busca do catálogo indexada e paginada em 40 resultados.
- **Verificação:** um teste integrado passou com dados fictícios e servidor isolado. Com 100 modelos, editar um fez zero leituras individuais; ajustar HP não criou novas fichas. Também conferidos falha/recuperação do espelho, vitais, retrato, dano/desfazer, mochila, paginação, rascunho e exclusão. Sem execução da suíte geral ou medição de FPS em navegador real.

## 🎲 Rolagens do mestre — 26/10/2026

- **Interface refeita:** rolagens à esquerda e alvos à direita. Seis dados instantâneos com quantidade independente, um campo personalizado e resultado com detalhes dos dados.
- **Menos etapas:** removidos o editor de componentes em linhas, a escolha de fonte de dano, o formulário manual separado e o botão Aplicar dano. Valores fixos continuam aceitos no campo personalizado. Histórico recolhido e desfazer preservados.
- **Ataque opt-in:** interruptor Atacar desligado inicialmente. Seleção amarela sem dano; vermelha com aplicação automática. Troca entre Jogadores/Inimigos mantém todos os alvos e seus multiplicadores, inclusive os da categoria oculta.
- **Cards compartilhados:** base DOM dos resumos extraída para `cartao-resumo.js` e usada também na batalha. Retrato, vida e energia com barras; multiplicador integrado só quando selecionado. NPCs continuam disponíveis na categoria Inimigos, identificados como NPCs.
- **Regras reaproveitadas:** rolagem criptográfica no servidor, comandos autenticados com `acaoId`, ajuste/persistência de vitais, notificações e desfazer existentes. Leitor novo de expressão composta separado do leitor simples da ficha, sem `eval`.
- **Multiplicadores decimais:** permitem valores não negativos como 0,5 / 1,5 / 2,5 / 3, com produto decimal exato e arredondamento final para baixo. Produtos inseguros são rejeitados antes de alterar qualquer alvo.
- **Proteção de dano duplicado:** controle de envio na interface, descarte do segundo clique físico e reserva da aplicação por `rolagemId` no servidor. Repetições idênticas recebem a mesma resposta; alvos/multiplicadores diferentes são recusados.
- **Sincronização e segurança:** dano atualiza ficha, batalha e arquivos existentes, sem alterar energia ou ultrapassar HP zero. Selecionados indisponíveis continuam desmarcáveis; erros de carga têm nova tentativa. Campos inválidos não iniciam rolagem/ataque.
- **Responsividade:** duas colunas no desktop; uma coluna em telas estreitas, lista de alvos com rolagem própria. Componentes locais, sem Tailwind/Font Awesome por CDN nesta página.
- **Validação:** testes focados de rolagem, dano e cards compartilhados, além de inspeção visual em navegador descartável. Não houve execução da suíte geral nem teste em aparelho móvel físico. Reinicie o servidor e recarregue a página para receber os novos contratos.

## ⚔️ Cards de figurantes — Comando tático

- **Anotações expansíveis:** camada ancorada embaixo, acima de habilidades e magias. Barra superior arrastável e botão Expandir/Recolher; setas/Escape também ajustam o tamanho. A altura é lembrada por combatente durante a página e não altera o tamanho da ficha; texto, foco e salvamento automático preservados. Uma checagem básica em navegador descartável confirmou arrasto (264 → 306 px), expansão por clique/teclado, troca de combatentes, atualização de energia sem perder altura/texto e persistência da anotação no servidor. Sem alteração de backend.
- **Atributos à vista:** FOR, DES, INT, SAB, PRE e VON no cabeçalho de batalha; na biblioteca aparecem Força, Destreza, Inteligência, Sabedoria, Presença e Vontade junto dos vitais. Dados existentes, sem novo atributo ou mudança de regras. Zero é mostrado corretamente; ausência usa travessão.
- **Cabeçalho mais compacto:** vitais de batalha ocupam cerca de 187 px de largura para os valores de exemplo, mantendo barras e edição. Biblioteca com retrato de 60 × 64 px e texto **Atual / máximo** igual nos dois vitais. No modelo inimigo, vida atual é o máximo do modelo; NPCs mantêm vida atual independente. Telas estreitas reorganizam os grupos; áreas de toque são preservadas.
- **Checagem dos atributos:** um fluxo básico no navegador, em cópia descartável, conferiu biblioteca e batalha, nomes completos/siglas/zero, alinhamento dos grupos em 1440 px, botão de energia funcional e ausência de rolagem horizontal em larguras de 1024 e 390 px. Caso automatizado atualizado, mas não executado nesta alteração; sem mudanças no backend ou dados reais.
- **Correção da arma e diagnóstico:** o processo Node encontrado havia iniciado antes da atualização do backend e descartava `arma`, embora o formulário novo já aparecesse no navegador. O editor passou a conferir o suporte do servidor antes de abrir e a arma devolvida no salvamento, evitando sucesso enganoso. É necessário reiniciar o servidor e recarregar a página.
- **Biblioteca recolhida:** nome, retrato, vitais, atributos e **Mais ações** no cabeçalho. O nome/retrato/seta expande a ficha; o estado aberto resiste às atualizações. A ficha geral agora também mostra a arma, antes ausente da renderização da biblioteca.
- **Arma em cópias antigas:** quando o modelo e a cópia divergem, **Atualizar arma do modelo** grava a arma na cópia selecionada, sem alterar vida, energia, notas nem outros combatentes. Substitui a necessidade anterior de recriar o combatente para atualizar sua arma.
- **Alinhamento dos resumos:** retrato centralizado na área abaixo do título; botões agrupados junto aos números. Em telas a partir de 1600 px, lateral de 320 px e área de recursos mais larga, mantendo cinco lugares e rolagem própria.
- **Chave recém-digitada:** corrigido o registro do listener para carregar a biblioteca mesmo quando o cabeçalho ainda não existia durante a inicialização, dispensando a recarga manual após informar a chave.
- **Checagem da correção:** um único fluxo básico em navegador com servidor real descartável, em 1920×1080, confirmou salvar armas de inimigo e NPC pelo formulário, sincronizar uma cópia antiga preservando recursos/notas, conferir catálogo, JSONs individuais e batalha, reiniciar o servidor de teste e reabrir a arma no editor. Não foi executada a suíte geral; o caso automatizado foi atualizado para futuras regressões.
- **Cabeçalho da ficha:** vida e energia menores, com barras, ao lado da identidade. **Mais ações** fica no canto superior direito e reúne marcar derrotado/reviver e remover da batalha; o rodapé vazio foi retirado.
- **Painel de resumos:** fundo e borda envolvendo a coluna inteira; cada card tem faixa de título no topo, retrato de 42 px com cantos arredondados e áreas distintas para vida/energia. A seleção, os cinco lugares e a rolagem própria permanecem.
- **Arma carregada:** nova seção com ícone, nome, alcance, dano e categoria. Criação/edição de NPCs e inimigos recebeu **Possui arma**, sem tornar a arma obrigatória. Ícones locais: espada, machado, arco, cajado e adaga; categorias leve, média, pesada, natural e outra.
- **Persistência da arma:** campo opcional `arma` nos JSONs do figurante e de cada combatente, normalizado pelo servidor e salvo pelo fluxo existente. Novas cópias recebem a arma do modelo; cópias já em combate só mudam por atualização explícita. Dados antigos continuam compatíveis, sem migração de ataques antigos ou mudanças no inventário dos jogadores.
- **Checagem desta etapa:** um fluxo básico em navegador/servidor descartável conferiu editar/salvar arma, habilitar/desabilitar seus campos, nova cópia recebendo o machado enquanto cópias antigas mantiveram a espada, menu de derrotado/reviver, recursos no cabeçalho e ausência de rolagem da página no desktop. Os JSONs temporários foram conferidos. O teste automatizado foi atualizado, mas não foi reexecutado nesta etapa.
- **Biblioteca:** descrição completa, lore e anotações em linhas separadas, sem o corte anterior de 200 caracteres. Habilidades e magias ficam em uma área expansível.
- **Cabeçalho:** botões **NPCs / Inimigos** substituem a lista suspensa; o tipo ativo fica ressaltado e determina o título. Alternar o tipo mantém a aba Biblioteca/Batalha.
- **Batalha:** coluna vertical de resumos à esquerda e ficha do selecionado ao centro/direita. Até cinco ficam centralizados; a partir do sexto, a lista rola verticalmente com cinco posições visíveis. Seleção e posição de rolagem são preservadas nas atualizações.
- **Ficha selecionada:** vida/energia compactas no cabeçalho, arma abaixo, poderes em grupos distintos na área central e notas rápidas abaixo, sem mudar a identidade visual. O desktop usa a altura da janela, evitando rolar o documento; poderes extensos rolam dentro da ficha. Telas menores que 761 px empilham as áreas.
- **Busca no combate:** filtra os resumos por nome ou notas, ignorando acentos. Setas cima/baixo, Home e End alternam a seleção quando o foco está no botão do retrato; esquerda/direita continuam compatíveis.
- **Caídos:** retrato atenuado com **Excluir / Reviver** sobre a imagem. Excluir exige confirmação e remove somente a cópia da batalha. Reviver devolve 1 HP se estiver em zero, ou mantém o HP positivo já existente; vida máxima zero impede reviver. Limpar batalha informa que remove a batalha inteira, inclusive os dois tipos.
- **Escala compacta:** fontes, cabeçalho, campos e espaçamentos menores somente na página de figurantes, sem `zoom`/transformação do navegador. Resumos pequenos em linha na lateral; os controles de menos/mais têm 22 px no desktop e área de 28 px para toque.
- **Vida na biblioteca:** inimigos agora têm menos/mais e edição direta da vida máxima do modelo, pelo comando autenticado `master_inimigo_hp`. Não altera cópias já em batalha. NPCs continuam ajustando a vida atual.
- **Retratos corrigidos:** cópias antigas com imagem vazia consultam o modelo; falhas de URL exibem o SVG local padrão em vez de remover silenciosamente a imagem. Resumos mostram o retrato inteiro, sem o corte de um banner largo.
- **Conferência anterior, da escala compacta:** uma checagem básica no navegador com servidor real e dados descartáveis confirmou botões funcionais na biblioteca, imagem carregada e resumos de aproximadamente 196 × 173 px, antes da disposição lateral. O teste automatizado foi atualizado para a alteração, mas não foi reexecutado naquela rodada.
- **Conferência da mesa lateral:** uma checagem básica no navegador, em cópia temporária, confirmou centralização com 1, 3 e 5 resumos, rolagem própria com o sexto e seleção por teclado até ele, ficha à direita e documento sem rolagem. A vida da ficha ficou com cerca de 41 px de altura, mantendo a barra. Não houve regressão completa nem teste em aparelhos físicos.
- **Poderes:** descrição narrativa em itálico, efeito mecânico em bloco destacado e alcance/duração/canalização separados. Ataques antigos continuam disponíveis para consulta.
- **Usar poder:** botão somente com espada ou bola de fogo, com identificação acessível e tooltip. O custo continua no resumo do poder; energia insuficiente bloqueia o botão e o servidor também valida a cobrança. Dano e efeitos continuam sendo aplicados manualmente.
- **Recursos:** botões de menos/mais e edição direta do valor atual, sem o botão “Ajustar”. Na biblioteca, a vida do modelo inimigo continua sendo a máxima; a vida atual pertence à cópia em batalha.
- **Ações:** quantidade de cópias com rótulo e botão principal de batalha dentro da ficha expandida. Editar também está acessível em **Mais ações** no cabeçalho recolhido; duplicar, excluir e remover ficam no mesmo menu, com confirmação para exclusão/remoção.
- **NPCs em combate:** também podem gerar cópias independentes, iniciando com a vida/energia atuais do modelo. Alterar a cópia não altera o NPC da biblioteca.
- **Notas rápidas:** salvamento automático por combatente em `campanha/batalha.json`, no campo `notasCombate`. Não substitui `nota`/`notas` da biblioteca. Falhas indicam pendência e oferecem nova tentativa; sair com envio pendente solicita confirmação do navegador.
- **Sincronização:** atualizações preservam expansões, quantidade de cópias, texto em digitação, foco e seleção das notas.
- **Backend pontual:** adicionado o comando autenticado `master_batalha_notas`; os comandos existentes de HP/energia aceitam valor atual, e adicionar à batalha também aceita NPCs. Sem alteração de fórmulas ou custos.
- **Checagem:** um caso básico com DOM simulado e servidor real, em cópia temporária, aprovado: `node --test testes/figurantes-cartoes.test.js`. Não substitui conferência visual em navegador/celular nem regressão completa.

## 🎨 Visual geral

- **Nova identidade visual:** azul-escuro, dourado suave e títulos serifados aplicados ao acesso, à ficha e ao painel do mestre.
- **Componentes padronizados:** botões, campos, cartões, abas, mensagens e janelas seguem a mesma base visual.
- **Leitura mais confortável:** valores importantes ganharam destaque; textos de apoio e ações ficaram mais legíveis.
- **Menos espaço desperdiçado:** cabeçalhos mais compactos e melhor distribuição do conteúdo durante a partida.
- **Cores de ação:** botões principais, ações destrutivas, estados selecionados e avisos passaram a ter identificação mais consistente.
- **Recursos locais:** login e seleção deixaram de depender de fontes e bibliotecas visuais por CDN. A ficha recebeu um retrato padrão em SVG local, preservando retratos personalizados.

## 🔑 Login e personagens

- **Login remodelado:** duas colunas no desktop e disposição empilhada em telas menores.
- **Seleção de personagens:** cartões mais claros, nomes longos sem cortes desnecessários e acesso por teclado.
- **Criação e exclusão:** janelas com mensagens junto à operação, foco controlado e retorno ao botão de origem.
- **Exclusão mais segura:** a confirmação começa com foco em **Manter personagem**, evitando priorizar a ação destrutiva.
- **Pedidos repetidos:** login e criação bloqueiam novos envios enquanto aguardam resposta.
- **Falha ao carregar personagens:** opção de tentar novamente sem encerrar uma sessão ainda válida.
- **Espera limitada:** login, listagem, criação e exclusão têm prazo de **12 segundos**, incluindo a leitura da resposta.
- **Resultado desconhecido:** uma criação ou exclusão sem confirmação exige atualizar a lista antes de repetir; não há reenvio automático.
- **Criação de conta sem confirmação:** o aviso orienta tentar **Entrar** com os mesmos dados antes de criar novamente.

## 📜 Ficha e perícias

- **Cabeçalho compacto:** nome e nível/experiência ocupam menos espaço; a edição de nome e classe permanece no perfil.
- **Navegação:** cinco abas com indicação da área ativa, atalhos de teclado e última área lembrada por personagem nesta aba do navegador.
- **Aviso de conexão:** continua visível sem encobrir a navegação.
- **Vitais:** valores atuais maiores, máximos editáveis e controles de ajuste mais confortáveis.
- **Ajustar…:** permite aplicar uma quantidade positiva ou negativa de uma vez, com prévia do valor final e respeito aos limites.
- **Mudança durante o ajuste:** se o vital for atualizado enquanto o diálogo estiver aberto, a prévia é renovada e pede nova conferência.
- **Perícias em duas colunas:** totais destacados e composição visível; telas menores usam uma coluna para manter a leitura.
- **Busca de perícias:** pesquisa por nome ou atributo, ignorando acentos, com indicação quando não há resultados.
- **Consulta compacta:** os controles de bônus ficam recolhidos até ativar **Editar bônus**. **Concluir edição de bônus** retorna à consulta.
- **Rolar perícia:** novo teste direto de **1d20 + total da perícia**, integrado ao resultado, histórico, log e envio ao mestre.
- **Ao combo:** continua disponível como alternativa, adicionando somente o bônus fixo da perícia.
- **Atributos no celular:** grupo inicialmente recolhido, mas disponível para expansão.

## ✨ Grimório

- **Filtros:** **Todos / Habilidades / Magias**, com contagem e identificação das categorias nos cartões.
- **Categorias separadas:** mesmo em **Todos**, habilidades e magias permanecem em seções próprias.
- **Tipo explícito:** criação e catálogo deixam claro se a entrada é habilidade ou magia.
- **Editar na ficha:** poderes existentes podem ter nome, custo, descrição e demais campos do editor alterados sem remover e recriar a entrada.
- **Identidade preservada:** editar mantém os identificadores, efeitos, duração e dados que não aparecem no formulário.
- **Catálogo independente:** editar a cópia da ficha não modifica o poder do catálogo global.
- **Rascunho de criação:** alternar **Criar/Catálogo** ou fechar e reabrir o editor preserva o preenchimento na mesma página.
- **Edição protegida:** fechar um poder com alterações pede confirmação; o rascunho de criação fica separado da edição de entradas existentes.

## 🎒 Mochila e equipamentos

- **Tetris preservado:** mesmas células, posições, dimensões, capacidade, pilhas, peso e regras de equipamento.
- **Grade rolável:** mochilas maiores têm rolagem própria, sem exigir que a página inteira acompanhe sua largura.
- **Detalhes centralizados:** itens abrem em uma janela fora da área rolável da grade, com ações acessíveis também em telas menores.
- **Teclado:** itens da grade podem ser abertos com **Enter** ou **Espaço**.
- **Buscar na mochila:** pesquisa por nome ou tipo, ignorando acentos e maiúsculas.
- **Lista auxiliar:** nome completo, quantidade, tipo e botão **Detalhes** para cada pilha, sincronizados com o inventário.
- **Resultados na grade:** itens encontrados ficam realçados e os demais atenuados, sem mudar sua posição ou capacidade.
- **Atualizações sincronizadas:** alterações de quantidade e mudanças no inventário atualizam também a lista, mantendo o texto da busca.
- **Descarte por quantidade:** permite remover apenas parte da pilha, com nome, quantidade e confirmação antes de concluir.
- **Retorno de foco:** fechar os detalhes retorna à ação correspondente, inclusive quando a lista foi redesenhada.

## 🎲 Dados e combo

- **Área de rolagem remodelada:** combo, resultado e histórico receberam a nova hierarquia visual e tipografia.
- **Remoção identificada:** botões informam qual componente e fórmula serão removidos, inclusive para leitores de tela.
- **Dica no foco:** a identificação da remoção também aparece ao navegar pelo teclado ou passar o mouse.
- **Continuidade pelo teclado:** remover um componente leva o foco à próxima remoção; no último, ao botão **Rolar combo**.
- **Fórmulas preservadas:** a remodelação não alterou os cálculos, a aleatoriedade ou a composição das rolagens.

## 🧙 Painel do mestre

- **Visual unificado:** Mesa, Rolagem, Inimigos/NPCs, Loot e Habilidades/Magias adotaram a identidade da ficha.
- **Menu móvel:** cinco atalhos com ícones locais e nomes curtos, mantendo as áreas principais acessíveis.
- **Chave do mestre:** campo em painel recolhível; conexão online e acesso autorizado recebem indicações distintas.
- **Mesa:** vitais maiores, nomes com quebra de linha, comandos identificados e recuperação de foco após atualização dos cartões.
- **Ajustar vitais:** edição por quantidade na Mesa e nos recursos editáveis dos figurantes, mantendo os atalhos anteriores.
- **Figurantes:** ficha central, catálogo e criação de poderes receberam cores, fontes e controles harmonizados, preservando a estrutura já existente.
- **Chave antes da criação:** **Novo inimigo/NPC** e **Abrir ficha** validam o acesso antes de abrir ou limpar o formulário.
- **Acesso recusado:** chave ausente, inválida ou falha de conexão não inicia o preenchimento; o campo da chave recebe foco para correção.
- **Atualizações em tempo real:** cartões de figurantes preservam detalhes de poderes abertos, quantidade de cópias e foco enquanto recebem novos valores.
- **Seleção de alvos:** clicar no nome também marca o alvo; a linha selecionada recebe destaque, sem interferir no multiplicador.
- **Rolagem:** foco, seleção e multiplicador são preservados durante a atualização dos alvos.
- **Entrega de poderes:** destinatário identificado por **player + nomePasta**, sem escolha automática de outro personagem ao reordenar a lista.
- **Destino explícito:** o botão informa **Entregar a [nome]**, com indicação de entrega offline quando aplicável.
- **Envios protegidos:** entregar, duplicar poderes e aplicar/desfazer dano exibem estado ocupado; pedidos mutantes idênticos em andamento compartilham o mesmo envio.
- **Catálogos:** estados separados de carregamento, catálogo vazio e erro, com **Tentar novamente**. Dados anteriores permanecem visíveis quando disponíveis.
- **Validação junto ao campo:** Loot e poderes mostram o erro no local, respeitam limites numéricos e levam o foco ao primeiro problema.
- **Ícones por nome:** seletores como **Arma, Defesa, Poção, Fogo, Magia e Tesouro**, com prévia, substituem a exigência de decorar classes técnicas.
- **Paleta do Loot:** opções nomeadas de cor com prévia para a peça na mochila.
- **Avançado:** ícones e cores personalizados continuam disponíveis e não são substituídos automaticamente ao abrir uma entrada antiga.

## 💾 Salvamento e proteção de alterações

- **Rascunhos dos editores:** aviso antes de descartar alterações ao fechar, cancelar ou substituir uma edição.
- **Campos durante o envio:** formulários ficam protegidos contra novas edições enquanto aguardam o salvamento; falhas mantêm o preenchimento.
- **Cópia local de pendências:** alterações da ficha ainda não confirmadas recebem uma cópia no navegador, identificada por personagem e abertura da página, sem incluir credenciais.
- **Recuperação explícita:** ao reencontrar uma cópia, é possível **Restaurar e salvar rascunho** ou **Manter versão do servidor**. Nada é aplicado automaticamente sobre a ficha recebida.
- **Erro de salvamento mais claro:** o indicador identifica a área afetada e oferece **Tentar salvar novamente**.
- **Troca de personagem:** pendências e erros de salvamento são sinalizados antes de sair da ficha.
- **Espera sem confirmação:** avisos deixam claro que a operação pode ter sido concluída, orientando conferir o estado antes de repetir.
- **Notificações:** erros permanecem até serem dispensados; avisos simples expiram e têm fechamento próprio. A pilha visível foi limitada para não cobrir a tela.

## 🔧 Correções

- **Máximo vital:** confirmar com **Enter** não reabre mais o campo ao devolver o foco ao botão.
- **Slot da Mochila:** desativá-lo com os detalhes de uma mochila abertos usa o fechamento completo da janela, restaurando foco, rolagem e interação do fundo.
- **Detalhes pela lista:** corrigido o clique que abria a janela do item e imediatamente a fechava como se fosse um clique externo.
- **Botões dourados dos figurantes:** texto escuro mantido também no hover e no foco, corrigindo o conflito com a regra antiga de cor clara.
- **Destinatário reordenado:** a atualização da lista não troca silenciosamente a pessoa que receberá o poder.
- **Resposta atrasada de acesso:** não abre uma ficha de figurante em um tipo, aba ou chave que já mudou durante a espera.
- **Falha de consulta:** não é mais apresentada como se o catálogo estivesse simplesmente vazio nas áreas ajustadas.
- **Testes antigos do menu:** expectativas atualizadas para as cinco áreas atuais do mestre, preservando os caminhos antigos de Inimigos/NPCs.

## 📱 Acessibilidade e telas menores

- **Áreas de toque:** botões e seleções importantes ampliados, com foco visível e identificação contextual.
- **Janelas:** títulos associados, foco inicial, navegação por **Tab/Shift+Tab**, **Escape**, fundo inativo e retorno de foco nas janelas ajustadas.
- **Abas:** navegação por setas, **Home** e **End** nas áreas adaptadas.
- **Formulários responsivos:** filtros quebram linha e editores do mestre se reorganizam abaixo do catálogo quando falta espaço.
- **Conteúdo sem cortes:** nomes longos, valores maiores e mensagens receberam melhor tratamento em telas estreitas.
- **Preferência de movimento:** a base visual respeita a redução de animações quando configurada no dispositivo.

## ⚖️ O que continua igual

- **Sem rebalanceamento:** regras de combate, fórmulas, custos e limites de jogo não foram reformulados.
- **Backend da remodelação inicial:** contratos HTTP/Socket.IO, autenticação e formatos dos JSONs foram mantidos nas três rodadas e nos 21 ajustes. As extensões pontuais posteriores dos cards estão descritas na seção Comando tático acima.
- **Personagem correto:** a identidade continua sendo **player + nomePasta**.
- **Configuração global:** Mana/Vigor, Ex, riquezas e Slot da Mochila continuam obedecendo às configurações existentes.
- **Conexões separadas:** mestre e jogador mantêm seus próprios fluxos. Trocar de página do mestre ainda recria a conexão, reaproveitando a chave na mesma aba; não foi criada uma conexão única entre páginas.
- **Compatibilidade visual:** partes legadas da ficha e do mestre ainda usam Tailwind/Font Awesome por CDN. A independência de CDN não se aplica ao sistema inteiro.

## 🧪 Verificação

- **Rodadas iniciais:** foram realizadas verificações específicas e inspeções em navegador em cópias descartáveis; os relatórios individuais foram consolidados nesta documentação.
- **Rodada do mestre:** checagem básica de navegação e abertura de editores em cópia descartável.
- **Ajustes dos 21 pontos:** cada etapa terminou com seu caso básico virtual aprovado; não foi executada uma regressão completa da versão final acumulada.
- **Validação local pendente:** conferir o conjunto final com servidor real, salvamentos, combate, entregas e uso em celulares físicos. Melhorias de acessibilidade não equivalem a uma certificação.

---

Este arquivo consolida os antigos relatórios das três rodadas e das três etapas de UX, removidos na limpeza documental. Consulte [Informações importantes](INFORMACOES-IMPORTANTES.md) para comandos, segurança, recuperação e verificação local; o diagnóstico anterior à remodelação permanece em `ANALISE-UI-UX-DESIGN-GERAL.txt`. A criação original do sistema de Inimigos/NPCs e outras alterações anteriores à remodelação não são apresentadas aqui como novidades deste patch.
