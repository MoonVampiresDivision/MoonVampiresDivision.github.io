/**
 * Moon Vampires Division – neue Bewerbungen automatisch in Discord posten.
 *
 * Dieses Skript gehört in das Google-Formular (Erweiterungen → Apps Script).
 * Einrichtung Schritt für Schritt: siehe ANLEITUNG.md im selben Ordner.
 *
 * Die Webhook-Adresse steht NICHT im Code, sondern in den Skripteigenschaften
 * (Projekteinstellungen → Skripteigenschaften):
 *   DISCORD_WEBHOOK_URL  – Pflicht: Webhook des Bewerbungs-Channels
 *   DISCORD_ROLLE_ID     – optional: diese Rolle wird bei jeder Bewerbung erwähnt
 */

var FARBE = 0xC4183A;          // Blutrot der Website
var MAX_FELD = 1024;           // Discord-Grenze pro Feld
var MAX_ZEICHEN_EMBED = 5500;  // Discord-Grenze 6000 pro Nachricht, mit Puffer

/** Wird bei jeder neuen Antwort im Formular ausgelöst (Trigger "Bei Formularsenden"). */
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
  var webhook = props.getProperty('DISCORD_WEBHOOK_URL');
  if (!webhook) throw new Error('DISCORD_WEBHOOK_URL fehlt in den Skripteigenschaften.');
  var rolle = props.getProperty('DISCORD_ROLLE_ID');

  var name = finde_(eintraege, /nennen|spitzname/i) || finde_(eintraege, /sso/i) || 'Unbekannt';
  var discord = finde_(eintraege, /discord/i);

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
      username: 'Moon Vampires Bewerbungen',
      embeds: [embed],
      allowed_mentions: { parse: [], roles: rolle ? [rolle] : [] }
    };
    if (i === 0 && rolle) nachricht.content = '<@&' + rolle + '>';
    post_(webhook, nachricht);
  });
}

function post_(webhook, nachricht) {
  for (var versuch = 0; versuch < 3; versuch++) {
    var res = UrlFetchApp.fetch(webhook, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(nachricht),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code === 200 || code === 204) return;
    if (code === 429) { // zu viele Nachrichten – kurz warten
      var warte = 2;
      try { warte = JSON.parse(res.getContentText()).retry_after || 2; } catch (e) {}
      Utilities.sleep(Math.ceil(warte * 1000) + 250);
      continue;
    }
    throw new Error('Discord antwortet mit ' + code + ': ' + res.getContentText());
  }
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
