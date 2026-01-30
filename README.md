# Staffi - Munkaerő-menedzsment Rendszer

**Modern, integrált megoldás munkaerőkölcsönző cégek számára.**

---

## 1. Projekt Neve és Leírás

A **Staffi** egy központosított vállalatirányítási rendszer, amelyet kifejezetten a munkaerőkölcsönzéssel foglalkozó cégek igényeire szabtak. A szoftver célja, hogy kiváltsa az elavult Excel táblázatokat és papíralapú nyilvántartásokat egyetlen, biztonságos webes platformmal.

**Fő célok:**
* A munkavállalói adminisztráció egyszerűsítése.
* A munkásszállások kihasználtságának maximalizálása (túlfoglalások elkerülése).
* A pénzügyi előlegek átlátható kezelése és auditálhatósága.

---

## 2. Funkciók

A rendszer moduláris felépítésű, az alábbi fő funkciókkal:

* **👥 Munkavállaló Menedzsment (HR):**
    * Teljes körű CRUD (Létrehozás, Olvasás, Frissítés, Törlés) műveletek.
    * Személyes adatok, okmányok (Adószám, TAJ) és elérhetőségek kezelése.
    * Státusz követés (Aktív/Inaktív).

* **📄 Szerződésgenerálás:**
    * PDF formátumú munkaszerződések automatikus előállítása gombnyomásra.
    * Előre definiált sablonok kitöltése a dolgozó adataival.

* **🏠 Szállás Menedzsment:**
    * Szálláshelyek (épületek) és szobák nyilvántartása.
    * Kapacitásfigyelés (szabad/foglalt ágyak).
    * **Allokáció:** Dolgozók beköltöztetése és kiköltöztetése dátum szerint.

* **💸 Pénzügy és Előlegek:**
    * **Munkavállalói oldal:** Előlegigénylés indoklással.
    * **HR oldal:** Igénylések bírálata (Jóváhagyás/Elutasítás).
    * Audit naplózás minden tranzakcióról.

* **🛡️ Biztonság:**
    * JWT (JSON Web Token) alapú hitelesítés.
    * Szerepkör alapú hozzáférés (RBAC): `ADMIN`, `HR`, `EMPLOYEE`.

---

## 3. Képernyőképek / Demó

*(A képernyőképek helye - a projekt futtatása után tölthető fel)*

* **Login Képernyő:** Bejelentkezés email/jelszó párossal.
* **HR Dashboard:** Áttekintés az aktív dolgozókról és szabad ágyakról.
* **Szobabeosztás:** Vizuális lista a szobák foglaltságáról.

---

## 4. Előfeltételek

A fejlesztői környezet beállításához az alábbi szoftverek szükségesek:

* **Java Development Kit (JDK):** 17-es verzió (Backend).
* **Node.js:** 16+ verzió (Frontend).
* **npm:** Node Package Manager.
* **PostgreSQL:** 15+ verzió (Adatbázis).
* **Git:** Verziókezeléshez.

---

## 5. Telepítés

### 1. Repository klónozása
```bash
git clone [https://github.com/sztiborhu/staffi.git](https://github.com/sztiborhu/staffi.git)
cd staffi

```

### 2. Adatbázis előkészítése

Hozzon létre egy PostgreSQL adatbázist és felhasználót:

```sql
CREATE DATABASE staffi_db;
CREATE USER staffi_user WITH ENCRYPTED PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE staffi_db TO staffi_user;

```

### 3. Backend függőségek telepítése

```bash
cd backend
./gradlew clean build -x test

```

### 4. Frontend függőségek telepítése

```bash
cd ../frontend
npm install

```

---

## 6. Konfiguráció

A backend konfigurációja a `backend/src/main/resources/application.yml` fájlban található. A kritikus adatokat környezeti változókkal vagy a fájl szerkesztésével állíthatja be:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/staffi_db
    username: staffi_user
    password: secret # Cserélje le!
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      database-platform: org.hibernate.dialect.PostgreSQLDialect
      ddl-auto: update # Fejlesztéshez 'update', élesben 'validate'

security:
  jwt:
    token:
      secret: "EgyNagyonHosszuEsBiztonsagosTitkosKulcsAmiLegalabb32Karakter"
    

```

---

## 7. Használat

### Backend indítása

A `backend` mappából futtassa:

```bash
./gradlew bootRun

```

A szerver elindul a `http://localhost:8081` címen.

### Frontend indítása

A `frontend` mappából futtassa:

```bash
ng serve

```

Nyissa meg a böngészőt a `http://localhost:4200` címen.

### Első belépés

Mivel a rendszer zárt, az első indításkor adatbázis-szinten vagy a `CommandLineRunner`-en keresztül kell létrehozni az első ADMIN felhasználót (amennyiben nincs seed data).

---

## 8. Projekt Struktúra

A projekt **Monorepo** szerkezetet követ:

```text
staffi/
├── backend/                 # Spring Boot alkalmazás
│   ├── src/main/java/       # Java forráskód
│   │   ├── config/          # Security, Cors, OpenAPI config
│   │   ├── controllers/     # REST API végpontok
│   │   ├── services/        # Üzleti logika
│   │   ├── repositories/    # Adatbázis elérés (JPA)
│   │   ├── entities/        # Adatbázis modellek
│   │   └── dtos/            # Data Transfer Objects
│   └── src/main/resources/  # Konfiguráció (application.yml)
│
└── frontend/                # Angular alkalmazás
    ├── src/app/
    │   ├── pages/           # Oldalak (Login, Dashboard, Employees)
    │   ├── services/        # HTTP hívások a backend felé
    │   ├── guards/          # Auth és Admin Guardok
    │   └── interceptors/    # Token kezelés, Hibakezelés
    └── angular.json         # Angular konfiguráció

```

---

## 9. Tesztek Futtatása

A projekt tartalmaz Unit és Integrációs teszteket a kritikus funkciókhoz.

**Backend tesztek:**

```bash
cd backend
./gradlew test

```

*Tesztek helye:* `backend/src/test/java/` (pl. `UserServiceTest`, `EmployeeControllerIntegrationTest`).

**Frontend tesztek:**

```bash
cd frontend
ng test

```

---

## 10. Hozzájárulás (Contributing)

Kérjük, kövesse az alábbi lépéseket:

1. Forkolja a repository-t.
2. Hozzon létre egy új branch-et (`feature/uj-funkcio`).
3. Végezze el a módosításokat és írjon hozzá teszteket.
4. Küldjön be egy Pull Request-et (PR) a `main` branch-re.

---

## 11. Verzió Történet

* **v1.0.0 (MVP):**
* Felhasználókezelés (Login, Auth).
* Dolgozók és Szerződések kezelése.
* Szállásmodul (Szobák, Allokáció).
* Pénzügyi modul alapjai (Előlegkérés).



---

## 12. Licenc

Ez a projekt jelenleg **Proprietary** (zárt forráskódú), a Staffi fejlesztőcsapat tulajdona. Minden jog fenntartva.


---

## 13. Kapcsolat

Kérdés, hiba vagy feature request esetén lépjen kapcsolatba velünk:

* **Fejlesztő:** Szijjártó Tibor
* **GitHub:** github.com/sztiborhu
* **Email:** email@sztibor.hu

---

## 14. Köszönetnyilvánítás

Köszönjük az alábbi nyílt forráskódú technológiák közösségének:

* **Spring Boot** - A robusztus backend keretrendszerért.
* **Angular** - A modern frontend élményért.
* **PostgreSQL** - A megbízható adattárolásért.
* **Lombok** - A Java boilerplate kód csökkentéséért.