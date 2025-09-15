(function(){"use strict";
  var EXEC = 'https://script.google.com/macros/s/AKfycbzTahtL4J7SBb1MTtOjkS3Kxht77upE0K4c0ipf0vttpCplHkeQcP0db0cDMzeQR-4C/exec';
  function ready(fn){ if(document.readyState!=="loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function(){
    var form = document.getElementById('cadastroForm') || document.querySelector('form');
    if(!form) return;

    form.setAttribute('action', EXEC);
    form.setAttribute('method','POST');
    form.setAttribute('enctype','multipart/form-data');
    form.setAttribute('target','submitFrame');
    try { form.onsubmit = null; } catch(e){}

    var iframe = document.getElementById('submitFrame');
    if(!iframe){ iframe=document.createElement('iframe'); iframe.name='submitFrame'; iframe.id='submitFrame'; iframe.style.display='none'; form.appendChild(iframe); }
    var first = true;
    var submitBtn = form.querySelector('button[type=submit],input[type=submit]');

    iframe.addEventListener('load', function(){ if(first){first=false; return;}
      Array.from(form.querySelectorAll('input[type=file][data-disabled-during-submit="1"]')).forEach(function(inp){ inp.disabled=false; inp.removeAttribute('data-disabled-during-submit'); });
      if(submitBtn){ submitBtn.disabled=false; if(submitBtn.tagName==='BUTTON') submitBtn.textContent = submitBtn.dataset._txt || 'Enviar'; else submitBtn.value = submitBtn.dataset._txt || 'Enviar'; }
      try { form.reset(); } catch(e){}
      // Alerta simples para não mexer no layout
      alert('Cadastro enviado com sucesso!');
    });

    // Captura o submit antes de qualquer outro handler (evita fetch/ajax antigos)
    form.addEventListener('submit', function(ev){ }, true);

    // Faz o trabalho no bubbling
    form.addEventListener('submit', function(ev){
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      var files = Array.from(form.querySelectorAll('input[type=file]'));

      if(submitBtn){ submitBtn.dataset._txt = (submitBtn.tagName==='BUTTON' ? submitBtn.textContent : submitBtn.value); submitBtn.disabled=true; if(submitBtn.tagName==='BUTTON') submitBtn.textContent='Enviando…'; else submitBtn.value='Enviando…'; }

      if(!files.length){ HTMLFormElement.prototype.submit.call(form); return; }

      var promises=[], hidden=[];
      files.forEach(function(inp){
        var base = inp.name || ('file_' + Math.random().toString(36).slice(2));
        Array.from(inp.files||[]).forEach(function(f,idx){
          promises.push(new Promise(function(res,rej){
            var fr = new FileReader();
            fr.onload = function(){
              var dataUrl = fr.result || '';
              var b64 = String(dataUrl).split(',')[1] || '';
              var suf = inp.multiple ? '_' + (idx+1) : '';
              var h1 = document.createElement('input'); h1.type='hidden'; h1.name=base+suf+'_name'; h1.value=f.name;
              var h2 = document.createElement('input'); h2.type='hidden'; h2.name=base+suf+'_mime'; h2.value=f.type || 'application/octet-stream';
              var h3 = document.createElement('input'); h3.type='hidden'; h3.name=base+suf+'_b64';  h3.value=b64;
              hidden.push(h1,h2,h3); res();
            };
            fr.onerror = rej;
            fr.readAsDataURL(f);
          }));
        });
      });

      Promise.all(promises).then(function(){
        hidden.forEach(function(h){ form.appendChild(h); });
        files.forEach(function(inp){ inp.disabled=true; inp.setAttribute('data-disabled-during-submit','1'); });
        HTMLFormElement.prototype.submit.call(form);
      }).catch(function(err){
        if(submitBtn){ submitBtn.disabled=false; if(submitBtn.tagName==='BUTTON') submitBtn.textContent = submitBtn.dataset._txt || 'Enviar'; else submitBtn.value = submitBtn.dataset._txt || 'Enviar'; }
        console && console.error && console.error('Base64 error', err);
        alert('Falha ao preparar anexos. Tente novamente.');
      });
    });
  });
})();