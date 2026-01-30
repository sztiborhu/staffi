# Software Architecture Document (SAD) - Staffi
**Verzió:** 1.0  

## 1. Bevezetés

### 1.1 Dokumentum célja
Ez a dokumentum a **Staffi** munkaerő-menedzsment rendszer szoftverarchitektúrájának átfogó leírását nyújtja. Célja, hogy közös megértést biztosítson a fejlesztők, tesztelők és érdekelt felek számára a rendszer szerkezetéről, a választott technológiákról és a tervezési döntésekről.

### 1.2 Hatókör
A Staffi rendszer egy integrált webes alkalmazás, amely támogatja a munkaerőkölcsönző cégek működését. A rendszer hatóköre kiterjed:
* Felhasználók és jogosultságok kezelésére (Admin, HR, Munkavállaló).
* Munkavállalói nyilvántartásra és szerződésgenerálásra.
* Szálláshelyek és szobabeosztások (allokáció) menedzsmentjére.
* Pénzügyi előlegkérelmek kezelésére és jóváhagyási folyamatára.

### 1.3 Definíciók és rövidítések
* **SAD:** Software Architecture Document.
* **PRD:** Product Requirement Document.
* **DTO:** Data Transfer Object – adatok továbbítására szolgáló objektum rétegek között.
* **JWT:** JSON Web Token – a hitelesítéshez használt szabvány.
* **SPA:** Single Page Application (Angular alapú frontend).

## 2. Architektúra Áttekintés

### 2.1 Rendszer kontextus diagram
A rendszer egy központi webes alkalmazásként működik, amelyet három fő felhasználói csoport ér el böngészőn keresztül:
1.  **Adminisztrátorok:** Biztonsági napló megtekintése, fiókok létrehozása 
2.  **HR Menedzserek:** Adminisztrációs feladatok, riportok, jóváhagyások.
3.  **Munkavállalók:** Önkiszolgáló felület (profil, előlegkérés, szállásinfó).

A rendszer backendje REST API-n keresztül kommunikál a klienssel és Hibernate segítségével az adatbázissal.

### 2.2 Magas szintű architektúra
A Staffi egy **többrétegű (N-tier)** architektúrát követ, kliens-szerver felépítéssel:

* **Frontend (Kliens):** Angular keretrendszerben írt SPA, amely HTTP REST hívásokkal kommunikál a szerverrel.
* **Backend (Szerver):** Java alapú Spring Boot alkalmazás, amely üzleti logikát és adatkezelést valósít meg.
* **Adatbázis:** PostgreSQL relációs adatbázis a perzisztencia biztosítására.

### 2.3 Komponensek és felelősségeik

| Komponens | Technológia | Felelősség |
| :--- | :--- | :--- |
| **Frontend UI** | Angular 19+, Material UI | Felhasználói interakció, űrlapok, adatok megjelenítése, kliens oldali routing. |
| **API Layer** | Spring Web MVC | REST végpontok kiajánlása, bejövő kérések validálása (`controllers` csomag). |
| **Service Layer** | Spring Service | Üzleti logika (pl. szoba allokáció szabályai, előleg jóváhagyás) (`services` csomag). |
| **Persistence** | Spring Data JPA / Hibernate | Adatbázis műveletek absztrakciója, ORM leképezés (`repositories`, `entities` csomag). |
| **Security** | Spring Security, JJWT | Hitelesítés (Login) és felhatalmazás (Role-based access). |

## 3. Architekturális Nézetek

### 3.1 Logikai nézet
A backend kódstruktúrája rétegelt architektúrát követ, funkcionális csoportosítással kiegészítve.

* **Controllers (`hu.sztibor.staffi.backend.controllers`):** A belépési pontok. 
    * Példák: `AuthController`, `EmployeeController`, `AccommodationController`.
* **Services (`hu.sztibor.staffi.backend.services`):** Tranzakciókezelés és logika. 
    * Példák: `AccommodationService` végzi a szálláskezelést, `PdfGeneratorService` a szerződésgenerálást.
* **Domain Model (`hu.sztibor.staffi.backend.entities`):** Az adatbázis tábláit reprezentáló osztályok (pl. `User`, `Employee`, `RoomAllocation`).
* **Data Transfer (`hu.sztibor.staffi.backend.dto`):** A Frontend és Backend közötti adatmozgást segítő egyszerű objektumok, elrejtve az entitások belső szerkezetét.
* **Mappers (`hu.sztibor.staffi.backend.mappers`):** MapStruct használata az Entitás <-> DTO konverzióhoz (pl. `UserMapper`).

### 3.2 Fejlesztési nézet
A forráskód egy "Monorepo" jellegű struktúrában helyezkedik el:
* `/backend`: Gradle alapú Java projekt.
    * Főbb függőségek: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `jjwt` (JWT kezelés), `mapstruct`.
* `/frontend`: Angular CLI projekt.
    * Főbb függőségek: `@angular/material`, `@angular/router`, `rxjs`.

### 3.3 Folyamat nézet (Példa: Előlegkérés)
1. A Frontend elküld egy `POST /api/advances` kérést a `CreateAdvanceRequestDto` tartalommal.
2. A `JwtAuthFilter` ellenőrzi a token érvényességét.
3. Az `AdvanceController` fogadja a kérést és továbbítja az `AdvanceRequestService`-nek.
4. A Service validálja a kérést, majd elmenti az `AdvanceRequestRepository`-n keresztül "PENDING" státusszal.
5. A rendszer 200 OK választ küld a kliensnek.

### 3.4 Fizikai nézet (Deployment)
A rendszer konténerizált környezetben futtatandó (bár a Dockerfile nem része a feltöltött fájloknak, a PRD említi a Docker használatát).
* **App Server:** Docker konténerben futó Java (JRE 17+) környezet.
* **Web Server:** Nginx vagy Apache a statikus Angular fájlok kiszolgálására és reverse proxy-ként az API felé.
* **Database Server:** PostgreSQL konténer perzisztens kötettel.

## 4. Architekturális Döntések

### 4.1 Választott minták és indoklásuk
* **Monolitikus Architektúra:** Eredetileg mikroszolgáltatásnak indult, de az egyszerűsítés, a tranzakciós integritás és a fejlesztési sebesség miatt monolitikus szerkezetre váltottunk. Ez lehetővé teszi a könnyebb `JOIN` műveleteket (pl. Szállás + Dolgozó adatok) és egyszerűsíti a deploy folyamatot.
* **Stateless Authentication (JWT):** A szerver nem tárol session állapotot, ami javítja a skálázhatóságot. Minden kérés tartalmazza a hitelesítő tokent.
* **Repository Pattern:** Az adatbázis hozzáférés leválasztása az üzleti logikáról, megkönnyítve a tesztelhetőséget.

### 4.2 Alternatívák elemzése
* **Mikroszolgáltatások:** A mikroszolgáltatások bevezetése túlzott overheadet jelentett volna egy ekkora méretű MVP-nél.
* **Session-based Auth:** Elvetve, mert nehezíti a horizontális skálázást és a mobil kliensek támogatását.


## 5. Keresztvágó Szempontok

### 5.1 Biztonság
* **Hitelesítés:** `UserAuthProvider` és `JwtAuthFilter` biztosítja a JWT alapú beléptetést.
* **Jelszókezelés:** A jelszavak hashelve kerülnek tárolásra (`PasswordConfig`), nyers jelszó soha nem közlekedik válaszüzenetben.
* **Jogosultságkezelés:** Szerepkör alapú hozzáférés (Role: ADMIN, HR, EMPLOYEE) az API végpontokon.
* **CORS:** Konfigurált Cross-Origin Resource Sharing a frontend és backend közötti kommunikációhoz.

### 5.2 Teljesítmény
* **Lazy Loading:** A JPA entitáskapcsolatoknál (pl. `User` -> `Employee`) a szükségtelen adatbetöltések elkerülése.
* **Frontend Optimalizáció:** Angular modulok lazy loadingja.

### 5.3 Skálázhatóság
* A backend állapotmentes (Stateless), így több példányban is futtatható Load Balancer mögött. Az egyetlen állapotmegőrző réteg az adatbázis.

### 5.4 Hibatűrés
* **Globális Kivételkezelés:** A `RestExceptionHandler` osztály (`@ControllerAdvice`) elkapja a futásidejű hibákat (pl. `AppException`), és egységes formátumú (`ErrorDto`) választ küld a kliensnek, elkerülve a stacktrace kiszivárgását.

---

## 6. Interfészek

### API Interfész (REST)
A backend JSON formátumban kommunikál a külvilággal.
* **Auth:** `/login`, `/register`
* **Employees:** `/api/employees` (CRUD műveletek)
* **Accommodations:** `/api/accommodations` (Szállások és szobák)
* **Advances:** `/api/advances` (Igénylés és bírálat)
* **Contracts:** `/api/contracts` (Generálás és letöltés)
* **Audit log:** `/api/audit-logs` (Biztonsági napló)

### Adatbázis Interfész
* PostgreSQL adatbázis kapcsolat Hibernaten keresztül. Konfiguráció az `application.yml`-ben található.

---

## 7. Függelékek
* **PRD:** A részletes üzleti követelményeket tartalmazó dokumentum (`prd.yaml`).
* **API Dokumentáció:** A projekt Swagger/OpenAPI integrációt tartalmaz, amely automatikusan dokumentálja a végpontokat az `OpenAPIConfig.java` alapján.