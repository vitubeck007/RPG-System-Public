const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

test('recorte independente da foto, seleção ativa e persistência do retrato', async () => {
  const dom=new JSDOM(fs.readFileSync('mestre/figurantes.html','utf8'),{runScripts:'outside-only',url:'http://localhost'});
  const w=dom.window;
  try {
    w.campo=id=>w.document.getElementById(id);
    w.miniaturaDeImagem=url=>{if(!url)return null;const img=w.document.createElement('img');img.src=url;return img;};
    w.toast=msg=>{throw Error(msg);};
    let origemCarregada;
    w.Image=class{set src(url){origemCarregada=url;this.naturalWidth=400;this.naturalHeight=300;queueMicrotask(()=>this.onload());}};
    w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
    w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
    w.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){},fillRect(){},strokeRect(){}});
    w.HTMLCanvasElement.prototype.toBlob=cb=>cb(new w.Blob(['png']));
    w.AbortSignal.timeout=()=>undefined;
    w.fetch=async()=>({ok:true,json:async()=>({imagem:'/imagens-itens/retrato.png'})});
    const fig=fs.readFileSync('mestre/JS/figurantes.js','utf8');
    w.eval(fs.readFileSync('JS/regras.js','utf8')+'\n'+fs.readFileSync('JS/interface.js','utf8')+'\n'+fs.readFileSync('JS/recorte-retrato.js','utf8')+'\n'+fs.readFileSync('JS/editor-imagem.js','utf8')+'\n'+fig.slice(fig.indexOf('function definirModoImagemFig'),fig.indexOf('function atualizarArmaEditorFig')));
    await new Promise(r=>w.setTimeout(r,0));
    w.campo('fig-imagem').value='/foto-original.png';
    w.campo('fig-imagem-retrato').value='/retrato-antigo.png';
    w.definirModoImagemFig('retrato');
    const lapis=w.document.querySelector('[data-retrato-alvo="fig-imagem-retrato"]');
    assert.equal(lapis.hidden,false);assert.equal(lapis.disabled,false);
    assert.equal(w.document.querySelector('[data-retrato-alvo="fig-imagem"]').hidden,true);
    lapis.click();await new Promise(r=>w.setTimeout(r,0));
    assert.equal(origemCarregada,'/foto-original.png');
    assert.equal(w.campo('fig-imagem-retrato').value,'/retrato-antigo.png');
    const dialogo=w.document.querySelector('dialog');assert.ok(dialogo.classList.contains('retrato-editor-recorte'));
    assert.equal(dialogo.querySelector('canvas').width,512);
    const tamanho=dialogo.querySelector('input');tamanho.value='150';tamanho.dispatchEvent(new w.Event('input'));
    dialogo.querySelector('.retrato-acoes button:last-child').click();await new Promise(r=>w.setTimeout(r,0));
    assert.equal(w.campo('fig-imagem').value,'/foto-original.png');
    assert.equal(w.campo('fig-imagem-retrato').value,'/imagens-itens/retrato.png');
    const {normalizarNpc,normalizarInimigo}=require('../servidor/campanha');
    for(const normalizar of [normalizarNpc,normalizarInimigo])assert.equal(normalizar({nome:'Teste',imagemRetrato:'/imagens-itens/retrato.png'}).imagemRetrato,'/imagens-itens/retrato.png');
    w.definirModoImagemFig('foto');assert.equal(lapis.hidden,true);
  } finally {w.close();}
});

test('retratos: seleção, rotação, margem, envio e recuperação de falha', async () => {
  const dom = new JSDOM('<body><input id="fig-imagem" value="/retrato.png"></body>', {runScripts:'outside-only',url:'http://localhost'});
  const w = dom.window;
  try {
    w.toast = mensagem => { throw Error(mensagem); };
    w.Image = class { set src(valor) { this.naturalWidth=400;this.naturalHeight=200;queueMicrotask(()=>this.onload()); } };
    w.HTMLDialogElement.prototype.showModal = function(){this.open=true;};
    w.HTMLDialogElement.prototype.close = function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
    const giros=[];
    w.HTMLCanvasElement.prototype.getContext = () => ({clearRect(){},save(){},restore(){},translate(){},rotate(v){giros.push(v);},drawImage(){}});
    w.HTMLCanvasElement.prototype.toBlob = cb => cb(new w.Blob(['png'],{type:'image/png'}));
    w.AbortSignal.timeout = () => undefined;
    let falhar=true, envios=0;
    w.fetch=async(url, opcoes)=>{
      assert.equal(url,'/mestre/imagens-fotos');assert.equal(opcoes.headers['Content-Type'],'image/png');envios++;
      return {ok:!falhar,status:falhar?500:200,json:async()=>({imagem:'/imagens-itens/retrato.png'})};
    };
    w.eval(fs.readFileSync('JS/regras.js','utf8')+'\n'+fs.readFileSync('JS/interface.js','utf8')+'\n'+fs.readFileSync('JS/editor-imagem.js','utf8'));
    await new Promise(r=>w.setTimeout(r,0));
    assert.equal(w.document.querySelectorAll('.retrato-acoes').length,1);
    w.document.querySelectorAll('.retrato-acoes button')[1].click();
    await new Promise(r=>w.setTimeout(r,0));
    const dialogo=w.document.querySelector('dialog');assert.ok(dialogo.open);
    const ranges=dialogo.querySelectorAll('input');
    ranges[0].value='0.5';ranges[0].dispatchEvent(new w.Event('input'));
    ranges[3].value='90';ranges[3].dispatchEvent(new w.Event('input'));
    assert.ok(giros.some(v=>Math.abs(v-Math.PI/2)<1e-8));
    const aplicar=dialogo.querySelector('.retrato-acoes button:last-child');aplicar.click();
    await new Promise(r=>w.setTimeout(r,0));
    assert.equal(w.document.querySelector('#fig-imagem').value,'/retrato.png');assert.ok(dialogo.open);assert.equal(aplicar.disabled,false);
    falhar=false;aplicar.click();await new Promise(r=>w.setTimeout(r,0));
    assert.equal(envios,2);assert.equal(w.document.querySelector('#fig-imagem').value,'/imagens-itens/retrato.png');assert.equal(w.document.querySelector('dialog'),null);
  } finally {w.close();}
});
