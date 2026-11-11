# BetriebskostenManager Pro (BetrKV)

Eine lokale Webanwendung für private Vermieter zur Erfassung von Betriebskosten nach der deutschen Betriebskostenverordnung (§ 2 BetrKV), Verfolgung von Mehrjahres-Kostenverläufen und automatischer Erstellung von DIN-5008-konformen PDF-Mieterabrechnungen.

---

## Schnellanleitung für den Heimserver

Sie können die Anwendung auf jedem Linux-Server, Raspberry Pi, NAS (Synology, QNAP), Unraid, TrueNAS oder Proxmox-Container ausführen.

### Option 1: Start mit Docker & Docker Compose via GitHub (Empfohlen)

> **Proxmox VE Nutzer:** Ein ausführlicher Leitfaden für Debian 13 mit Proxmox Helper-Scripts und GitHub-Integration steht in [DEPLOYMENT_PROXMOX.md](DEPLOYMENT_PROXMOX.md) bereit.

1. **Repository von GitHub klonen:**
   ```bash
   git clone https://github.com/<Benutzername>/<Repository>.git /opt/betriebskosten
   cd /opt/betriebskosten
   ```
2. **Container bauen und starten:**
   ```bash
   docker compose up -d --build
   ```
3. **Im Browser öffnen:**
   ```text
   http://<IP-IHRES-SERVERS>:3000
   ```
4. **Datenpersistenz & Updates:**
   - Die Daten werden automatisch dauerhaft im lokalen Ordner `./data/betriebskosten_db.json` gesichert.
   - Da `data/` in der `.gitignore` liegt, bleiben alle Mieter- und Abrechnungsdaten auch bei zukünftigen `git pull`-Updates vollständig erhalten.

---

### Option 2: Direkter Betrieb mit Node.js & PM2 / Systemd

Voraussetzung: Node.js (Version 20 oder 22) und npm installiert.

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Produktions-Build erstellen:**
   ```bash
   npm run build
   ```

3. **Server starten:**
   ```bash
   # Mit tsx direkt:
   npx tsx server.ts

   # Oder als dauerhafter Hintergrund-Dienst mit PM2:
   npm install -g pm2
   pm2 start "npx tsx server.ts" --name "betriebskosten-manager"
   pm2 save
   pm2 startup
   ```

4. Öffnen Sie im Browser:
   ```text
   http://<IP-IHRES-SERVERS>:3000
   ```

---

### Datensicherung & Backup

- Alle Daten liegen in `./data/betriebskosten_db.json`.
- In der Weboberfläche können Sie über das Download-Icon oben rechts jederzeit ein vollständiges JSON-Backup herunterladen oder wiederherstellen.
