# GitHub Deployment Guide: Proxmox VE (Debian 13) & Docker

Dieser Leitfaden beschreibt die Bereitstellung und Wartung des **BetriebskostenManager Pro** direkt aus Ihrem **GitHub-Repository** auf einem **Proxmox VE (PVE)** Server unter **Debian 13 (Trixie)** unter Nutzung der offiziellen **Proxmox Helper-Scripts**.

---

## Architektur & GitHub Workflow

```
  ┌───────────────────────────────────────────────────────────────────────┐
  │                           GitHub Repository                           │
  │            (https://github.com/<Benutzername>/<Repository>)           │
  │                  ├── Dockerfile & docker-compose.yml                  │
  │                  ├── server.ts & Express Backend                      │
  │                  └── React 19 Frontend                                │
  └───────────────────────────────────┬───────────────────────────────────┘
                                      │  git clone / git pull
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Proxmox VE Node (PVE)                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  LXC Container (Debian 13 Trixie) via Proxmox Helper-Script       │  │
│  │  Verzeichnis: /opt/betriebskosten                                 │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ Docker Container: betriebskosten-manager                    │  │  │
│  │  │ ├── Port 3000 (Web-UI & REST-API Proxy)                     │  │  │
│  │  │ └── Volume Mount:                                           │  │  │
│  │  │     Host: /opt/betriebskosten/data                          │  │  │
│  │  │     Container: /app/data (betriebskosten_db.json)           │  │  │
│  │  │     (Lokale Daten bleiben bei git pull 100% erhalten!)      │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Schritt 1: Docker LXC mit Proxmox Helper-Script erstellen

1. Öffnen Sie die **Proxmox VE Web-Oberfläche**.
2. Klicken Sie links auf Ihren **PVE Node** (z. B. `pve`) und öffnen Sie die **Shell**.
3. Führen Sie den Befehl des Community Docker-LXC Skripts aus:
   ```bash
   bash -c "$(wget -qLO - https://github.com/community-scripts/ProxmoxVE/raw/main/ct/docker.sh)"
   ```
4. Beantworten Sie die Abfragen im Assistenten:
   - **Distribution:** Wählen Sie **Debian 13 (Trixie)** oder die aktuellste Version.
   - **Container-Typ:** `Unprivileged: Yes` (Das Skript konfiguriert `nesting` und `keyctl` automatisch korrekt).
   - **Ressourcen:**
     - **CPU:** 1 bis 2 vCPUs
     - **RAM:** 1024 MB bis 2048 MB
     - **Disk:** 8 GB bis 15 GB
   - **Netzwerk:** DHCP oder feste IP (z. B. `192.168.178.60/24`, Gateway: `192.168.178.1`).
   - **Zusatzpakete:** Docker Compose ist bereits standardmäßig aktiviert.

---

## Schritt 2: GitHub Repository im Container klonen

1. Öffnen Sie die Konsole des neuen Containers (`LXC -> Console` oder per SSH als `root`).
2. Installieren Sie Git, falls noch nicht vorhanden:
   ```bash
   apt update && apt install -y git
   ```

### Variante A: Öffentliches GitHub Repository
Wenn Ihr GitHub-Repository öffentlich ist:
```bash
git clone https://github.com/<Benutzername>/<Repository>.git /opt/betriebskosten
cd /opt/betriebskosten
```

### Variante B: Privates GitHub Repository (Empfohlen mit SSH Deploy Key)
Für private Repositories empfiehlt sich ein schreibgeschützter **Deploy Key**, damit Sie kein persönliches GitHub-Passwort auf dem Server speichern müssen:

1. SSH-Schlüssel auf dem Proxmox LXC erzeugen:
   ```bash
   ssh-keygen -t ed25519 -C "proxmox-betriebskosten" -f /root/.ssh/id_ed25519 -N ""
   ```
2. Den öffentlichen Schlüssel anzeigen und kopieren:
   ```bash
   cat /root/.ssh/id_ed25519.pub
   ```
3. In GitHub hinterlegen:
   - Öffnen Sie Ihr GitHub-Repository $\rightarrow$ **Settings** $\rightarrow$ **Deploy Keys** $\rightarrow$ **Add deploy key**.
   - Titel: `Proxmox Heimserver`
   - Key: Den kopierten Schlüssel einfügen (Häkchen bei *Allow write access* weglassen).
   - Klick auf **Add key**.
4. Jetzt das Repository per SSH klonen:
   ```bash
   git clone git@github.com:<Benutzername>/<Repository>.git /opt/betriebskosten
   cd /opt/betriebskosten
   ```

*(Alternativ können Sie auch ein Personal Access Token (PAT) nutzen: `git clone https://<DEIN-TOKEN>@github.com/<Benutzername>/<Repository>.git /opt/betriebskosten`).*

---

## Schritt 3: Datenverzeichnis initialisieren & Schutz prüfen

Die Anwendung speichert alle Betriebskosten, Zählerstände und Liegenschaftsdaten in `/opt/betriebskosten/data/betriebskosten_db.json`.

1. Datenverzeichnis anlegen und Berechtigungen setzen:
   ```bash
   mkdir -p /opt/betriebskosten/data
   chmod 755 /opt/betriebskosten/data
   ```

> [!NOTE]
> Das Verzeichnis `data/` ist in der `.gitignore`-Datei eingetragen. Das bedeutet:
> Wenn Sie später `git pull` ausführen, um Updates von GitHub zu laden, werden Ihre erfassten Mieterdaten und Kosten **niemals** berührt oder überschrieben!

---

## Schritt 4: Container mit Docker Compose bauen und starten

1. Starten Sie den Bau und Start des Containers:
   ```bash
   cd /opt/betriebskosten
   docker compose up -d --build
   ```

2. Status und Logs überprüfen:
   ```bash
   # Container-Status:
   docker compose ps

   # Live-Logs ansehen:
   docker compose logs -f
   ```

Sobald in der Konsole folgende Zeile erscheint:
```text
Betriebskosten-Server läuft auf http://localhost:3000 (Mode: production)
```
ist Ihre Anwendung online!

---

## Schritt 5: Aufruf im Heimnetzwerk & Paperless-ngx Anbindung

1. Rufen Sie die Anwendung im Browser auf:
   ```text
   http://<LXC-IP>:3000
   ```
2. **Paperless-ngx anbinden (optional):**
   - Oben rechts auf das **Zahnrad (Einstellungen)** klicken.
   - Auf den Reiter **Paperless-ngx** wechseln.
   - Lokale Paperless-URL (z. B. `http://192.168.178.50:8000`) und API-Token eingeben.
   - Auf **„Verbindung zu Paperless testen“** klicken und speichern.

---

## Schritt 6: Künftige Updates von GitHub einspielen

Wenn Sie Änderungen auf GitHub pushen oder neue Versionen veröffentlichen, können Sie das Update auf dem Heimserver in Sekunden einspielen:

```bash
cd /opt/betriebskosten
git pull origin main
docker compose up -d --build
```

### Optional: Automatisches Update-Skript mit Backup anlegen

Sie können ein kleines Skript anlegen, das vor dem Update automatisch die Datenbank sichert:

Erstellen Sie die Datei `/opt/betriebskosten/update.sh`:
```bash
cat << 'EOF' > /opt/betriebskosten/update.sh
#!/bin/bash
set -e
cd /opt/betriebskosten

echo "[1/3] Erstelle Sicherheitskopie der Datenbank..."
if [ -f data/betriebskosten_db.json ]; then
  cp data/betriebskosten_db.json "data/betriebskosten_db_backup_$(date +%Y%m%d_%H%M%S).json"
fi

echo "[2/3] Ziehe neuesten Code von GitHub..."
git pull origin main

echo "[3/3] Baue und starte Container neu..."
docker compose up -d --build

echo "Update erfolgreich abgeschlossen!"
docker compose ps
EOF

chmod +x /opt/betriebskosten/update.sh
```

Zukünftiges Update mit nur einem Befehl:
```bash
/opt/betriebskosten/update.sh
```

---

## Schritt 7: Backup-Empfehlungen auf Proxmox VE

1. **In-App JSON-Export:** Über das Festplatten-Icon oben rechts in der Weboberfläche können Sie jederzeit eine vollständige Sicherung auf Ihren Computer herunterladen.
2. **Proxmox Snapshot / PBS:**
   - In Proxmox VE unter `LXC-ID -> Backup` einen täglichen Sicherungsplan auf Ihr NAS oder den Proxmox Backup Server (PBS) einrichten.
