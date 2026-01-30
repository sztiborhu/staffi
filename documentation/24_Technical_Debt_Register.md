# Technical Debt Register - Staffi

---

## 1. Nyilvántartás Célja

Jelen dokumentum célja a Staffi projekt fejlesztése során – az MVP (Minimum Viable Product) státusz elérése érdekében – hozott technikai kompromisszumok, elhalasztott feladatok és szuboptimális megoldások nyomon követése. A nyilvántartás segíti a csapatot a jövőbeli refaktorálási feladatok ütemezésében, a rendszer stabilitásának megőrzésében és a "big bang" átírások elkerülésében.

---

## 2. Adósság Kategóriák

A technikai adósságokat az alábbi dimenziók mentén osztályozzuk:

### 2.1 Kód minőség
A forráskód olvashatóságát, karbantarthatóságát érintő problémák (pl. duplikációk, "magic number"-ek, túl bonyolult metódusok, elavult könyvtárak).

### 2.2 Architektúra
A rendszer szerkezetét érintő döntések (pl. Monolitikus szerkezet vs. Modularitás, rétegek közötti szivárgás, szoros csatolás).

### 2.3 Tesztelés
A tesztlefedettség hiányosságai (pl. hiányzó Unit tesztek, manuális tesztelésre hagyatkozás, E2E tesztek hiánya).

### 2.4 Dokumentáció
A kód és a dokumentáció közötti eltérések (pl. elavult API doksi, hiányzó Javadoc, setup guide hiányosságok).

### 2.5 Infrastruktúra
A telepítéssel és üzemeltetéssel kapcsolatos hiányosságok (pl. manuális deploy, CI/CD hiánya, titkok kezelése).

---

## 3. Adósság Bejegyzések

| Azonosító | Kategória | Leírás | Hatás | Költség | Prioritás | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-001** | Infrastruktúra | **Adatbázis migrációs eszköz hiánya.** Jelenleg a `ddl-auto: update` kezeli a sémát (`application.yml`), ami éles környezetben adatvesztéshez vezethet. Flyway vagy Liquibase bevezetése szükséges. | **Magas** (Kritikus adatbiztonság) | Közepes (1-2 nap) | **P1 - Azonnal** | Nyitott |
| **TD-002** | Tesztelés | **Alacsony tesztlefedettség.** A backend Unit tesztek lefedettsége nem éri el a PRD-ben célzott 70%-ot. Különösen a Service réteg logikája hiányos. | Közepes (Regressziós hibák) | Magas (Folyamatos) | **P2 - Magas** | Folyamatban |
| **TD-003** | Biztonság / Infra | **Titkok kezelése.** A JWT secret és DB jelszavak környezeti változókban vannak, de nincs Secret Manager (pl. Vault). | Magas (Biztonsági kockázat) | Alacsony (1 nap) | **P1 - Azonnal** | Nyitott |
| **TD-004** | Architektúra | **Szoros csatolás a modulok között.** Bár monolit, a `ContractService` és `EmployeeService` közötti hívások direkt metódushívások, nem eseményvezéreltek. Ez nehezíti a későbbi szétválasztást. | Alacsony (Jelenleg) | Magas | **P4 - Alacsony** | Backlog |
| **TD-005** | Infrastruktúra | **CI/CD Pipeline hiánya.** A build és deploy folyamat manuális scripteken alapul. Nincs automatikus tesztfuttatás commitkor. | Közepes (Lassú release) | Közepes (2-3 nap) | **P2 - Magas** | Nyitott |
| **TD-006** | Dokumentáció | **Swagger/OpenAPI részletessége.** A generált API dokumentáció (`OpenAPIConfig.java`) létezik, de hiányoznak a részletes leírások és példaértékek a DTO-khoz. | Alacsony (DevExp) | Alacsony | **P3 - Közepes** | Nyitott |
| **TD-007** | Kód minőség | **Angular State Management.** A frontend jelenleg Service-ekben tárolja az állapotot. Komplexebb adatoknál (pl. szobafoglaltság) NgRx vagy Signal bevezetése javasolt. | Közepes (Skálázhatóság) | Magas | **P4 - Alacsony** | Backlog |

---

## 4. Prioritás Mátrix

A feladatok rangsorolása a **Hatás** (Impact) és a **Ráfordítás** (Effort) alapján történik.

| | Alacsony Ráfordítás | Magas Ráfordítás |
| :--- | :--- | :--- |
| **Magas Hatás** | **Quick Wins (P1)**<br>*(TD-001 DB Migráció, TD-003 Secrets)* | **Stratégiai Projektek (P2)**<br>*(TD-002 Tesztek, TD-005 CI/CD)* |
| **Alacsony Hatás** | **Fillerek (P3)**<br>*(TD-006 Docs)* | **Hosszú távú / Luxus (P4)**<br>*(TD-004 Eseményvezérlés, TD-007 NgRx)* |

---

## 5. Törlesztési Terv

A technikai adósság törlesztése beépül a fejlesztési sprintekbe. Minden sprint kapacitásának **20%-át** technikai adósságok rendezésére fordítjuk.

### Fázis 1: Stabilitás (Azonnal)
* **Cél:** Az adatvesztés és biztonsági incidensek kockázatának minimalizálása.
* **Feladatok:**
    1.  Flyway beüzemelése, jelenlegi séma verziózása (`V1__init.sql`).
    2.  `application.yml` tisztítása, Docker secrets bevezetése.

### Fázis 2: Minőségbiztosítás (Következő 2 Sprint)
* **Cél:** A fejlesztési ciklus gyorsítása és a hibák csökkentése.
* **Feladatok:**
    1.  GitHub Actions workflow létrehozása (Build + Test).
    2.  Unit teszt lefedettség növelése a kritikus `AccommodationService` és `AdvanceService` osztályokban.

### Fázis 3: Skálázhatóság (Későbbi fejlesztés)
* **Cél:** Felkészülés a nagyobb terhelésre és esetleges moduláris szétválasztásra.
* **Feladatok:**
    1.  Domain Event-ek bevezetése a modulok közötti kommunikációra (Spring ApplicationEvents).
    2.  Frontend refaktorálás (Modern Angular feature-ök, Signals).

