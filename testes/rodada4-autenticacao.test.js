const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const acesso = require('../servidor/acesso');
const pm = require('../servidor/personagem');
const fonte = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
const trecho = (inicio, fim) => fonte.slice(fonte.indexOf(inicio), fonte.indexOf(fim, fonte.indexOf(inicio)));

function ambiente(t) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-rodada4-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(raiz)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(raiz).startsWith('rpg-rodada4-'));
    fs.rmSync(raiz, { recursive: true, force: true });
  });
  const rotas = {}, sockets = new Map();
  const ctx = vm.createContext({ ...acesso, fs, path, crypto, process, personagemModelo: pm,
    PLAYERS_PATH: raiz, COOKIE_SESSAO: 'rpg_sessao', MAX_SESSOES: 2000,
    SESSIONS: new Map(), gravarJsonAsync: pm.gravarJsonAsync, io: { sockets: { sockets } },
    app: { post(nome, tratar) { rotas[nome] = tratar; } } });
  vm.runInContext(trecho('function criarSessao(', '// Pasta raiz das contas'), ctx);
  vm.runInContext(trecho('const NOME_RESERVADO =', '//=============================== ARQUIVOS DE PERSONAGEM'), ctx);
  vm.runInContext(trecho('function exigirLogin(', 'app.get(["/", "/index.html"]'), ctx);
  const pedir = async (rota, corpo, headers = {}) => {
    const req = { body: corpo, headers, get: nome => headers[nome.toLowerCase()] || '' };
    const res = { statusCode: 200, headers: {}, status(n) { this.statusCode = n; return this; },
      setHeader(k, v) { this.headers[k] = v; }, json(v) { this.body = v; return this; }, redirect(v) { this.destino = v; } };
    await rotas[rota](req, res);
    return { req, res, ...res.body };
  };
  const login = (nome, senha, criarSeNaoExistir = true) => pedir('/api/login', { nome, senha, criarSeNaoExistir });
  return { raiz, ctx, sockets, pedir, login };
}

test('scrypt usa salt por credencial, confere a senha e recusa formato/custo adulterados', async () => {
  const senha = 'Teste-com-acentuação!';
  const [a, b] = await Promise.all([acesso.criarCredencial(senha), acesso.criarCredencial(senha)]);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.equal(a.senha, undefined);
  assert.equal(JSON.stringify(a).includes(senha), false);
  assert.equal((await acesso.verificarCredencial(senha, a)).valida, true);
  assert.equal((await acesso.verificarCredencial('incorreta', a)).valida, false);
  for (const ruim of [null, {}, { ...a, hash: 'quebrado', senha }, { ...a, parametros: { N: 2 ** 30, r: 8, p: 3 } }]) {
    assert.equal((await acesso.verificarCredencial(senha, ruim)).valida, false);
  }
});

test('cadastro e login gravam somente hash; entradas inválidas não criam conta', async t => {
  const a = ambiente(t), senha = 'Senha-fictícia!';
  const criada = await a.login('ana', senha);
  assert.equal(criada.success, true);
  const arquivo = path.join(a.raiz, 'ana', 'login.json'), antes = fs.readFileSync(arquivo, 'utf8');
  const credencial = JSON.parse(antes);
  assert.equal(credencial.algoritmo, 'scrypt');
  assert.equal(credencial.senha, undefined);
  assert.equal(antes.includes(senha), false);
  const entrou = await a.login('ana', senha, false);
  assert.equal(entrou.success, true);
  assert.notEqual(entrou.token, criada.token);
  assert.equal(fs.readFileSync(arquivo, 'utf8'), antes);
  assert.equal(entrou.hash, undefined);
  for (const [nome, valor] of [['vazia', ''], ['longa', 'x'.repeat(1025)], ['objeto', {}], ['con', 'x']]) {
    const r = await a.login(nome, valor);
    assert.equal(r.res.statusCode, 400);
    assert.equal(fs.existsSync(path.join(a.raiz, nome)), false);
  }
});

test('conta antiga só migra após senha correta e não cria backup em texto puro', async t => {
  const a = ambiente(t), dir = path.join(a.raiz, 'legado'); fs.mkdirSync(dir);
  const arquivo = path.join(dir, 'login.json'), antigo = JSON.stringify({ senha: 'Senha-antiga!' });
  fs.writeFileSync(arquivo, antigo);
  assert.equal((await a.login('legado', 'errada')).success, false);
  assert.equal(fs.readFileSync(arquivo, 'utf8'), antigo);
  assert.equal((await a.login('legado', 'Senha-antiga!')).success, true);
  const convertido = pm.lerJson(arquivo);
  assert.equal(convertido.senha, undefined);
  assert.equal((await acesso.verificarCredencial('Senha-antiga!', convertido)).valida, true);
  assert.deepEqual(fs.readdirSync(dir), ['login.json']);
});

test('falha na migração preserva credencial antiga e não abre sessão', async t => {
  const a = ambiente(t), dir = path.join(a.raiz, 'legado'); fs.mkdirSync(dir);
  const arquivo = path.join(dir, 'login.json'), antigo = JSON.stringify({ senha: 'Senha-antiga!' });
  fs.writeFileSync(arquivo, antigo);
  a.ctx.gravarJsonAsync = async () => { throw Error('falha simulada'); };
  const r = await a.login('legado', 'Senha-antiga!');
  assert.equal(r.res.statusCode, 500);
  assert.equal(a.ctx.SESSIONS.size, 0);
  assert.equal(fs.readFileSync(arquivo, 'utf8'), antigo);
});

test('cadastros simultâneos da mesma conta não sobrescrevem a primeira senha', async t => {
  const a = ambiente(t);
  const [primeiro, segundo] = await Promise.all([a.login('ana', 'Primeira!'), a.login('ana', 'Segunda!')]);
  assert.equal(primeiro.success, true);
  assert.equal(segundo.success, false);
  assert.equal((await acesso.verificarCredencial('Primeira!', pm.lerJson(path.join(a.raiz, 'ana', 'login.json')))).valida, true);
});

test('logout revoga token e cookie, desconecta fichas e impede reutilização; repetir é seguro', async t => {
  const a = ambiente(t), token = a.ctx.criarSessao('ana'), outra = a.ctx.criarSessao('bia');
  const criarSocket = t => ({ handshake: { auth: { token: t } }, data: { personagem: { player: 'ana' }, recebeEntregas: true },
    eventos: [], emit(nome, dados) { this.eventos.push({ nome, dados }); }, disconnect() { this.desconectado = true; } });
  const ficha1 = criarSocket(token), ficha2 = criarSocket(token), outraFicha = criarSocket(outra);
  a.sockets.set('f1', ficha1); a.sockets.set('f2', ficha2); a.sockets.set('f3', outraFicha);
  const headers = { authorization: `Bearer ${token}`, cookie: `rpg_sessao=${token}` };
  const r = await a.pedir('/api/logout', undefined, headers);
  assert.equal(r.success, true);
  assert.match(r.res.headers['Set-Cookie'], /Max-Age=0/);
  assert.equal(a.ctx.obterPlayerAutenticado(r.req), null);
  for (const ficha of [ficha1, ficha2]) {
    assert.equal(ficha.desconectado, true);
    assert.equal(ficha.data.personagem, undefined);
    assert.equal(ficha.eventos[0].dados.code, 'sessao_invalida');
  }
  assert.equal(outraFicha.desconectado, undefined);
  assert.equal(a.ctx.SESSIONS.has(outra), true);
  let passou = false;
  a.ctx.exigirLogin(r.req, r.res, () => { passou = true; });
  assert.equal(passou, false);
  assert.equal(r.res.destino, '/login');
  assert.equal((await a.pedir('/api/logout', undefined, headers)).success, true);
});

test('logout por cookie funciona e Bearer de outra aba não encerra a conta atual do cookie', async t => {
  const a = ambiente(t), primeiro = a.ctx.criarSessao('ana'), segundo = a.ctx.criarSessao('bia');
  const r = await a.pedir('/api/logout', undefined, { authorization: `Bearer ${primeiro}`, cookie: `rpg_sessao=${segundo}` });
  assert.equal(a.ctx.SESSIONS.has(primeiro), false);
  assert.equal(a.ctx.SESSIONS.has(segundo), true);
  assert.equal(r.res.headers['Set-Cookie'], undefined);
  const porCookie = await a.pedir('/api/logout', undefined, { cookie: `rpg_sessao=${segundo}` });
  assert.equal(a.ctx.SESSIONS.has(segundo), false);
  assert.match(porCookie.res.headers['Set-Cookie'], /Max-Age=0/);
});

test('botão Sair aguarda confirmação, bloqueia clique duplicado e conserva sessão se a rede falhar', async t => {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { if (!e.message.includes('navigation')) throw e; });
  let resolver, chamadas = 0;
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '../login/login.html'), 'utf8'), {
    url: 'http://teste.local/selecao', runScripts: 'dangerously', virtualConsole: vc,
    beforeParse(w) {
      w.sessionStorage.setItem('rpg_player', 'ana'); w.sessionStorage.setItem('rpg_token', 'token-teste');
      w.sessionStorage.setItem('rpg_character', '{}'); w.sessionStorage.setItem('rpg_character_name', 'Herói');
      w.eval(fs.readFileSync(path.join(__dirname, '../JS/interface.js'), 'utf8'));
      w.RPGUI.pedirJSON = async (url, opcoes) => {
        assert.equal(url, '/api/logout'); assert.equal(opcoes.headers.Authorization, 'Bearer token-teste'); chamadas++;
        return new Promise(r => { resolver = r; });
      };
      w.fetch = async () => ({ ok: true, json: async () => ({ success: true, personagens: [] }) });
    },
  });
  t.after(() => dom.window.close());
  const w = dom.window, botao = w.document.getElementById('btn-logout');
  const primeiro = w.deslogar(); await w.deslogar();
  assert.equal(chamadas, 1);
  assert.equal(botao.disabled, true);
  assert.equal(w.sessionStorage.getItem('rpg_token'), 'token-teste');
  resolver({ response: { ok: false }, result: { success: false } }); await primeiro;
  assert.equal(w.sessionStorage.getItem('rpg_token'), 'token-teste');
  assert.equal(botao.disabled, false);
  assert.match(w.document.getElementById('selection-message').textContent, /não foi possível confirmar/i);
  const segunda = w.deslogar();
  resolver({ response: { ok: true }, result: { success: true } }); await segunda;
  for (const chave of ['rpg_player', 'rpg_token', 'rpg_character', 'rpg_character_name']) assert.equal(w.sessionStorage.getItem(chave), null);
});
