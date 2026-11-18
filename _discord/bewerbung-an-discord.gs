/**
 * Moon Vampires Division – neue Bewerbungen automatisch in Discord posten.
 *
 * Dieses Skript gehört in das Google-Formular (Erweiterungen → Apps Script).
 * Einrichtung Schritt für Schritt: siehe ANLEITUNG.md im selben Ordner.
 *
 * Einstellungen stehen NICHT im Code, sondern in den Skripteigenschaften
 * (Projekteinstellungen → Skripteigenschaften):
 *   DISCORD_WEBHOOK_URL         – Pflicht: Webhook des Bewerbungs-Channels
 *   DISCORD_ROLLE_ID            – optional: diese Rolle wird bei jeder Bewerbung erwähnt
 *   DISCORD_FORUM               – optional: "ja", wenn der Channel ein Forum-Channel ist.
 *                                 Dann bekommt jede Bewerbung einen eigenen Beitrag (Thread).
 *   DISCORD_ABSTIMMUNG_STUNDEN  – optional: Laufzeit der Abstimmung in Stunden (Standard 72).
 *                                 "0" schaltet die Abstimmung aus.
 */

var FARBE = 0xC4183A;          // Blutrot der Website
var MAX_FELD = 1024;           // Discord-Grenze pro Feld
var MAX_ZEICHEN_EMBED = 5500;  // Discord-Grenze 6000 pro Nachricht, mit Puffer
var ABSENDER = 'Moon Vampires Bewerbungen';

/** Wird bei jeder neuen Antwort im Formular ausgelöst (Trigger "Beim Senden des Formulars"). */
function beiBewerbung(e) {
  var antwort = e.response;
  var eintraege = antwort.getItemResponses().map(function (r) {
    var wert = r.getResponse();
    if (Array.isArray(wert)) wert = wert.join(', ');
    return { frage: r.getItem().getTitle(), antwort: String(wert || '').trim() };
  });
  senden_(eintraege, antwort.getTimestamp());
}

/** Zum Ausprobieren: Im Apps-Script-Editor diese Funktion auswählen und "Ausführen". */
function testNachricht() {
  senden_([
    { frage: 'Nenne bitte deinen Discord Namen damit wir dich kontaktieren können!', antwort: 'test_user' },
    { frage: 'Wie ist dein Sso Name?', antwort: 'Testine Mondschein' },
    { frage: 'Wie dürfen wir dich nennen? (Spitzname zb.)', antwort: 'Testi' },
    { frage: 'Wie alt bist du?', antwort: '18' },
    { frage: 'Welches Level hast du momentan?', antwort: '24 - 25' },
    { frage: 'Warum genau möchtest du Mitglied der Moon Vampires Division werden?', antwort: 'Das ist nur eine Testnachricht – bitte ignorieren.' }
  ], new Date(), true);
}

function senden_(eintraege, zeitpunkt, istTest) {
  var props = PropertiesService.getScriptProperties();
  var webhook = (props.getProperty('DISCORD_WEBHOOK_URL') || '').trim();
  if (!webhook) throw new Error('DISCORD_WEBHOOK_URL fehlt in den Skripteigenschaften.');
  var rolle = (props.getProperty('DISCORD_ROLLE_ID') || '').trim();
  var forum = /^(ja|true|1)$/i.test((props.getProperty('DISCORD_FORUM') || '').trim());
  var stundenText = (props.getProperty('DISCORD_ABSTIMMUNG_STUNDEN') || '').trim();
  var stunden = stundenText === '' ? 72 : parseInt(stundenText, 10);
  if (isNaN(stunden) || stunden < 0) stunden = 72;
  stunden = Math.min(stunden, 768); // Discord erlaubt höchstens 32 Tage

  var name = finde_(eintraege, /nennen|spitzname/i) || finde_(eintraege, /sso/i) || 'Unbekannt';
  var sso = finde_(eintraege, /sso/i);
  var discord = finde_(eintraege, /discord/i);
  var testPrefix = istTest ? '🧪 TEST – ' : '';

  var felder = eintraege
    .filter(function (e) { return e.antwort; })
    .map(function (e) {
      // inline: false -> jede Frage steht in einer eigenen Zeile (gut lesbar auf PC und Handy)
      return { name: kuerzen_(e.frage, 256), value: kuerzen_(e.antwort, MAX_FELD), inline: false };
    });

  // Felder auf mehrere Nachrichten verteilen, falls die Bewerbung sehr lang ist
  var pakete = [[]];
  var zeichen = 0;
  felder.forEach(function (f) {
    var laenge = f.name.length + f.value.length;
    var aktuell = pakete[pakete.length - 1];
    if (aktuell.length >= 25 || zeichen + laenge > MAX_ZEICHEN_EMBED) {
      pakete.push([]);
      zeichen = 0;
    }
    pakete[pakete.length - 1].push(f);
    zeichen += laenge;
  });

  var threadId = null;

  pakete.forEach(function (paket, i) {
    var embed = {
      color: FARBE,
      fields: paket,
      timestamp: zeitpunkt.toISOString()
    };
    if (i === 0) {
      embed.title = (istTest ? '🧪 TEST – ' : '🦇 ') + 'Neue Bewerbung: ' + kuerzen_(name, 200);
      if (discord) embed.description = 'Discord: **' + kuerzen_(discord, 100) + '**';
    } else {
      embed.title = 'Fortsetzung (' + (i + 1) + '/' + pakete.length + ')';
    }
    var nachricht = {
      username: ABSENDER,
      embeds: [embed],
      allowed_mentions: { parse: [], roles: rolle ? [rolle] : [] }
    };
    if (i === 0 && rolle) nachricht.content = '<@&' + rolle + '>';
    // Forum-Channel: die erste Nachricht eröffnet einen eigenen Beitrag für diese Bewerbung
    if (i === 0 && forum) {
      nachricht.thread_name = kuerzen_(testPrefix + name + (sso && sso !== name ? ' (' + sso + ')' : ''), 100);
    }
    var gesendet = post_(webhook, nachricht, threadId);
    if (i === 0 && forum && gesendet) threadId = gesendet.channel_id;
  });

  // Abstimmung der Leitung als eigene Nachricht direkt darunter (bzw. im Beitrag)
  if (stunden > 0) {
    var umfrage = {
      username: ABSENDER,
      poll: {
        question: { text: kuerzen_(testPrefix + 'Soll ' + name + ' als Anwärter aufgenommen werden?', 300) },
        answers: [
          { poll_media: { text: 'Annehmen', emoji: { name: '✅' } } },
          { poll_media: { text: 'Ablehnen', emoji: { name: '❌' } } },
          { poll_media: { text: 'Unsicher – erst besprechen', emoji: { name: '🤔' } } }
        ],
        duration: stunden,
        allow_multiselect: false
      }
    };
    try {
      post_(webhook, umfrage, threadId);
    } catch (err) {
      // Die Bewerbung selbst ist schon gepostet – eine fehlgeschlagene Umfrage soll das nicht kaputt machen.
      console.warn('Abstimmung konnte nicht gepostet werden: ' + err.message);
    }
  }
}

/** Schickt eine Nachricht an den Webhook und gibt die gesendete Nachricht zurück. */
function post_(webhook, nachricht, threadId) {
  var url = webhook + (webhook.indexOf('?') === -1 ? '?' : '&') + 'wait=true';
  if (threadId) url += '&thread_id=' + encodeURIComponent(threadId);
  for (var versuch = 0; versuch < 3; versuch++) {
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(nachricht),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code === 200 || code === 204) {
      try { return JSON.parse(res.getContentText()); } catch (e) { return null; }
    }
    if (code === 429) { // zu viele Nachrichten – kurz warten
      var warte = 2;
      try { warte = JSON.parse(res.getContentText()).retry_after || 2; } catch (e) {}
      Utilities.sleep(Math.ceil(warte * 1000) + 250);
      continue;
    }
    throw new Error('Discord antwortet mit ' + code + ': ' + res.getContentText());
  }
  throw new Error('Discord antwortet nach 3 Versuchen nicht (zu viele Anfragen).');
}

function finde_(eintraege, muster) {
  for (var i = 0; i < eintraege.length; i++) {
    if (muster.test(eintraege[i].frage) && eintraege[i].antwort) return eintraege[i].antwort;
  }
  return '';
}

function kuerzen_(text, max) {
  text = String(text);
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}
