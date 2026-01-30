# 5. Infrastructure Documentation - Staffi (No Docker)


## 1. Infrastruktúra Áttekintés

### 1.1 Architektúra diagram
A rendszer hagyományos, többrétegű webes architektúrát követ, ahol minden komponens natívan fut egy Linux (Ubuntu/Debian) szerveren, konténerizáció nélkül.

* **Frontend:** Nginx webszerver szolgálja ki az Angular statikus fájlokat és működik Reverse Proxy-ként.
* **Backend:** Java (Spring Boot) alkalmazás, amely háttérfolyamatként (Systemd Service) fut.
* **Adatbázis:** Helyileg telepített PostgreSQL szerver.

### 1.2 Környezetek listája
1.  **Local / Development:** Fejlesztői gépek (Windows/Mac/Linux) IDE-vel (IntelliJ/VS Code).
2.  **Production:** Linux VPS (Virtual Private Server), ajánlottan Ubuntu 22.04 LTS.

---

## 2. Erőforrások Leírása

### 2.1 Szoftverkövetelmények (Host OS)
A szerveren az alábbi csomagokat kell telepíteni:
* **OS:** Ubuntu 22.04 LTS (ajánlott).
* **Java Runtime:** OpenJDK 17 JRE (`openjdk-17-jre-headless`), mivel a projekt Java 17-et használ.
* **Webszerver:** Nginx (`nginx`) a frontend kiszolgálásához.
* **Adatbázis:** PostgreSQL 15+ (`postgresql`).
* **Build eszközök (opcionális):** Ha a szerveren történik a fordítás, akkor Node.js 18+ és Gradle szükséges.

### 2.2 Hálózati beállítások
* **Firewall (UFW):**
    * `Allow 22/tcp` (SSH)
    * `Allow 80/tcp` (HTTP)
    * `Allow 443/tcp` (HTTPS)
    * *Block 8080* (A Spring Boot backendet ne érjék el közvetlenül, csak az Nginx-en keresztül).
* **Reverse Proxy:** Az Nginx továbbítja a `/api` prefixű kéréseket a `localhost:8080`-ra.

### 2.3 Tárolási megoldások
* **Alkalmazás kód:** `/opt/staffi/`
* **Statikus fájlok (Frontend):** `/var/www/staffi/`
* **Adatbázis fájlok:** `/var/lib/postgresql/` (alapértelmezett).
* **Generált PDF szerződések:** `/opt/staffi/storage/contracts/` – Ezt a mappát a backend írja, így a `staffi` felhasználónak írási joggal kell rendelkeznie.

---

## 3. Infrastruktúra mint Kód (Szkriptek)

Mivel nem használunk Dockert, **Bash szkripteket** és **Systemd Unit** fájlokat használunk a konfiguráció definiálására és a szolgáltatások menedzselésére.

### 3.1 Systemd Unit File (`/etc/systemd/system/staffi-backend.service`)
Ez a fájl felel a Java alkalmazás automatikus indításáért rendszerindításkor és újraindításáért hiba esetén.

```ini
[Unit]
Description=Staffi Backend Service
After=network.target postgresql.service

[Service]
User=staffi
Group=staffi
WorkingDirectory=/opt/staffi/backend
# A 'prod' profil aktiválása az application.yml-ből
ExecStart=/usr/bin/java -jar staffi-backend.jar --spring.profiles.active=prod
SuccessExitStatus=143
Restart=always
RestartSec=10
EnvironmentFile=/etc/staffi/staffi.env

[Install]
WantedBy=multi-user.target
```

---

## 4. Környezet-specifikus Konfigurációk

### 4.1 Éles környezet (Production)

#### Nginx Konfiguráció (`/etc/nginx/sites-available/staffi`)

```nginx
server {
    listen 80;
    server_name staffi.hu; # Cserélendő a valós domainre

    # Frontend (Angular)
    location / {
        root /var/www/staffi;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Application Config (`application-prod.yml`)

A `src/main/resources/application.yml` mellett egy külső konfigurációs fájl vagy környezeti változók írják felül az alapértelmezett beállításokat (pl. `ddl-auto=validate` a `update` helyett).

---

## 5. Állapotkezelés

A rendszer állapota két helyen tárolódik:

* **Adatbázis:** Minden üzleti adat (Dolgozók, Szállások, Előlegek) a PostgreSQL-ben van.
* **Fájlrendszer:** A generált PDF szerződések és a naplófájlok (`logs/`).

**Biztonsági mentés:** Rendszeres `pg_dump` futtatása cron job segítségével ajánlott, amely az adatbázis tartalmát egy külső tárhelyre (pl. S3 vagy másik szerver) menti.

---

## 6. Titokkezelés

Az érzékeny adatokat (Jelszavak, API kulcsok) TILOS a forráskódban tárolni. Helyette egy védett környezeti fájlt használunk a szerveren.

**Fájl:** `/etc/staffi/staffi.env`  
**Jogosultság:** `chmod 600` (Csak a root és a staffi user olvashatja).

```bash
# Adatbázis kapcsolat
DB_URL=jdbc:postgresql://localhost:5432/staffi_db
DB_USERNAME=staffi_user
DB_PASSWORD=SzuperTitkosJelszo123

# JWT Aláíró kulcs (Legalább 32 karakter)
JWT_SECRET=HosszuEsBonyolultTitkosKulcsASignolashoz2026
```

---

## 7. Telepítési Utasítások (Deployment)

### 7.1 Előfeltételek (Szerver oldalon)

```bash
# 1. Rendszer frissítése
sudo apt update && sudo apt upgrade -y

# 2. Szükséges csomagok telepítése
sudo apt install openjdk-17-jre-headless nginx postgresql postgresql-contrib -y

# 3. Adatbázis és felhasználó létrehozása
sudo -u postgres psql -c "CREATE DATABASE staffi_db;"
sudo -u postgres psql -c "CREATE USER staffi_user WITH ENCRYPTED PASSWORD 'SzuperTitkosJelszo123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE staffi_db TO staffi_user;"
```

### 7.2 Alkalmazás Telepítése (Manuális lépések)

1. **Dedikált felhasználó létrehozása:**

```bash
sudo useradd -r -s /bin/false staffi
sudo mkdir -p /opt/staffi/backend /var/www/staffi /etc/staffi /opt/staffi/storage
sudo chown -R staffi:staffi /opt/staffi /var/www/staffi
```

2. **Backend Deploy:**
   - Helyi gépen buildelés: `./gradlew build -x test`
   - JAR fájl feltöltése: `scp build/libs/staffi-backend-0.0.1-SNAPSHOT.jar user@server:/opt/staffi/backend/staffi-backend.jar`
   - Systemd service fájl létrehozása és indítása:

```bash
sudo systemctl enable staffi-backend
sudo systemctl start staffi-backend
```

3. **Frontend Deploy:**
   - Helyi gépen buildelés: `npm run build --configuration production`
   - Fájlok feltöltése: `scp -r dist/staffi/* user@server:/var/www/staffi/`
   - Nginx beállítása és újraindítása: `sudo systemctl reload nginx`

4. **SSL Beállítása (Certbot):**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d staffi.hu
```

### 7.3 Eltávolítás

```bash
sudo systemctl stop staffi-backend
sudo systemctl disable staffi-backend
sudo rm /etc/systemd/system/staffi-backend.service
sudo rm -rf /opt/staffi /var/www/staffi
```

---

## 8. Költségbecslés

A Docker elhagyása csökkenti a memória overhead-et (nem kell Docker daemon és konténer runtime), így kisebb erőforrású szerver is elegendő lehet az MVP fázisban.

| Erőforrás | Specifikáció | Becsült Költség / Hó |
|-----------|--------------|----------------------|
| VPS | 1 vCPU, 2GB RAM, 20GB SSD (pl. Hetzner CX11) | ~5 - 10 EUR |
| Domain | .hu domain regisztráció | ~10 EUR / év |
| SSL | Let's Encrypt | Ingyenes |
| **Összesen** | | **~10-15 EUR / hó** |