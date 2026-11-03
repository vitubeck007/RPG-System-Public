/* Área de recorte quadrada sobre a foto inteira, com controles alternativos ao arraste. */
window.criarRecorteRetrato = function(img) {
  const area=document.createElement('div'); area.className='retrato-recorte';
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;canvas.setAttribute('aria-label','Foto com área de recorte. Arraste a área ou os marcadores para enquadrar.');
  const controles=document.createElement('div');controles.className='retrato-editor-controles';
  const selecao={x:144,y:80,tamanho:224}, ranges={};
  const escala=Math.min(480/img.naturalWidth,352/img.naturalHeight), w=img.naturalWidth*escala,h=img.naturalHeight*escala;
  const foto=ctx=>ctx.drawImage(img,(512-w)/2,(384-h)/2,w,h);
  const pontos=()=>[[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]];
  function desenhar(){
    selecao.tamanho=Math.max(48,Math.min(384,selecao.tamanho));selecao.x=Math.max(0,Math.min(512-selecao.tamanho,selecao.x));selecao.y=Math.max(0,Math.min(384-selecao.tamanho,selecao.y));
    const {x,y,tamanho:s}=selecao,ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,384);foto(ctx);
    ctx.fillStyle='#000a';ctx.fillRect(0,0,512,y);ctx.fillRect(0,y+s,512,384-y-s);ctx.fillRect(0,y,x,s);ctx.fillRect(x+s,y,512-x-s,s);
    ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.strokeRect(x,y,s,s);ctx.fillStyle='#ffffff';
    for(const [px,py] of pontos())ctx.fillRect(x+px*s-5,y+py*s-5,10,10);
    for(const [chave,range] of Object.entries(ranges)){range.value=selecao[chave];range.style.setProperty('--progresso',`${(Number(range.value)-Number(range.min))/(Number(range.max)-Number(range.min))*100}%`);}
  }
  for(const [chave,texto,max] of [['tamanho','Tamanho do recorte',384],['x','Horizontal',464],['y','Vertical',336]]){
    const label=document.createElement('label');label.textContent=texto;const input=document.createElement('input');input.type='range';input.min=chave==='tamanho'?48:0;input.max=max;input.value=selecao[chave];input.addEventListener('input',()=>{selecao[chave]=Number(input.value);desenhar();});ranges[chave]=input;label.append(input);controles.append(label);
  }
  const pos=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*512/r.width,y:(e.clientY-r.top)*384/r.height};};
  let arraste=null;
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;const p=pos(e),s=selecao.tamanho;
    const alca=pontos().find(([x,y])=>Math.abs(p.x-selecao.x-x*s)<=12 && Math.abs(p.y-selecao.y-y*s)<=12);
    if(!alca && (p.x<selecao.x||p.x>selecao.x+s||p.y<selecao.y||p.y>selecao.y+s))return;
    arraste={id:e.pointerId,p,antes:{...selecao},alca};canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!arraste||e.pointerId!==arraste.id)return;const p=pos(e),{antes,alca}=arraste;
    if(!alca){selecao.x=antes.x+p.x-arraste.p.x;selecao.y=antes.y+p.y-arraste.p.y;}
    else{
      const [ax,ay]=alca,dx=p.x-arraste.p.x,dy=p.y-arraste.p.y;
      const delta=ax===.5?(ay===0?-dy:dy):ay===.5?(ax===0?-dx:dx):Math.abs(dx)>Math.abs(dy)?(ax===0?-dx:dx):(ay===0?-dy:dy);
      const limite=Math.min(ax===0?antes.x+antes.tamanho:512-antes.x,ay===0?antes.y+antes.tamanho:384-antes.y);
      selecao.tamanho=Math.max(48,Math.min(limite,antes.tamanho+delta));
      selecao.x=ax===0?antes.x+antes.tamanho-selecao.tamanho:antes.x;selecao.y=ay===0?antes.y+antes.tamanho-selecao.tamanho:antes.y;
    }desenhar();
  });
  for(const tipo of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(tipo,()=>{arraste=null;});
  canvas.addEventListener('wheel',e=>{e.preventDefault();const antes=selecao.tamanho;selecao.tamanho=Math.max(48,Math.min(384,antes*(e.deltaY<0?.9:1.1)));selecao.x+=(antes-selecao.tamanho)/2;selecao.y+=(antes-selecao.tamanho)/2;desenhar();},{passive:false});
  area.append(canvas,controles);desenhar();
  return {elemento:area,exportar(){const saida=document.createElement('canvas');saida.width=saida.height=256;const ctx=saida.getContext('2d');ctx.scale(256/selecao.tamanho,256/selecao.tamanho);ctx.translate(-selecao.x,-selecao.y);foto(ctx);return saida;}};
};
