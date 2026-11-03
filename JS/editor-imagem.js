/* Retratos: editor compartilhado pelo jogador e pelos figurantes. */
window.EditorRetrato = {
  montar(input, { mestre = false, modo = 'foto', origemPadrao = () => '' } = {}) {
    if (!input || input.dataset.editorRetrato) return;
    input.dataset.editorRetrato = 'true';
    const criar = (tag, texto) => { const el = document.createElement(tag); if (texto) el.textContent = texto; return el; };
    const barra = criar('div'); barra.className = 'retrato-acoes';
    const escolher = criar('button', 'Escolher imagem'), editar = criar('button', 'Editar imagem');
    escolher.type = editar.type = 'button';
    const arquivo = criar('input'); arquivo.type = 'file'; arquivo.accept = 'image/png,image/jpeg,image/webp'; arquivo.hidden = true;
    barra.append(escolher, editar, arquivo); input.after(barra);
    const retrato = input.id.startsWith('fig-imagem') ? document.querySelector('.fig-retrato-bloco') : input.closest('.sheet-retrato-editor')?.querySelector('.sheet-retrato-bloco');
    if (retrato) {
      editar.textContent = '';
      const lapis = criar('i'); lapis.className = 'fa-solid fa-pencil'; lapis.setAttribute('aria-hidden', 'true');
      editar.append(lapis); editar.className = 'fig-retrato-editar';
      editar.title = 'Editar imagem'; editar.setAttribute('aria-label', 'Editar imagem');
      (retrato.querySelector('.sheet-retrato-menu-acoes') || retrato).append(editar);
      editar.dataset.retratoAlvo = input.id;
      editar.hidden = input.closest('label')?.hidden || input.closest('#avatar-retrato-campo')?.hidden || false;
    }
    const origemEdicao = () => modo === 'retrato' ? origemPadrao() : input.dataset.fotoOriginal || input.value || origemPadrao();
    const atualizar = () => { editar.disabled = !urlDeImagem(origemEdicao()); escolher.textContent = input.value ? 'Alterar imagem' : 'Escolher imagem'; };
    input.addEventListener('input', atualizar); input.addEventListener('focus', atualizar);
    new MutationObserver(atualizar).observe(input.closest('[role="dialog"], .fig-overlay') || input.parentElement, {attributes:true,attributeFilter:['class','hidden']});
    let ativo = false;
    const abrir = async origem => {
      if (ativo) return;
      ativo = true;
      escolher.disabled = editar.disabled = true;
      barra.setAttribute('aria-busy', 'true');
      let objeto = null, dialogo = null;
      try {
        if (origem instanceof File && (!['image/png','image/jpeg','image/webp'].includes(origem.type) || origem.size > 10*1024*1024)) throw Error('Escolha PNG, JPG ou WebP de até 10 MB.');
        const img = new Image(); img.crossOrigin = 'anonymous';
        const url = origem instanceof File ? (objeto = URL.createObjectURL(origem)) : urlDeImagem(origem);
        if (!url) throw Error('Escolha uma imagem primeiro.');
        await new Promise((resolve,reject)=>{img.onload=resolve; img.onerror=()=>reject(Error('Não foi possível abrir a imagem. Escolha um arquivo do computador.')); img.src=url;});
        dialogo = criar('dialog'); dialogo.className = 'retrato-editor';
        const titulo = criar('h3',modo==='foto'?'Enquadrar foto':'Enquadrar retrato'); titulo.id='retrato-editor-titulo'; dialogo.setAttribute('aria-labelledby',titulo.id);
        const dica = criar('p','Arraste para mover. Use a roda do mouse para aproximar.');
        const corpo=criar('div'); corpo.className='retrato-editor-corpo';
        const canvas=criar('canvas'); canvas.width=canvas.height=256; canvas.setAttribute('aria-label','Prévia do retrato');
        const recorte = modo === 'retrato' ? criarRecorteRetrato(img) : null;
        const controles=criar('div'); controles.className='retrato-editor-controles';
        const valores={zoom:1,x:0,y:0,rotacao:0}, ranges={};
        const desenhar = () => {
          const ctx=canvas.getContext('2d'), escala=Math.min(256/img.naturalWidth,256/img.naturalHeight)*valores.zoom;
          ctx.clearRect(0,0,256,256); ctx.save(); ctx.translate(128+valores.x*2.56,128+valores.y*2.56); ctx.rotate(valores.rotacao*Math.PI/180);
          ctx.drawImage(img,-img.naturalWidth*escala/2,-img.naturalHeight*escala/2,img.naturalWidth*escala,img.naturalHeight*escala);ctx.restore();
          for(const [chave,range] of Object.entries(ranges)){range.value=valores[chave];range.style.setProperty('--progresso',`${(valores[chave]-Number(range.min))/(Number(range.max)-Number(range.min))*100}%`);}
        };
        for(const [chave,texto,min,max,step] of [['zoom','Aproximação',0.2,4,0.01],['x','Horizontal',-100,100,1],['y','Vertical',-100,100,1],['rotacao','Rotação',-180,180,1]]){
          const label=criar('label',texto), range=criar('input');range.type='range';range.min=min;range.max=max;range.step=step;range.value=valores[chave];
          range.addEventListener('input',()=>{valores[chave]=Number(range.value);desenhar();});ranges[chave]=range;label.append(range);controles.append(label);
        }
        let arraste=null;
        canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;arraste={id:e.pointerId,x:e.clientX,y:e.clientY,antesX:valores.x,antesY:valores.y};canvas.setPointerCapture(e.pointerId);});
        canvas.addEventListener('pointermove',e=>{if(!arraste||arraste.id!==e.pointerId)return;const tamanho=canvas.getBoundingClientRect().width;valores.x=Math.max(-100,Math.min(100,arraste.antesX+(e.clientX-arraste.x)/tamanho*100));valores.y=Math.max(-100,Math.min(100,arraste.antesY+(e.clientY-arraste.y)/tamanho*100));desenhar();});
        for(const evento of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(evento,()=>{arraste=null;});
        canvas.addEventListener('wheel',e=>{e.preventDefault();valores.zoom=Math.max(.2,Math.min(4,valores.zoom*(e.deltaY<0?1.1:1/1.1)));desenhar();},{passive:false});
        const erro=criar('p');erro.className='retrato-editor-erro';erro.setAttribute('role','status');
        const acoes=criar('div');acoes.className='retrato-acoes';
        const cancelar=criar('button','Cancelar'), aplicar=criar('button',modo==='foto'?'Aplicar foto':'Aplicar retrato');cancelar.type=aplicar.type='button';
        cancelar.onclick=()=>dialogo.close();
        let enviando=false;
        dialogo.addEventListener('cancel',e=>{e.preventDefault(); e.stopPropagation();if(!enviando)dialogo.close();});
        // Impede Escape de fechar também a janela que está atrás do editor.
        dialogo.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Tab')e.stopPropagation();});
        aplicar.onclick=async()=>{
          if(enviando)return;enviando=true;dialogo.setAttribute('aria-busy','true');erro.textContent='Enviando imagem…';
          const elementos=[...dialogo.querySelectorAll('button,input')];elementos.forEach(e=>e.disabled=true);
          try{
            let saida=recorte?recorte.exportar():canvas;
            if(modo==='foto') {
              const tamanho=Math.min(1024,Math.max(img.naturalWidth,img.naturalHeight));
              saida=document.createElement('canvas');saida.width=saida.height=tamanho;
              const ctx=saida.getContext('2d'),escala=Math.min(tamanho/img.naturalWidth,tamanho/img.naturalHeight)*valores.zoom;
              ctx.translate(tamanho/2+valores.x*tamanho/100,tamanho/2+valores.y*tamanho/100);ctx.rotate(valores.rotacao*Math.PI/180);
              ctx.drawImage(img,-img.naturalWidth*escala/2,-img.naturalHeight*escala/2,img.naturalWidth*escala,img.naturalHeight*escala);
            }
            const blob=await new Promise(resolve=>saida.toBlob(resolve,'image/png'));if(!blob)throw Error('Não foi possível preparar a imagem.');
            const token=sessionStorage.getItem('rpg_token');
            const response=await fetch(modo==='foto'?(mestre?'/mestre/imagens-fotos':'/api/imagens-fotos'):(mestre?'/mestre/imagens-itens':'/api/imagens'),{method:'POST',headers:{'Content-Type':'image/png',...(!mestre&&token?{Authorization:`Bearer ${token}`}:{})},body:blob,signal:AbortSignal.timeout(15000)});
            if(!response.ok)throw Error(response.status===401?'Sua sessão terminou. Entre novamente.':'Falha ao enviar a imagem. Tente novamente.');
            const dados=await response.json();if(!urlDeImagem(dados.imagem))throw Error('O servidor não confirmou a imagem.');
            if(input.id==='avatar-url-input' && typeof origem==='string')input.dataset.fotoOriginal=input.dataset.fotoOriginal || origem;
            input.value=dados.imagem;input.dispatchEvent(new Event('input',{bubbles:true}));if(input.id.startsWith('avatar-'))input.dispatchEvent(new Event('change',{bubbles:true}));atualizar();dialogo.close();
          }catch(e){erro.textContent=e.message||'Falha no envio.';}
          finally{enviando=false;dialogo.removeAttribute('aria-busy');elementos.forEach(e=>e.disabled=false);}
        };
        if(recorte){titulo.textContent='Recortar retrato';dica.textContent='Arraste a área para mover e os quadradinhos para redimensionar.';corpo.append(recorte.elemento);dialogo.classList.add('retrato-editor-recorte');}else corpo.append(canvas,controles);
        acoes.append(cancelar,aplicar);dialogo.append(titulo,dica,corpo,erro,acoes);document.body.append(dialogo);
        dialogo.addEventListener('close',()=>{dialogo.remove();ativo=false;atualizar();editar.focus();},{once:true});
        dialogo.showModal();desenhar();
      }catch(e){if(dialogo)dialogo.remove();ativo=false;toast(e.message||'Não foi possível abrir o editor.','error');}
      finally{if(objeto)URL.revokeObjectURL(objeto);escolher.disabled=false;barra.removeAttribute('aria-busy');atualizar();}
    };
    if (input.id.startsWith('avatar-')) {
      barra.hidden = true;
      if (modo === 'foto') {
        const enviar = criar('button'); enviar.type='button'; enviar.className='sheet-retrato-enviar';
        enviar.title='Escolher foto pelo nome'; enviar.setAttribute('aria-label','Escolher foto pelo nome do arquivo');
        const icone=criar('i');icone.className='fa-solid fa-camera';icone.setAttribute('aria-hidden','true');enviar.append(icone);
        enviar.onclick=()=>{retrato.querySelector('details').open=false;abrirFotoPlayerPorNome();};retrato.querySelector('.sheet-retrato-menu-acoes').prepend(enviar);
      }
    }
    escolher.onclick=()=>arquivo.click();
    arquivo.onchange=()=>{const f=arquivo.files[0];arquivo.value='';if(f)abrir(f);};
    editar.onclick=()=>{const menu=retrato?.querySelector('.sheet-retrato-menu');if(menu)menu.open=false;abrir(origemEdicao());};
    atualizar();
    return {atualizar};
  }
};
document.addEventListener('DOMContentLoaded',()=>{
  const figurante=document.getElementById('fig-imagem');if(figurante)EditorRetrato.montar(figurante,{mestre:true});
  const retrato=document.getElementById('fig-imagem-retrato');if(retrato)EditorRetrato.montar(retrato,{mestre:true,modo:'retrato',origemPadrao:()=>figurante.value});
  const avatar=document.getElementById('avatar-url-input');if(avatar)EditorRetrato.montar(avatar);
  const avatarRetrato=document.getElementById('avatar-retrato-input');if(avatarRetrato)EditorRetrato.montar(avatarRetrato,{modo:'retrato',origemPadrao:()=>avatar.dataset.fotoOriginal || avatar.value});
  document.querySelectorAll('[data-editor-imagem-mestre]').forEach(input=>EditorRetrato.montar(input,{mestre:true}));
});
