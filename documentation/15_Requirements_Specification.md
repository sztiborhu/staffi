# 15. Requirements Specification - Staffi

## 1. Bevezetés

### 1.1 Dokumentum célja
Ez a dokumentum a **Staffi** munkaerő-menedzsment rendszer követelményeit rögzíti. Célja, hogy egyértelmű, mérhető és tesztelhető alapot biztosítson a fejlesztéshez, teszteléshez és az átadás-átvételhez. A specifikáció a "Product Requirements Document" (PRD) üzleti igényeit fordítja le technikai és funkcionális elvárásokra.

### 1.2 Projekt háttér
A munkaerőkölcsönző cégek jelenleg szigetszerű rendszereket (Excel, papír alapú nyilvántartás) használnak, ami adatvesztéshez és adminisztrációs terhekhez vezet. A Staffi projekt célja egy integrált, webes platform létrehozása, amely központosítja a HR, a szállásmenedzsment és a pénzügyi előlegek kezelését.

### 1.3 Hatókör
* **A rendszer része (In-Scope):** Felhasználókezelés, Munkavállalói nyilvántartás, Szerződésgenerálás (PDF), Szálláshelyek és szobabeosztás kezelése, Előlegigénylés és jóváhagyás, Audit naplózás.
* **Nem része (Out-of-Scope):** Bérszámfejtés, Munkaidő-nyilvántartás (jelenléti ív), Multi-tenant (több bérlős) működés az MVP fázisban.

---

## 2. Stakeholderek

| Stakeholder | Leírás | Érdekelt abban, hogy... |
| :--- | :--- | :--- |
| **HR** | A rendszer elsődleges adminisztrátora. | A dolgozói adatok naprakészek legyenek, a szerződések gyorsan elkészüljenek. |
| **Munkavállaló** | A rendszer végfelhasználója. | Egyszerűen kérhessen előleget és lássa a szállásbeosztását. |
| **Rendszergazda** | IT üzemeltető. | A rendszer biztonságos és stabil legyen. |

---

## 3. Felhasználói Szerepek

A rendszer szerepkör-alapú hozzáférést (RBAC) alkalmaz, amelyet a `Role` enum definiál.

1.  **ADMIN:** Teljes körű hozzáférés a rendszer minden moduljához és a felhasználók kezeléséhez.
2.  **HR:** Hozzáférés a dolgozókhoz, szállásokhoz és pénzügyekhez, de nem kezelhet rendszeradminisztrátori beállításokat.
3.  **EMPLOYEE:** Korlátozott hozzáférés; csak a saját profilját, szerződéseit és kérelmeit láthatja.

---

## 4. Funkcionális Követelmények

### 4.1 Autentikáció és Felhasználókezelés
* **REQ-01 Bejelentkezés:** A felhasználóknak email/jelszó párossal kell azonosítaniuk magukat. A rendszer JWT tokent állít ki sikeres belépéskor.
* **REQ-02 Jelszóváltoztatás:** A felhasználóknak lehetőséget kell biztosítani a jelszavuk módosítására a profil oldalon.
* **REQ-03 Jogosultságvizsgálat:** Minden védett végpontnak ellenőriznie kell a felhasználó szerepkörét (`Role`) a művelet végrehajtása előtt.

### 4.2 Munkavállaló Menedzsment
* **REQ-04 Dolgozó Létrehozása:** A HR-nek képesnek kell lennie új dolgozó rögzítésére a személyes adatok (Név, Adószám, TAJ, Cím) megadásával.
* **REQ-05 Adatvalidáció:** A rendszernek biztosítania kell az Adószám és TAJ szám egyediségét az adatbázisban.
* **REQ-06 Szerződés Generálás:** A rendszernek gombnyomásra PDF formátumú munkaszerződést kell generálnia a dolgozó adatai alapján, és azt letölthetővé kell tennie.

### 4.3 Szállás Menedzsment
* **REQ-07 Szállásnyilvántartás:** Lehessen új épületeket és azon belül szobákat rögzíteni kapacitással együtt.
* **REQ-08 Beköltöztetés (Allokáció):** A HR hozzárendelhet egy dolgozót egy szobához.
    * *Elfogadási kritérium:* A rendszer dobjon hibát (`409 Conflict`), ha a szoba tele van, vagy a dolgozónak már van aktív szállása.
* **REQ-09 Foglaltság Lekérdezése:** A felületen vizuálisan meg kell jeleníteni a szabad és foglalt ágyak számát.

### 4.4 Pénzügy (Előlegek)
* **REQ-10 Előlegigénylés:** A Munkavállaló indíthat előlegkérelmet összeg és indoklás megadásával. Kezdő státusz: `PENDING`.
* **REQ-11 Előleg Bírálat:** A HR jóváhagyhatja (`APPROVED`) vagy elutasíthatja (`REJECTED`) a kérelmet. Elutasításkor indoklás megadása kötelező.
* **REQ-12 Audit:** Minden státuszváltást naplózni kell (ki, mikor, mit csinált).

---

## 5. Nem-funkcionális Követelmények

### 5.1 Teljesítmény
* **Válaszidő:** Az API végpontok átlagos válaszideje nem haladhatja meg a 200 ms-t normál terhelés mellett.
* **PDF Generálás:** A szerződésgenerálásnak 3 másodpercen belül el kell készülnie.

### 5.2 Biztonság
* **Adatvédelem:** A jelszavakat BCrypt hasheléssel kell tárolni.
* **Kommunikáció:** Éles környezetben kizárólag HTTPS protokoll engedélyezett.
* **Session:** Az alkalmazás állapotmentes (Stateless), minden kérést JWT tokennel kell hitelesíteni.

### 5.3 Használhatóság
* **Frontend:** Reszponzív Angular felület (Material Design), amely mobilon és asztali gépen is használható.
* **Nyelv:** A felület nyelve magyar.

### 5.4 Rendelkezésre állás
* A rendszernek 99.5%-os rendelkezésre állást kell biztosítania munkaidőben (H-P 06:00-18:00).

### 5.5 Skálázhatóság
* A backend architektúrának támogatnia kell a horizontális skálázást (több példány futtatása Load Balancer mögött).

---

## 6. Korlátozások

* **Technológia:** A backendet Java 17 / Spring Boot 3, a frontendet Angular 19+ keretrendszerben kell megvalósítani.
* **Adatbázis:** PostgreSQL relációs adatbázis használata kötelező.
* **Erőforrás:** A rendszernek futnia kell egy 2 vCPU / 4 GB RAM kapacitású Linux VPS környezetben.

---

## 7. Feltételezések

1.  A felhasználók rendelkeznek alapvető számítógépes ismeretekkel és interneteléréssel.
2.  Az emailek kiküldéséhez rendelkezésre áll egy SMTP szerver (vagy külső szolgáltató).
3.  A munkaszerződések jogi szövegezését a megrendelő biztosítja sablon formájában.

---

## 8. Függőségek

* **PostgreSQL Adatbázis:** A rendszer működésképtelen az adatbázis-kapcsolat nélkül.
* **Frontend-Backend Kompatibilitás:** A kliens és szerver közötti DTO struktúráknak szinkronban kell lenniük.

---

## 9. Követelmény Mátrix (Traceability Matrix)

| ID | Funkció | Felelős Komponens | Prioritás | Tesztelhető? |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Bejelentkezés | `AuthController` | Magas | Igen (Unit/Integration) |
| **REQ-04** | Dolgozó felvétel | `EmployeeController` | Magas | Igen |
| **REQ-06** | PDF Generálás | `PdfGeneratorService` | Közepes | Igen |
| **REQ-08** | Szoba Allokáció | `AccommodationService` | Magas | Igen |
| **REQ-10** | Előlegkérés | `AdvanceController` | Magas | Igen |
| **REQ-12** | Audit Naplózás | `AuditLogService` | Alacsony | Igen |