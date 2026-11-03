const {test} = require('node:test');
const assert = require('node:assert/strict');
const {abrirPaginaMestre} = require('./ajuda/ambiente');
const tick = () => new Promise(resolve => setImmediate(resolve));

test('excluir caído, remover combatente e excluir modelo confirmam antes do envio e evitam duplicação', async () => {
  const pg = await abrirPaginaMestre({dir:process.cwd(), url:'http://localhost'}, 'figurantes');
  try {
    const modelo = {id:'ini_teste',nome:'Teste',hpMax:10,energia:{atual:10,max:10},habilidades:[],magias:[]};
    const combatente = {...modelo,alvoId:'cb_teste',modeloId:modelo.id,tipo:'inimigo',nome:'Teste 1',hp:{atual:0,max:10},derrotado:true};
    pg.window.pedidos = [];
    pg.run(`figurantes.inimigos=[${JSON.stringify(modelo)}]; figurantes.batalha={ativa:true,combatentes:[${JSON.stringify(combatente)}]};
      pedirAoServidor = async (evento,dados) => { window.pedidos.push({evento,dados}); return new Promise(resolve => { window.responder = resolve; }); };`);
    const resumo = pg.run(`resumoCombatenteFig(${JSON.stringify(combatente)},true)`);
    const ficha = pg.run(`cartaoFigurante(${JSON.stringify(combatente)},'batalha',true)`);
    const biblioteca = pg.run(`cartaoFigurante(${JSON.stringify(modelo)},'inimigos',false)`);
    pg.document.body.append(resumo,ficha,biblioteca);
    const achar = (area, texto) => [...area.querySelectorAll('button')].find(b=>b.textContent.trim()===texto);
    const casos = [[achar(resumo,'Excluir'),'master_batalha_remover','alvoId',combatente.alvoId], [achar(ficha,'Remover da batalha'),'master_batalha_remover','alvoId',combatente.alvoId], [achar(biblioteca,'Excluir'),'master_campanha_remover','id',modelo.id]];
    for(const [botao,evento,chave,id] of casos){
      assert.ok(botao);
      const antes=pg.window.pedidos.length;
      botao.click();
      assert.ok(pg.document.querySelector('.rpg-confirmacao'));
      assert.equal(pg.window.pedidos.length,antes);
      pg.document.querySelector('.rpg-confirmacao button').click();await tick();
      assert.equal(pg.window.pedidos.length,antes);assert.equal(botao.disabled,false);
      botao.click();botao.click();
      assert.equal(pg.document.querySelectorAll('.rpg-confirmacao').length,1);
      pg.document.querySelector('.rpg-confirmacao button:last-child').click();await tick();
      assert.equal(pg.window.pedidos.length,antes+1);assert.equal(botao.disabled,true);
      assert.equal(pg.window.pedidos[antes].evento,evento);assert.equal(pg.window.pedidos[antes].dados[chave],id);
      botao.click();assert.equal(pg.window.pedidos.length,antes+1);
      pg.window.responder({});await tick();assert.equal(botao.disabled,false);
    }
    assert.deepEqual(pg.erros,[]);
  } finally {pg.fechar();}
});
