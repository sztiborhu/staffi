# System Design Document (SDD) - Staffi


## 1. Bevezetés

### 1.1 Dokumentum célja
Jelen System Design Document (SDD) célja a **Staffi** munkaerő-menedzsment rendszer részletes műszaki tervezésének bemutatása. A dokumentum a fejlesztők és rendszermérnökök számára készült, és meghatározza a rendszer architektúráját, komponenseit, adatfolyamait, valamint a megvalósítandó interfészeket a PRD-ben rögzített üzleti igények alapján.

### 1.2 Rendszer áttekintés
A Staffi egy központosított webes alkalmazás, amely integrálja a munkaerőkölcsönző cégek kritikus folyamatait: a dolgozói adminisztrációt, a szálláshelyek menedzsmentjét és a pénzügyi előlegek kezelését. A rendszer egy modern, monolitikus architektúrára épül, amely Java (Spring Boot) backendet és Angular frontendet használ, PostgreSQL adatbázissal támogatva.

---

## 2. Funkcionális Specifikáció

### 2.1 Használati esetek (Use Cases)
A rendszer két fő szerepkör köré szerveződik:

* **HR Menedzser / Adminisztrátor:**
    * *UC-01 Dolgozó menedzsment:* Új dolgozók felvétele, adatok szerkesztése, státusz (aktív/kilépett) követése.
    * *UC-02 Szerződés generálás:* PDF munkaszerződések automatikus előállítása sablonok alapján.
    * *UC-03 Szállás allokáció:* Szobák és ágyak vizuális kezelése, dolgozók beköltöztetése és kiköltöztetése.
    * *UC-04 Előleg bírálat:* Beérkező kérelmek jóváhagyása vagy elutasítása indoklással.

* **Munkavállaló:**
    * *UC-05 Önkiszolgáló profil:* Saját személyes adatok és szerződések megtekintése.
    * *UC-06 Előlegigénylés:* Pénzügyi előleg kérése összeg és indoklás megadásával.
    * *UC-07 Szállásinfó:* Saját szálláshely és szobaszám lekérdezése.

### 2.2 Funkcionális követelmények
* **REQ-F-01:** A rendszernek biztosítania kell a JWT alapú hitelesítést és szerepkör-alapú hozzáférést (RBAC).
* **REQ-F-02:** A szállásfoglalásnál a rendszernek automatikusan ellenőriznie kell a szabad kapacitást (túlfoglalás megakadályozása).
* **REQ-F-03:** Minden előlegstátusz-váltást (Igénylés -> Jóváhagyás -> Kifizetés) naplózni kell auditálhatóság céljából.
* **REQ-F-04:** A szerződéseket szerveroldalon kell generálni és fájlrendszerben vagy adatbázisban tárolni.

---

## 3. Rendszer Komponensek

### 3.1 Prezentációs réteg (Frontend)
Az Angular alapú kliensalkalmazás (`frontend/src/app`) felel a felhasználói interakcióért.
* **Modulok:**
    * `AuthModule`: Bejelentkezés és tokenkezelés (`LoginComponent`).
    * `AdminModule`: HR funkciók (`EmployeesComponent`, `AccommodationsComponent`, `ContractsComponent`).
    * `EmployeeModule`: Dolgozói önkiszolgáló felület (`DashboardComponent`, `MyRequestsComponent`).
* **Kommunikáció:** HTTP Service osztályok (`EmployeeService`, `AccommodationService`) végzik az API hívásokat.

### 3.2 Üzleti logika réteg (Backend - Service Layer)
A Spring Boot alkalmazás (`backend/src/main/java/.../services`) tartalmazza a rendszer magját.
* **`UserService` & `AuthService`:** Felhasználók kezelése, jelszó hash-elés (`BCrypt`), JWT token generálás és validálás.
* **`AccommodationService`:** A szobák kapacitásának számítása, az allokációs szabályok (pl. nem lakhat két helyen egyszerre) érvényesítése.
* **`AdvanceRequestService`:** Az előlegigénylések állapotgépének kezelése és a jogosultságok ellenőrzése (saját kérést nem bírálhat el).
* **`PdfGeneratorService`:** `iText` vagy hasonló könyvtár használata a dinamikus PDF generáláshoz.

### 3.3 Adatelérési réteg (Persistence Layer)
A Spring Data JPA (`backend/src/main/java/.../repositories`) biztosítja az ORM kapcsolatot.
* **Entitások:** `User`, `Employee`, `Accommodation`, `Room`, `RoomAllocation`, `AdvanceRequest`, `Contract`.
* **Adatbázis:** PostgreSQL relációs adatbázis. Idegen kulcsok (Foreign Keys) és megszorítások (Constraints) biztosítják az adatintegritást (pl. `UNIQUE` constraint a szobaszámra szálláson belül).

### 3.4 Külső integrációk
* **Email Service (Tervezett):** Értesítések küldése SMTP szerveren keresztül (pl. szerződés elkészült, előleg jóváhagyva).
* **Fájltárolás:** A generált PDF szerződések tárolása a szerver helyi fájlrendszerében vagy (későbbiekben) S3 kompatibilis tárolóban.

---

## 4. Dinamikus Viselkedés

### 4.1 Adatfolyam diagramok (Data Flow)
**Példa: Új dolgozó felvétele**
1.  **Frontend:** A HR kitölti az űrlapot -> JSON objektum (`CreateEmployeeDto`) küldése POST kéréssel.
2.  **Controller:** `EmployeeController` fogadja a kérést, validálja a bemenetet (pl. kötelező mezők).
3.  **Service:** `EmployeeService` tranzakciót indít.
    * Létrehozza a `User` entitást (login adatok).
    * Létrehozza az `Employee` entitást (személyes adatok).
4.  **Repository:** `UserRepository` és `EmployeeRepository` menti az adatokat SQL `INSERT` utasításokkal.
5.  **Adatbázis:** A PostgreSQL végrehajtja a mentést és visszaadja a generált ID-kat.

### 4.2 Szekvencia diagramok (Logikai vázlat)
**Szállás Allokáció Folyamat:**
TODO


### 4.3 Állapotátmenet diagramok (State Transition)
**Előlegigénylés (`AdvanceStatus`):**
* **Kezdőállapot:** `PENDING` (Amikor a dolgozó beküldi).
* **Átmenetek:**
    * `PENDING` -> `APPROVED` (HR jóváhagyja).
    * `PENDING` -> `REJECTED` (HR elutasítja).
    * `APPROVED` -> `PAID` (Pénzügy kifizeti).
    * `PAID` -> `REPAID` (Dolgozó visszafizette / levonásra került).

---

## 5. Nem-funkcionális Követelmények

### 5.1 Teljesítmény
* Az API válaszideje átlagos terhelés mellett 200ms alatt kell legyen.
* A "Szálláshely-foglaltság" nézet (`/dashboard`) betöltése nem haladhatja meg az 1 másodpercet, komplex `JOIN`-ok esetén sem (ezért adatbázis indexek használata kötelező a `room_allocations` táblán).

### 5.2 Rendelkezésre állás
* A rendszernek munkaidőben (06:00 - 18:00) 99.5%-os rendelkezésre állást kell biztosítania.

### 5.3 Skálázhatóság
* Bár az architektúra monolitikus, a backend állapotmentes (Stateless Session policy), így horizontálisan skálázható Load Balancer mögött, amennyiben az adatbázis bírja a terhelést.

---

## 6. Korlátozások és Feltételezések

* **Technológiai korlát:** A projekt kizárólag a megadott Java Spring Boot és Angular stack-et használhatja.
* **Adatbázis:** A rendszer feltételezi, hogy a PostgreSQL adatbázis egyetlen írható instance-ként működik (nincs sharding vagy master-slave replikáció az MVP fázisban).
* **Hálózat:** A belső kommunikáció (API hívások) alacsony késleltetésű belső hálózaton vagy localhoston történik.
* **MVP Fókusz:** A jelenlegi design nem tartalmazza a multi-tenancy (több bérlős) kialakítást; a rendszer egyetlen munkaerőkölcsönző cég adatait kezeli.