const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const pm = require('../servidor/personagem');
const regras = require('../JS/regras');
const campanha = require('../servidor/campanha');
const { criarEntregas } = require('../servidor/entregas');
const fonte = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
const ler = arquivo => fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8');
const trecho = (inicio, fim) => fonte.slice(fonte.indexOf(inicio), fonte.indexOf(fim, fonte.indexOf(inicio)));
const mudo = { log() {}, warn() {}, error() {} };

function ambiente(t) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-rodada3-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(raiz)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(raiz).startsWith('rpg-rodada3-'));
    fs.rmSync(raiz, { recursive: true, force: true });
  });
  const identidade = { player: 'ana', nomePasta: 'Heroi_1234' }, dir = path.join(raiz, identidade.player, identidade.nomePasta);
  fs.mkdirSync(dir, { recursive: true });
  const gravar = (arquivo, dados) => fs.writeFileSync(path.join(dir, `${arquivo}.json`), JSON.stringify(dados));
  for (const arquivo of ['status', 'inventario', 'magias', 'habilidades']) gravar(arquivo, pm.DEFAULTS[arquivo]());
  const entregas = criarEntregas({ pastaDoPersonagem: (p, n) => path.join(raiz, p, n), log: mudo });
  const ctx = vm.createContext({ ...pm, personagemModelo: pm, entradaPublica: campanha.entradaPublica,
    path, PLAYERS_PATH: raiz, entregas });
  vm.runInContext(trecho('async function salvarArquivoPersonagem(', '// O nome exibido vem de perfil'), ctx);
  const salvar = (arquivo, dados) => ctx.salvarArquivoPersonagem(identidade.player, identidade.nomePasta, arquivo, dados);
  return { raiz, dir, gravar, salvar, entregas, identidade };
}

const magia = () => ({ uid: 'cx_magia', catalogId: 'mag_fogo', nome: 'Fogo', dice: '1d6',
  cost: { vital: 'vigor', amount: 3 }, desc: 'Chamas', efeito: 'Causa dano', estiloFundo: 1 });
const item = (extra = {}) => ({ id: 'pocao', uid: 'it_pocao', name: 'Poção', weight: 1, maxStack: 5,
  quantity: 1, w: 1, h: 1, col: 1, row: 1, ...extra });

test('informações exclusivas do mestre não entram em catálogo, entrega ou cópia antiga', () => {
  const poder = { ...magia(), id: 'mag_fogo', publico: true, descLonga: 'SEGREDO', segredoFuturo: 'RESERVADO' };
  for (const projetar of [campanha.entradaParaFicha, campanha.entradaPublica]) {
    const publico = projetar(poder);
    assert.equal(publico.descLonga, undefined);
    assert.equal(publico.segredoFuturo, undefined);
    assert.equal(publico.efeito, poder.efeito);
    publico.cost.amount = 99;
    assert.equal(poder.cost.amount, 3);
  }
  assert.equal(pm.NORMALIZADORES.magias({ items: [poder] }).items[0].descLonga, undefined);
  const ctx = vm.createContext({ entradaPublica: campanha.entradaPublica });
  vm.runInContext(trecho('const enviarEntrega =', 'const abaDoPersonagem =') + '\nglobalThis.enviar = enviarEntrega;', ctx);
  let recebida;
  ctx.enviar({ emit(nome, dados) { recebida = dados; } }, { tipo: 'magias', entregaId: 'ent_fogo', entrada: poder });
  assert.equal(recebida.entrada.descLonga, undefined);
});

test('servidor aceita descrição e notas; rejeita alterações mecânicas e remoção de magia', async t => {
  const a = ambiente(t), original = pm.NORMALIZADORES.magias({ items: [magia()] });
  a.gravar('magias', original);
  const editada = { ...original, items: [{ ...original.items[0], desc: 'Descrição pessoal', anotacoes: 'Lembrete' }] };
  assert.equal((await a.salvar('magias', editada)).ok, true);
  for (const mudanca of [{ dice: '20d20' }, { cost: { vital: 'vigor', amount: 0 } }, { nome: 'Outro' }, { efeito: 'Outro efeito' }, { estiloFundo: 8 }]) {
    const r = await a.salvar('magias', { items: [{ ...editada.items[0], ...mudanca }] });
    assert.equal(r.codigo, 'poder_nao_autorizado', JSON.stringify(mudanca));
  }
  assert.equal((await a.salvar('magias', { items: [] })).codigo, 'poder_nao_autorizado');
  assert.equal(pm.lerJson(path.join(a.dir, 'magias.json')).items[0].dice, '1d6');
});

test('nova magia exige entrega pendente compatível; duplicação e custo forjado são recusados', async t => {
  const a = ambiente(t), nova = magia();
  assert.equal((await a.salvar('magias', { items: [nova] })).codigo, 'poder_nao_autorizado');
  const { uid, ...entrada } = nova;
  await a.entregas.adicionar('ana', 'Heroi_1234', { tipo: 'magias', entrada });
  const forjada = { ...nova, cost: { vital: 'vigor', amount: 0 } };
  assert.equal((await a.salvar('magias', { items: [forjada] })).codigo, 'poder_nao_autorizado');
  assert.equal((await a.salvar('magias', { items: [nova] })).ok, true);
  assert.equal((await a.salvar('magias', { items: [nova, { ...nova, uid: 'cx_duplicada' }] })).codigo, 'poder_nao_autorizado');
  const salvo = pm.lerJson(path.join(a.dir, 'magias.json'));
  assert.equal(salvo.items.length, 1);
});

test('habilidade própria continua podendo ser criada; edição posterior é apenas textual', async t => {
  const a = ambiente(t), habilidade = { uid: 'cx_propria', nome: 'Golpe', dice: '1d4' };
  assert.equal((await a.salvar('habilidades', { items: [habilidade] })).ok, true);
  assert.equal((await a.salvar('habilidades', { items: [{ ...habilidade, desc: 'Novo texto' }] })).ok, true);
  assert.equal((await a.salvar('habilidades', { items: [{ ...habilidade, dice: '100d20' }] })).codigo, 'poder_nao_autorizado');
});

test('mochila valida células ocupadas, limites, pilhas, impossíveis de armazenar e duas mãos', async t => {
  const a = ambiente(t), base = pm.DEFAULTS.inventario();
  const primeiro = item({ formato: [[0, 0], [0, 1], [1, 1]], w: 2, h: 2 });
  const segundo = item({ uid: 'it_segundo', col: 2 });
  const valido = { ...base, items: [primeiro, segundo] };
  assert.equal((await a.salvar('inventario', valido)).ok, true, 'a célula livre do L pode ser usada');
  const antes = fs.readFileSync(path.join(a.dir, 'inventario.json'), 'utf8');
  const ruins = [
    { ...base, items: [item(), item({ uid: 'it_outro' })] },
    { ...base, items: [item({ col: 4 })] },
    { ...base, items: [item({ quantity: 6 })] },
    { ...base, items: [item({ impossivelArmazenar: true })] },
    { ...base, items: [item({ formato: [[0, 0], [2, 2]] })] },
    { ...base, items: [item()], equipped: { ...base.equipped, back: item() } },
    { ...base, equipped: { ...base.equipped, mainHand: item({ uid: 'it_duas', twoHanded: true }), offHand: item({ uid: 'it_escudo' }) } },
  ];
  for (const dados of ruins) assert.equal((await a.salvar('inventario', dados)).codigo, 'inventario_invalido');
  assert.equal(fs.readFileSync(path.join(a.dir, 'inventario.json'), 'utf8'), antes);
  const maior = { ...base, items: [item({ col: 5, row: 4 })], equipped: { ...base.equipped,
    backpack: item({ uid: 'it_mochila', isBackpackItem: true, backpackType: 'tatica' }) } };
  assert.equal((await a.salvar('inventario', maior)).ok, true);
});

test('card exige sessão, personagem carregado e ID correspondente; nome e vitais vêm do servidor', async t => {
  const a = ambiente(t), eventos = {}, enviados = [];
  const status = pm.DEFAULTS.status(); status.hp = { current: 8, max: 10 }; a.gravar('status', status);
  const ctx = vm.createContext({ personagemModelo: pm, lerArquivosNormalizados: pm.lerArquivosNormalizados, path,
    PLAYERS_PATH: a.raiz, console: mudo, playersState: {}, jogadoresRecentes: new Map(), SESSIONS: new Map([['sessao', 'ana']]),
    socket: { id: 'socket_1', connected: true, data: {}, handshake: { auth: { token: 'sessao' } }, emit(nome, dados) { enviados.push({ nome, dados }); } },
    io: { sockets: { sockets: new Map() }, emit(nome, dados) { enviados.push({ nome, dados }); } },
    ouvir(nome, fn) { eventos[nome] = fn; }, naFilaPersonagem: (p, n, fn) => fn(), estadoPublico: e => e,
    normalizarVitais: v => pm.NORMALIZADORES.status(v) });
  vm.runInContext(trecho('  ouvir("player_update",', '  ouvir("client_log",'), ctx);
  const id = regras.idDaFicha(a.identidade);
  await eventos.player_update({ id, name: 'Inventado', vitals: status });
  assert.equal(Object.keys(ctx.playersState).length, 0);
  ctx.socket.data.personagem = a.identidade; ctx.socket.data.nomePersonagem = 'Nome salvo';
  await eventos.player_update({ id: 'char_falso', vitals: status });
  ctx.SESSIONS.clear();
  await eventos.player_update({ id, vitals: status });
  assert.equal(Object.keys(ctx.playersState).length, 0);
  ctx.SESSIONS.set('sessao', 'ana');
  await eventos.player_update({ id, name: 'Inventado', vitals: { hp: { current: 9999 } } });
  assert.equal(ctx.playersState[id].name, 'Nome salvo');
  assert.equal(ctx.playersState[id].vitals.hp.current, 8);
});

test('poder grande válido pode ser salvo, entregue e aceito pela ficha com o mesmo limite', async t => {
  const a = ambiente(t), c = campanha.criarCampanha(path.join(a.raiz, 'campanha'), { log: mudo }).iniciar();
  const salvo = await c.salvarItem('magias', { nome: 'Completa', dice: '1d6', desc: 'd'.repeat(2000), efeito: 'e'.repeat(4000),
    imagem: 'https://exemplo.invalid/' + 'a'.repeat(1900), efeitos: Array.from({ length: 10 }, () => 'x'.repeat(200)) });
  const entrada = campanha.entradaParaFicha(salvo);
  assert.ok(JSON.stringify(entrada).length > 8000);
  const entrega = await a.entregas.adicionar('ana', 'Heroi_1234', { tipo: 'magias', entrada });
  const ctx = vm.createContext({ ehEntradaCodice: v => v && typeof v === 'object', CODICE_TIPOS: { magias: {} }, TAMANHO_MAX_ENTRADA_PODER: regras.TAMANHO_MAX_ENTRADA_PODER });
  const codigo = ler('JS/codice.js');
  vm.runInContext(codigo.slice(codigo.indexOf('const ENTREGA_ID_VALIDO'), codigo.indexOf('function aplicarEntrega(', codigo.indexOf('const ENTREGA_ID_VALIDO'))), ctx);
  assert.equal(ctx.entregaValida(entrega), true);
  assert.equal((await a.salvar('magias', { items: [{ ...entrada, uid: 'cx_grande' }] })).ok, true);
  await assert.rejects(a.entregas.adicionar('ana', 'Heroi_1234', { tipo: 'magias', entrada: { catalogId: 'mag_excesso', desc: 'x'.repeat(regras.TAMANHO_MAX_ENTRADA_PODER) } }), { codigo: 'entrega_invalida' });
});

test('leitura ausente ou corrompida fica indisponível e o mestre recebe os nomes dos arquivos', t => {
  const a = ambiente(t);
  fs.writeFileSync(path.join(a.dir, 'status.json'), '{ quebrado');
  const leitura = pm.lerArquivosNormalizados(a.dir, ['status', 'perfil', 'inventario']);
  assert.equal(leitura.status, null);
  assert.equal(leitura.perfil, null);
  assert.ok(leitura.inventario);
  assert.match(leitura.errosLeitura.status, /status.json/);
  const eventos = {}, enviados = [], id = regras.idDaFicha(a.identidade);
  const ctx = vm.createContext({ fs, path, PLAYERS_PATH: a.raiz, ARQUIVOS_DO_MESTRE: ['status', 'perfil', 'inventario'],
    SALA_MESTRES: 'mestres', playersState: { [id]: a.identidade }, normalizarId: v => v,
    lerArquivosNormalizados: pm.lerArquivosNormalizados, ouvir(nome, fn) { eventos[nome] = fn; },
    socket: { join() {}, emit(nome, dados) { enviados.push({ nome, dados }); } } });
  vm.runInContext(trecho('  ouvir("master_get_personagem",', '  ouvir("master_update_config",'), ctx);
  eventos.master_get_personagem({ charId: id });
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].nome, 'master_feedback');
  assert.equal(enviados[0].dados.erroLeitura, true);
  assert.match(enviados[0].dados.message, /status.json.*perfil.json/);
  assert.equal(fs.readFileSync(path.join(a.dir, 'status.json'), 'utf8'), '{ quebrado');
  const numericoInvalido = pm.DEFAULTS.status(); numericoInvalido.hp.current = 'valor inválido';
  a.gravar('status', numericoInvalido);
  assert.equal(pm.lerArquivosNormalizados(a.dir, ['status']).status, null, 'valor inválido não pode se passar por zero real');
});

test('empilhamento mistura apenas propriedades equivalentes, ignorando instância e posição', () => {
  const a = item({ dice: '1d6', desc: 'Versão antiga' });
  assert.equal(regras.itensEmpilhaveis(a, { ...a, uid: 'it_outro', quantity: 2, col: 2 }), true);
  for (const mudanca of [{ weight: 2 }, { dice: '1d8' }, { desc: 'Versão nova' }, { maxStack: 9 }, { formato: [[0, 0], [0, 1]] }])
    assert.equal(regras.itensEmpilhaveis(a, { ...a, ...mudanca }), false);
  const ctx = vm.createContext({ ...regras, STATE: { backpackItems: [a] },
    limiteDaPilha: i => i.maxStack, configMochila: () => regras.CONFIGURACOES_MOCHILA.bolsos,
    larguraDoItem: i => i.w, alturaDoItem: i => i.h, novoUidItem: () => 'it_novo',
    calcularLayout: itens => ({ semEspaco: [], colocados: itens.map(item => ({ item, col: 1, row: 1 })) }),
    aplicarLayout() {}, registrarNoTerminal() {}, renderizarMochilaGrid() {}, salvarInventario() {}, toast() {} });
  const codigo = ler('JS/inventario.js'), inicio = codigo.indexOf('function adicionarItemAoInventario(');
  vm.runInContext(codigo.slice(inicio, codigo.indexOf('\nfunction ', inicio + 10)), ctx);
  ctx.adicionarItemAoInventario({ ...a, uid: 'it_entrega', weight: 2 }, 1);
  assert.equal(ctx.STATE.backpackItems.length, 2);
  assert.equal(ctx.STATE.backpackItems[0].quantity, 1);
});
