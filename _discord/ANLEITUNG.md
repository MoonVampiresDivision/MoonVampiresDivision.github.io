# Bewerbungen automatisch in Discord posten

So funktioniert es:

```
Website-Formular ──► Google-Formular ──► Apps Script (Trigger) ──► Discord-Webhook ──► #bewerbungen
```

Jede Bewerbung landet wie bisher im Google-Formular. Dort gibt es auch die Tabelle mit allen Antworten.
Ein kleines Skript im Formular schickt jede neue Bewerbung zusätzlich als Nachricht in euren Discord-Channel.
Das funktioniert auch, wenn jemand das Google-Formular direkt benutzt. Es ist kostenlos und braucht keinen Server.

> Ein „richtiger“ Discord-Bot ist dafür nicht nötig, ein **Webhook** reicht zum Posten.
> Einen Bot braucht ihr erst, wenn ihr zum Beispiel Buttons wie „Annehmen / Ablehnen“ direkt in Discord wollt.

## 1. Webhook in Discord anlegen (Server-Admin)

1. Rechtsklick auf den Channel (z. B. `#bewerbungen`) → **Kanal bearbeiten** → **Integrationen** → **Webhooks**.
2. **Neuer Webhook**, Namen geben (z. B. „Bewerbungen“), dann **Webhook-URL kopieren**.
3. Die URL ist wie ein Passwort: Sie gehört nicht auf die Website, nicht in dieses Repository und in keinen Chat.

## 2. Skript im Google-Formular einfügen

1. Das Google-Formular **bearbeiten** (nicht die Ansicht) → oben rechts ⋮ → **Apps Script**.
2. Den Inhalt von `bewerbung-an-discord.gs` vollständig in den Editor kopieren (vorhandenen Code ersetzen) und speichern.
3. Links **Projekteinstellungen** (Zahnrad) → ganz unten **Skripteigenschaften** → **Skripteigenschaft hinzufügen**:
   - Eigenschaft: `DISCORD_WEBHOOK_URL`, Wert: die kopierte Webhook-URL
   - optional `DISCORD_ROLLE_ID`: die ID der Rolle, die bei jeder Bewerbung angepingt werden soll
     (in Discord: Entwicklermodus an → Rechtsklick auf die Rolle → „ID kopieren“)

## 3. Testen

1. Im Editor oben die Funktion **`testNachricht`** auswählen → **Ausführen**.
2. Beim ersten Mal fragt Google nach Berechtigungen. Bestätigen; das Skript darf dann Formularantworten lesen und Webseiten aufrufen.
3. Im Discord-Channel sollte eine Nachricht „🧪 TEST – Neue Bewerbung: Testi“ erscheinen.

## 4. Automatisch bei jeder Bewerbung

1. Links auf **Trigger** (Wecker-Symbol) → **Trigger hinzufügen**.
2. Funktion: `beiBewerbung` · Ereignisquelle: **Aus Formular** · Ereignistyp: **Beim Senden des Formulars** → Speichern.

Fertig. Ab jetzt postet jede neue Bewerbung automatisch in den Channel.

## Extras (optional)

### 🗳 Abstimmung der Leitung

Unter jeder Bewerbung erscheint automatisch eine Discord-Umfrage:
✅ Annehmen · ❌ Ablehnen · 🤔 Unsicher – erst besprechen.

- Die Abstimmung läuft standardmäßig **72 Stunden**. Ändern lässt sich das über die Skripteigenschaft
  `DISCORD_ABSTIMMUNG_STUNDEN` (z. B. `48`). Mit `0` ist die Abstimmung aus.
- Abstimmen kann jeder, der den Channel sehen kann. Der Bewerbungs-Channel sollte deshalb nur für die Leitung sichtbar sein.
- Erscheint keine Umfrage, fehlt im Channel vermutlich das Recht **„Umfragen erstellen“** für @everyone.
  Das Recht lässt sich nur für diesen (privaten) Channel erlauben. Die Bewerbung selbst wird trotzdem gepostet.

### 💬 Eigener Beitrag (Thread) pro Bewerbung

Dafür muss der Bewerbungs-Channel ein **Forum-Channel** sein. Jede Bewerbung bekommt dann einen eigenen Beitrag
mit dem Namen der Person. Bewerbung, Abstimmung und Diskussion stehen darin gesammelt.

1. In Discord einen neuen Channel anlegen → Typ **Forum** → z. B. `bewerbungen`, nur für die Leitung sichtbar.
   (Einen normalen Text-Channel kann man nicht in ein Forum umwandeln.)
2. Im Forum unter **Kanal bearbeiten → Integrationen → Webhooks** einen neuen Webhook anlegen und die URL kopieren.
3. In Apps Script die Skripteigenschaften anpassen:
   - `DISCORD_WEBHOOK_URL` → die **neue** Webhook-URL des Forums
   - `DISCORD_FORUM` → `ja`
4. `testNachricht` ausführen. Im Forum erscheint ein Beitrag „🧪 TEST – Testi (Testine Mondschein)“.

Tipp: Unter **Kanal bearbeiten → Tags** könnt ihr Tags wie „Offen“, „Angenommen“ und „Abgelehnt“ anlegen.
Nach der Entscheidung setzt die Leitung den passenden Tag. So sieht man den Stand aller Bewerbungen auf einen Blick
und kann danach filtern.

## Gut zu wissen

- Lange Antworten kürzt Discord auf 1024 Zeichen pro Frage (mit „…“). Die vollständige Bewerbung steht immer im Google-Formular.
- Klappt einmal etwas nicht, steht der Fehler in Apps Script unter **Ausführungen**.
- Wird der Webhook gelöscht oder neu erstellt, nur die Skripteigenschaft `DISCORD_WEBHOOK_URL` anpassen.
- Nach einer Änderung am Skript reicht es, den Code in Apps Script zu ersetzen und zu speichern.
  Skripteigenschaften und Trigger bleiben erhalten.
