const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const pm = require('../servidor/personagem');
const { criarCampanha } = require('../servidor/campanha');
const { criarComandos } = require('../servidor/comandos');
const fonte = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
const ler = nome => fs.readFileSync(path.join(__dirname, '..', nome), 'utf8');
const mudo = { log() {}, warn() {}, error() {} };
const trecho = (inicio, fim) => fonte.slice(fonte.indexOf(inicio), fonte.indexOf(fim, fonte.indexOf(inicio)));

function pasta(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-rodada2-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith('rpg-rodada2-'));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

test('edição de lore usa o HP atual da fila; baú liberado na fila recusa edição antiga', async t => {
  const c = criarCampanha(pasta(t), { log: mudo }).iniciar();
  const eventos = {};
  const ctx = vm.createContext({ campanha: c, socket: {}, ErroCampanha: require('../servidor/campanha').ErroCampanha,
    comandos: { registrar(s, nome, fn) { eventos[nome] = fn; } } });
  vm.runInContext(trecho('  comandos.registrar(socket, "master_campanha_salvar"', '  // HP do NPC por delta'), ctx);
  await c.salvarItem('npcs', { id: 'npc_teste', nome: 'Ana', hp: { atual: 10, max: 10 } });
  const dano = c.atualizar('npcs', lista => { lista[0].hp.atual = 7; });
  const edicao = eventos.master_campanha_salvar({ tipo: 'npcs', item: { id: 'npc_teste', lore: 'Nova lore' } });
  await Promise.all([dano, edicao]);
  assert.equal(c.ver('npcs')[0].hp.atual, 7);
  assert.equal(c.ver('npcs')[0].lore, 'Nova lore');
  const bau = await c.salvarItem('baus', { nome: 'Baú', itens: [] });
  const liberar = c.atualizar('baus', lista => { lista[0].liberado = true; });
  await assert.rejects(eventos.master_campanha_salvar({ tipo: 'baus', item: { ...bau, nome: 'Antigo' } }), { codigo: 'bau_liberado' });
  await liberar;
  assert.equal(c.ver('baus')[0].liberado, true);
});

async function modelo(t) {
  const raiz = pasta(t), dir = path.join(raiz, 'ana', 'Heroi_1234');
  fs.mkdirSync(dir, { recursive: true });
  await pm.criarArquivosPadraoAsync(dir, { id: '1234', nome: 'Herói' });
  const contexto = vm.createContext({ ...pm, personagemModelo: pm, path, PLAYERS_PATH: raiz,
    entregas: { pendentesAsync: async () => [] } });
  vm.runInContext(trecho('async function salvarArquivoPersonagem(', '// O nome exibido vem de perfil'), contexto);
  return { dir, contexto, salvar: (...args) => contexto.salvarArquivoPersonagem('ana', 'Heroi_1234', ...args) };
}

test('rascunho antigo não desfaz ajuste do mestre; reenvio idêntico é reconhecido', async t => {
  const { dir, salvar } = await modelo(t);
  const inicial = pm.lerJson(path.join(dir, 'status.json'));
  inicial.hp = { current: 10, max: 10 };
  await pm.gravarJsonAsync(path.join(dir, 'status.json'), inicial);
  const antigo = pm.lerJson(path.join(dir, 'status.json')), revisao = pm.revisaoDosDados(antigo);
  const doMestre = structuredClone(antigo); doMestre.hp.current = 2;
  await salvar('status', doMestre);
  const local = structuredClone(antigo); local.hp.current = 3;
  assert.equal((await salvar('status', local, revisao)).codigo, 'conflito');
  assert.equal(pm.lerJson(path.join(dir, 'status.json')).hp.current, 2);
  const salvo = await salvar('status', local, pm.revisaoDosDados(doMestre));
  assert.equal(salvo.ok, true);
  assert.equal((await salvar('status', local, pm.revisaoDosDados(doMestre))).ok, true);
});

test('inventário conserva recibo antigo ainda pendente além dos cem mais recentes', async t => {
  const { dir, contexto, salvar } = await modelo(t);
  const antigo = pm.lerJson(path.join(dir, 'inventario.json'));
  antigo.recebidas = ['ent_antiga'];
  await pm.gravarJsonAsync(path.join(dir, 'inventario.json'), antigo);
  contexto.entregas.pendentesAsync = async () => [{ entregaId: 'ent_antiga' }];
  const dados = { ...antigo, recebidas: Array.from({ length: 140 }, (_, i) => `ent_${i}`) };
  const salvo = await salvar('inventario', dados);
  assert.equal(salvo.ok, true);
  assert.ok(salvo.dados.recebidas.includes('ent_antiga'));
  assert.equal(salvo.dados.recebidas.length, 101);
});

test('evento real de salvamento devolve ID, revisão e conflito sem alterar o arquivo', async t => {
  const a = await modelo(t), eventos = {}, respostas = [];
  const status = pm.lerJson(path.join(a.dir, 'status.json'));
  status.hp = { current: 10, max: 10 };
  await pm.gravarJsonAsync(path.join(a.dir, 'status.json'), status);
  const revisao = pm.revisaoDosDados(status);
  Object.assign(a.contexto, { socket: { data: {}, emit(nome, dados) { respostas.push({ nome, dados }); } },
    ouvir(nome, fn) { eventos[nome] = fn; }, identidadeValidaParaSalvar: () => true,
    naFilaPersonagem: (p, n, fn) => fn(), ARQUIVOS_CONFERIDOS: ['status'], ARQUIVOS_DO_MESTRE: [],
    atualizarCardPeloSalvo() {}, console: mudo });
  vm.runInContext(trecho('  ouvir("salvar_personagem",', '  ouvir("player_update",'), a.contexto);
  const dados = structuredClone(status); dados.hp.current = 8;
  await eventos.salvar_personagem({ player: 'ana', nomePasta: 'Heroi_1234', arquivo: 'status', dados, revisao, envioId: 'envio_1' });
  assert.equal(respostas[0].nome, 'personagem_salvo');
  assert.equal(respostas[0].dados.envioId, 'envio_1');
  assert.equal(respostas[0].dados.revisao, pm.revisaoDosDados(dados));
  await eventos.salvar_personagem({ player: 'ana', nomePasta: 'Heroi_1234', arquivo: 'status', dados: status, revisao, envioId: 'envio_2' });
  assert.equal(respostas[1].dados.codigo, 'conflito');
  assert.equal(respostas[1].dados.envioId, 'envio_2');
  assert.equal(pm.lerJson(path.join(a.dir, 'status.json')).hp.current, 8);
});

function ficha(t) {
  const dom = new JSDOM('<span id="save-status"></span><button id="save-retry"></button>', { url: 'http://teste.local' });
  t.after(() => dom.window.close());
  const eventos = {}, pedidos = [], timers = new Map(); let numero = 0;
  const ctx = vm.createContext({ window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
    CHARACTER: { player: 'ana', nomePasta: 'Heroi_1234' }, personagemCarregado: true,
    STATE: { vitals: { hp: { current: 10, max: 10 }, vigor: { current: 10, max: 10 }, sanity: { current: 10, max: 10 } } },
    socket: { connected: true, on(nome, fn) { eventos[nome] = fn; }, emit(nome, pedido) { pedidos.push({ nome, pedido }); } },
    console: mudo, toast() {}, registrarNoTerminal() {}, quantidadeDoItem: () => 1,
    setTimeout(fn) { timers.set(++numero, fn); return numero; }, clearTimeout(id) { timers.delete(id); } });
  vm.runInContext(ler('JS/salvamento.js'), ctx);
  const run = texto => vm.runInContext(texto, ctx);
  run("revisoesFicha.status = 'v1'");
  return { ctx, eventos, pedidos, timers, run };
}

test('confirmações serializam alterações rápidas e ignoram ACK antigo', t => {
  const f = ficha(t);
  f.run('salvarStatus(); STATE.vitals.hp.current = 8; salvarStatus()');
  assert.equal(f.pedidos.length, 1);
  const primeiro = f.pedidos[0].pedido;
  f.eventos.personagem_salvo({ arquivo: 'status', envioId: primeiro.envioId, revisao: 'v2' });
  assert.equal(f.pedidos.length, 2);
  assert.equal(f.pedidos[1].pedido.revisao, 'v2');
  assert.equal(f.pedidos[1].pedido.dados.hp.current, 8);
  f.eventos.personagem_salvo({ arquivo: 'status', envioId: primeiro.envioId, revisao: 'v1' });
  assert.equal(f.run('emVoo.status'), 1);
  assert.equal(f.run('revisoesFicha.status'), 'v2');
});

test('prazo esgotado libera nova tentativa com o mesmo envio e preserva edições posteriores', t => {
  const f = ficha(t); f.run('salvarStatus()');
  const original = f.pedidos[0].pedido;
  [...f.timers.values()][0]();
  assert.equal(f.run('totalEmVoo()'), 0);
  assert.equal(f.ctx.document.getElementById('save-retry').disabled, false);
  f.run('STATE.vitals.hp.current = 7; tentarSalvarNovamente()');
  assert.equal(f.pedidos[1].pedido.envioId, original.envioId);
  assert.equal(f.pedidos[1].pedido.dados.hp.current, 10);
  f.eventos.personagem_salvo({ arquivo: 'status', envioId: original.envioId, revisao: 'v2' });
  assert.equal(f.pedidos[2].pedido.dados.hp.current, 7);
  assert.equal(f.pedidos[2].pedido.revisao, 'v2');
});

test('conflito bloqueia reenvio automático e mantém rascunho local', t => {
  const f = ficha(t); f.run('salvarStatus()');
  f.eventos.salvamento_personagem_erro({ arquivo: 'status', envioId: f.pedidos[0].pedido.envioId, codigo: 'conflito', message: 'Mudou' });
  f.run('STATE.vitals.hp.current = 6; salvarStatus(); enviarSalvamentosPendentes()');
  assert.equal(f.pedidos.length, 1);
  assert.equal(f.ctx.document.getElementById('save-retry').textContent, 'Resolver conflito');
  assert.ok(f.ctx.localStorage.length > 0);
  assert.match(f.ctx.localStorage.getItem(f.ctx.localStorage.key(0)), /"current":6/);
});

test('reconexão conserva o ID e a versão originais do envio pendente', t => {
  const f = ficha(t); f.run('salvarStatus()');
  const original = f.pedidos[0].pedido;
  f.ctx.socket.connected = false;
  f.run('aoDesconectarFicha(); STATE.vitals.hp.current = 5; salvarStatus()');
  f.ctx.socket.connected = true;
  f.run('enviarSalvamentosPendentes()');
  assert.equal(f.pedidos[1].pedido.envioId, original.envioId);
  assert.equal(f.pedidos[1].pedido.revisao, 'v1');
  assert.equal(f.pedidos[1].pedido.dados.hp.current, 10);
});

test('configuração só muda após gravar; falha conserva disco e memória; concorrentes somam', async t => {
  const dir = pasta(t), arquivo = path.join(dir, 'config.json'), eventos = {};
  const original = { AtivarRiquezas: false, AtivarMana: false };
  await pm.gravarJsonAsync(arquivo, original);
  const ctx = vm.createContext({ fs, CONFIG_PATH: arquivo, DEFAULT_CONFIG: original, systemConfig: { ...original },
    gravarJsonAsync: async () => { throw Error('falha'); }, console: mudo,
    io: { emit() {} }, socket: { emit() {} }, ouvir(nome, fn) { eventos[nome] = fn; } });
  vm.runInContext(trecho('function normalizarConfig(', '// Vitais para broadcast'), ctx);
  vm.runInContext(trecho('  ouvir("master_update_config",', '  // ---- Painel do mestre:'), ctx);
  await eventos.master_update_config({ config: { AtivarMana: true } });
  assert.equal(ctx.systemConfig.AtivarMana, false);
  assert.deepEqual(pm.lerJson(arquivo), original);
  ctx.gravarJsonAsync = pm.gravarJsonAsync;
  await Promise.all([eventos.master_update_config({ config: { AtivarMana: true } }), eventos.master_update_config({ config: { AtivarRiquezas: true } })]);
  assert.deepEqual(pm.lerJson(arquivo), { AtivarRiquezas: true, AtivarMana: true });
});

test('ação do mestre com resposta perdida é repetida uma vez; reinício rejeita ID da sessão antiga', async t => {
  const eventos = {}, respostas = [], memoria = new Map(); let executadas = 0, perder = false;
  const socketServidor = { on(nome, fn) { eventos[nome] = fn; } };
  const registrar = comandos => {
    comandos.registrar(socketServidor, 'master_entrar', () => ({}));
    comandos.registrar(socketServidor, 'master_teste', async () => ++executadas, { mudaEstado: true });
  };
  registrar(criarComandos({ log: mudo }));
  const ctx = vm.createContext({ socket: { connected: true, timeout() { return this; }, emit(nome, dados, callback) {
    respostas.push(dados);
    eventos[nome](dados, resposta => perder ? callback(Error('resposta perdida')) : callback(null, resposta));
  } }, sessionStorage: { getItem: k => memoria.get(k), setItem: (k, v) => memoria.set(k, v) },
    mutacoesEmAndamento: new Map(), TEMPO_LIMITE_PEDIDO_MS: 1, toast() {}, window: { confirm: () => false }, novoAcaoId: () => `acao_${respostas.length}` });
  const comum = ler('mestre/JS/comum.js');
  vm.runInContext(comum.slice(comum.indexOf('const acoesIncertasMestre'), comum.indexOf('// Entra na sala')), ctx);
  await ctx.pedirAoServidor('master_entrar');
  perder = true;
  await assert.rejects(ctx.pedirAoServidor('master_teste', { delta: 1 }, { muda: true }));
  perder = false;
  await ctx.pedirAoServidor('master_teste', { delta: 1 }, { muda: true });
  assert.equal(executadas, 1);
  assert.equal(respostas[1].acaoId, respostas[2].acaoId);
  const antigo = respostas[1];
  registrar(criarComandos({ log: mudo }));
  let recusada;
  await eventos.master_teste(antigo, r => { recusada = r; });
  assert.equal(recusada.erro, 'acao_expirada');
  assert.equal(executadas, 1);
});
