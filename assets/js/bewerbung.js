// Bewerbungsformular: Prüfen, Entwurf merken, an Google Forms senden.
// Testmodus: Seite mit ?test aufrufen – dann wird NICHTS gesendet,
// sondern nur angezeigt, was gesendet würde.
(function () {
  var form = document.getElementById('bewerbungsformular');
  if (!form) return;

  var success = document.getElementById('bewerbung-gesendet');
  var statusEl = form.querySelector('[data-status]');
  var submitBtn = form.querySelector('[data-submit]');
  var STORAGE_KEY = 'mvd-bewerbung-entwurf';
  var testMode = /[?&]test\b/.test(location.search);

  // ---------- Entwurf im Browser merken ----------
  function saveDraft() {
    var data = {};
    new FormData(form).forEach(function (value, name) {
      if (name !== 'website') data[name] = value;
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* egal */ }
  }

  function restoreDraft() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { saved = null; }
    if (!saved) return;
    Object.keys(saved).forEach(function (name) {
      var el = form.elements[name];
      if (el) el.value = saved[name];
    });
  }

  function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* egal */ }
  }

  // ---------- "Sonstiges" ----------
  form.querySelectorAll('[data-other-text]').forEach(function (text) {
    var radio = text.parentElement.querySelector('[data-other]');
    text.addEventListener('input', function () {
      if (text.value.trim()) radio.checked = true;
    });
    text.addEventListener('focus', function () { radio.checked = true; });
  });

  // ---------- Zeichenzähler ----------
  form.querySelectorAll('[data-counter]').forEach(function (area) {
    var out = area.parentElement.querySelector('[data-count]');
    function update() { out.textContent = area.value.length; }
    area.addEventListener('input', update);
    update();
  });

  // ---------- Prüfen ----------
  function setError(field, message) {
    var err = field.querySelector('[data-error]');
    field.classList.toggle('has-error', !!message);
    if (err) {
      err.textContent = message || '';
      err.hidden = !message;
    }
  }

  function validateField(field) {
    var radios = field.querySelectorAll('input[type="radio"]');
    if (radios.length) {
      var checked = field.querySelector('input[type="radio"]:checked');
      if (radios[0].required && !checked) return setError(field, 'Bitte wähle eine Antwort aus.'), false;
      if (checked && checked.hasAttribute('data-other')) {
        var other = field.querySelector('[data-other-text]');
        if (!other.value.trim()) return setError(field, 'Bitte schreib kurz, was „Sonstiges“ bei dir bedeutet.'), false;
      }
      return setError(field, ''), true;
    }
    var input = field.querySelector('input, textarea');
    if (!input) return true;
    input.value = input.value.replace(/^\s+$/, '');
    if (input.required && !input.value.trim()) return setError(field, 'Bitte fülle dieses Feld aus.'), false;
    if (input.type === 'number' && input.value && !input.checkValidity()) {
      return setError(field, 'Bitte gib dein Alter als Zahl an.'), false;
    }
    return setError(field, ''), true;
  }

  form.querySelectorAll('[data-field]').forEach(function (field) {
    field.addEventListener('change', function () {
      if (field.classList.contains('has-error')) validateField(field);
    });
    field.addEventListener('input', function () {
      if (field.classList.contains('has-error')) validateField(field);
    });
  });

  // ---------- Daten zusammenstellen ----------
  function buildPayload() {
    var data = new URLSearchParams();
    new FormData(form).forEach(function (value, name) {
      if (name === 'website') return;
      if (/\.other_option_response$/.test(name)) {
        var base = name.replace('.other_option_response', '');
        var sel = form.querySelector('input[name="' + base + '"]:checked');
        if (!sel || sel.value !== '__other_option__') return;
      }
      if (typeof value === 'string' && value.trim() === '') return;
      data.append(name, typeof value === 'string' ? value.trim() : value);
    });
    data.append('fvv', '1');
    data.append('pageHistory', '0,1'); // Das Google-Formular hat zwei Abschnitte
    return data;
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- Absenden ----------
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    statusEl.textContent = '';
    statusEl.classList.remove('is-error');

    // Spam-Falle ausgefüllt -> so tun, als wäre alles gut
    if (form.elements.website && form.elements.website.value) { showSuccess(); return; }

    var firstInvalid = null;
    form.querySelectorAll('[data-field]').forEach(function (field) {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      statusEl.textContent = 'Bitte prüfe die markierten Felder.';
      statusEl.classList.add('is-error');
      var focusable = firstInvalid.querySelector('input, textarea');
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (focusable) focusable.focus({ preventScroll: true });
      return;
    }

    var payload = buildPayload();

    if (testMode) {
      var pre = document.getElementById('testausgabe') || document.createElement('pre');
      pre.id = 'testausgabe';
      pre.className = 'test-output';
      var lines = ['TESTMODUS – nichts wurde gesendet.', 'Ziel: ' + form.action, ''];
      payload.forEach(function (v, k) { lines.push(k + ' = ' + v); });
      pre.textContent = lines.join('\n');
      form.appendChild(pre);
      statusEl.textContent = 'Testmodus: Daten unten angezeigt, nichts gesendet.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet …';

    // Google Forms erlaubt kein Auslesen der Antwort (no-cors).
    // Klappt die Verbindung, kommt die Bewerbung an.
    fetch(form.action, { method: 'POST', mode: 'no-cors', body: payload })
      .then(function () {
        clearDraft();
        showSuccess();
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bewerbung absenden';
        statusEl.textContent = 'Das Senden hat leider nicht geklappt. Prüfe deine Internetverbindung und versuch es noch einmal – deine Antworten bleiben erhalten.';
        statusEl.classList.add('is-error');
      });
  });

  restoreDraft();
  form.querySelectorAll('[data-counter]').forEach(function (a) { a.dispatchEvent(new Event('input')); });
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  if (testMode) {
    var banner = document.createElement('p');
    banner.className = 'test-banner';
    banner.textContent = 'Testmodus aktiv – Bewerbungen werden nicht gesendet.';
    form.insertBefore(banner, form.firstChild);
  }
})();
