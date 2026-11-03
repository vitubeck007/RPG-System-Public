const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('jogador edita apenas descrição e anotações e não adiciona magia pelo catálogo',()=>{
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',url:'http://localhost'});
  const w=dom.window;
  try{
    const original={uid:'cx_teste',nome:'Chama',dice:'2d6',cost:{vital:'vigor',amount:3},alcance:'10m',efeito:'Queima',desc:'Antiga'};
    w.STATE={abilities:[],spells:[original]};w.personagemCarregado=true;
    w.socket={on(){}};let salvos=0;w.salvarMagias=()=>salvos++;w.RPGUI={abrirModal(){},fecharModal(){}};w.toast=()=>{};
    w.eval(fs.readFileSync('JS/regras.js','utf8')+'\n'+fs.readFileSync('JS/codice.js','utf8')+'\nrenderizarCodice=()=>{};');
    w.editarEntradaCodice('magias',original);
    assert.equal(w.document.getElementById('codice-painel-criar').classList.contains('hidden'),true);
    w.document.getElementById('codice-texto-desc').value='Nova';w.document.getElementById('codice-texto-notas').value='Usar contra gelo.';
    w.document.getElementById('codice-f-dados').value='99d20';
    w.criarEntradaCodice();
    assert.equal(salvos,1);assert.equal(w.STATE.spells[0].dice,'2d6');assert.equal(w.STATE.spells[0].desc,'Nova');assert.equal(w.STATE.spells[0].anotacoes,'Usar contra gelo.');assert.equal(w.STATE.spells[0].cost.amount,3);
    w.adicionarDoCatalogo('magias',{id:'nova',nome:'Nova'});assert.equal(w.STATE.spells.length,1);
  }finally{w.close();}
});
