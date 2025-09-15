
// ACTECmax – Integração Apps Script (Drive + Sheet + Email)
// Como usar: inclua <script src="actecmax_patch.js"></script> antes de </body>
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
    // Hidden iframe target
    var iframe = document.getElementById('submitFrame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'submitFrame';
      iframe.name = 'submitFrame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    // Success message
    var ok = document.getElementById('actecmax-ok');
    if (!ok) {
      ok = document.createElement('div');
      ok.id = 'actecmax-ok';
      ok.style.cssText = 'display:none;max-width:980px;margin:16px auto;padding:12px;border:1px solid #1a7f37;border-radius:10px;font-family:system-ui;background:#ecfdf5;color:#064e3b;';
      ok.textContent = 'Cadastro enviado com sucesso! Em instantes você receberá a confirmação por e-mail.';
      var parent = form.parentElement || document.body;
      parent.appendChild(ok);
    }
    return {iframe: iframe, ok: ok};
  }

  function wire(form) {
    // Force attributes
    form.method = 'POST';
    form.action = EXEC_URL;
    form.enctype = 'multipart/form-data';
    form.target = 'submitFrame';

    ensureNames(form);
    var ui = injectFrameAndUI(form);

    // UX on submit/loaded
    var btn = form.querySelector('[type="submit"]');
    var original = btn ? (btn.textContent || btn.value) : null;

    ui.iframe.addEventListener('load', function(){
      // Show success after response from Apps Script
      if (ui.ok) ui.ok.style.display = 'block';
      if (btn && original != null) {
        btn.disabled = false;
        if (btn.tagName === 'BUTTON') btn.textContent = original; else btn.value = original;
      }
      // Optional: reset form
      // form.reset();
    });

    form.addEventListener('submit', function(){
      if (btn && original != null) {
        btn.disabled = true;
        if (btn.tagName === 'BUTTON') btn.textContent = 'Enviando...'; else btn.value = 'Enviando...';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Use the first form by default; if there are multiple, use the one with id=ficha-cadastral
    var form = document.getElementById('ficha-cadastral') || document.querySelector('form');
    if (!form) return;
    wire(form);
  });
})();
