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

## Gut zu wissen

- Lange Antworten kürzt Discord auf 1024 Zeichen pro Frage (mit „…“). Die vollständige Bewerbung steht immer im Google-Formular.
- Klappt einmal etwas nicht, steht der Fehler in Apps Script unter **Ausführungen**.
- Wird der Webhook gelöscht oder neu erstellt, nur die Skripteigenschaft `DISCORD_WEBHOOK_URL` anpassen.
