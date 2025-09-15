
// ACTECmax – Patch v2 (força envio nativo ao Apps Script, ignora JS conflitante)
(function(){
  var EXEC_URL = "https://script.google.com/macros/s/AKfycbzTahtL4J7SBb1MTtOjkS3Kxht77upE0K4c0ipf0vttpCplHkeQcP0db0cDMzeQR-4C/exec";

  function sanitizeName(s) {
    return (s||"").toString().trim().toLowerCase()
      .replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'');
  }

  function ensureNames(form) {
    var fields = form.querySelectorAll('input,select,textarea');
    fields.forEach(function(el){
      var type = (el.getAttribute('type')||'text').toLowerCase();
      if (['submit','button','reset','image','hidden'].indexOf(type) >= 0) return;
      if (!el.name || !el.name.trim()) {
        var candidate = el.id || el.getAttribute('placeholder') || el.getAttribute('title') || el.getAttribute('aria-label') || el.tagName.toLowerCase();
        el.name = sanitizeName(candidate) || (el.tagName.toLowerCase() + '_' + Math.random().toString(36).slice(2));
      }
    });
  }

  function injectFrameAndUI(form) {
    var iframe = document.getElementById('submitFrame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'submitFrame';
      iframe.name = 'submitFrame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    var ok = document.getElementById('actecmax-ok');
    if (!ok) {
      ok = document.createElement('div');
      ok.id = 'actecmax-ok';
      ok.style.cssText = 'display:none;max-width:980px;margin:16px auto;padding:12px;border:1px solid #1a7f37;border-radius:10px;font-family:system-ui;background:#ecfdf5;color:#064e3b;';
      ok.textContent = 'Cadastro enviado com sucesso! Em instantes você receberá a confirmação por e-mail.';
      // insere depois do form
      (form.parentElement||document.body).appendChild(ok);
    }
    return {iframe: iframe, ok: ok};
  }

  function pickSubmitters(form) {
    var btns = Array.from(form.querySelectorAll('button[type="submit"],input[type="submit"],button:not([type])'));
    // Alguns temas usam <a> como botão "Enviar"
    var anchors = Array.from(form.querySelectorAll('a, .btn, [role="button"]')).filter(function(a){
      return /enviar|submit|enviar cadastro/i.test((a.textContent||'') + ' ' + (a.id||'') + ' ' + (a.className||''));
    });
    return btns.concat(anchors);
  }

  function wire(form) {
    // Remover onsubmit inline e forçar atributos do form
    try { form.removeAttribute('onsubmit'); } catch(e){}
    form.method = 'POST';
    form.action = EXEC_URL;
    form.enctype = 'multipart/form-data';
    form.target = 'submitFrame';
    if (!form.id) form.id = 'ficha-cadastral';

    // campo oculto de origem
    var src = form.querySelector('input[name="_source"]');
    if (!src) {
      src = document.createElement('input');
      src.type = 'hidden'; src.name = '_source'; src.value = 'actecmax_github_pages';
      form.appendChild(src);
    }

    ensureNames(form);
    var ui = injectFrameAndUI(form);

    // Feedback ao carregar resposta do Apps Script
    ui.iframe.addEventListener('load', function(){
      if (ui.ok) ui.ok.style.display = 'block';
      var btn = form.__actec_btn__;
      var original = form.__actec_btn_text__;
      if (btn && original != null) {
        btn.disabled = false;
        if (btn.tagName === 'BUTTON') btn.textContent = original; else btn.value = original;
      }
    });

    // Captura clique/touch no botão para FORÇAR envio nativo e impedir JS do tema
    var submitters = pickSubmitters(form);
    submitters.forEach(function(btn){
      ['click','pointerdown','touchstart'].forEach(function(evt){
        btn.addEventListener(evt, function(ev){
          // impede scripts terceiros
          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();
          // feedback
          form.__actec_btn__ = btn;
          var txt = (btn.tagName === 'BUTTON') ? btn.textContent : btn.value;
          form.__actec_btn_text__ = txt;
          if (btn.tagName === 'BUTTON') btn.textContent = 'Enviando...'; else btn.value = 'Enviando...';
          btn.disabled = true;
          // SUBMISSÃO NATIVA (não dispara eventos de submit, ignora listeners conflitantes)
          HTMLFormElement.prototype.submit.call(form);
          return false;
        }, true); // capture-phase
      });
    });

    // Segurança extra: se alguém disparar 'submit', bloqueia handlers e envia nativo
    form.addEventListener('submit', function(e){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      HTMLFormElement.prototype.submit.call(form);
      return false;
    }, true);
  }

  function init(){
    var form = document.getElementById('ficha-cadastral') || document.querySelector('form');
    if (!form) return;
    wire(form);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
