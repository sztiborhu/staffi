# 4. API Specification - Staffi


## 1. API Áttekintés

### 1.1 Általános leírás
A Staffi API egy RESTful architektúrára épülő interfész, amely JSON formátumban kommunikál. A backend Spring Boot alapokon nyugszik, és biztosítja a munkaerő-menedzsment, szálláskezelés és pénzügyi folyamatok kiszolgálását. A rendszer állapotmentes (stateless), minden kérés hitelesítést igényel (kivéve a publikus végpontokat, mint a login).

### 1.2 Alap URL struktúra
Minden végpont a következő bázis URL alatt érhető el (környezettől függően):
`https://{host}/api`

### 1.3 Verziókezelési stratégia
A jelenlegi MVP fázisban a rendszer nem használ explicit URL verziózást (pl. `/v1/`), de a visszafelé kompatibilitás érdekében a jövőben az URL prefix vagy az `Accept` header alapú verziókezelés bevezetése javasolt.

---

## 2. Autentikáció és Autorizáció

### 2.1 Hitelesítési módszer
A rendszer **JWT (JSON Web Token)** alapú hitelesítést használ. A token érvényességét a `JwtAuthFilter` ellenőrzi minden bejövő kérésnél.

* **Header:** Minden védett végpont hívásakor a `Authorization` fejlécben kell küldeni a tokent.
* **Formátum:** `Bearer <token>`

### 2.2 Jogosultságkezelés
A végpontok védelme szerepkör alapú (RBAC), amelyet a `Role` enum definiál.

* **ADMIN:** Teljes hozzáférés minden végponthoz.
* **HR:** Hozzáférés a dolgozók (`EmployeeController`), szállások (`AccommodationController`) és pénzügyek kezeléséhez.
* **EMPLOYEE:** Csak a saját adatok, saját előlegkérelmek és publikus szállásinformációk elérése.

---

## 3. Végpontok Specifikációja

Az alábbi leírás csak egy részlete az API-nak, ha elindítjuk a projektet, akkor a Swagger UI segítségével minden részletét megnézhetjük az API-nak, és futtatni is tudunk kéréseket, mindezt egy felületről.
`/api/swagger-ui/index.html`

### 3.1 Auth Modul (`/api/auth`)

#### **Bejelentkezés**
* **Erőforrás:** `AuthController`
* **Művelet:** `POST`
* **Útvonal:** `/login`
* **Leírás:** Felhasználó beléptetése email/jelszó párossal.
* **Kérés törzs:** `CredentialsDto`
    ```json
    {
      "email": "hr@staffi.hu",
      "password": "secretpassword"
    }
    ```
* **Válasz (200 OK):** `UserDto` (tokennel)
    ```json
    {
      "id": 1,
      "email": "hr@staffi.hu",
      "firstName": "Éva",
      "lastName": "Kovács",
      "role": "HR",
      "token": "eyJhbGciOiJIUzI1..."
    }
    ```

---

### 3.2 Dolgozó Modul (`/api/employees`)

#### **Dolgozók listázása**
* **Erőforrás:** `EmployeeController`
* **Művelet:** `GET`
* **Útvonal:** `/`
* **Jogosultság:** HR, ADMIN
* **Paraméterek:**
    * `search` (query, opt): Keresés név alapján.
    * `status` (query, opt): `ACTIVE` | `INACTIVE`.
* **Válasz (200 OK):** `List<EmployeeDto>`

#### **Új dolgozó felvétele**
* **Művelet:** `POST`
* **Útvonal:** `/`
* **Jogosultság:** HR, ADMIN
* **Kérés törzs:** `CreateEmployeeDto`
* **Válasz (201 Created):** `EmployeeDto` (a létrehozott entitás).

#### **Dolgozó részletei**
* **Művelet:** `GET`
* **Útvonal:** `/{id}`
* **Válasz (200 OK):** `EmployeeDto` (Teljes profil).

---

### 3.3 Szállás Modul (`/api/accommodations`)

#### **Szállások listázása**
* **Erőforrás:** `AccommodationController`
* **Művelet:** `GET`
* **Útvonal:** `/`
* **Válasz:** `List<AccommodationDto>`

#### **Szobák lekérdezése**
* **Művelet:** `GET`
* **Útvonal:** `/{id}/rooms`
* **Leírás:** Visszaadja a szállás szobáit.
* **Válasz (200 OK):** `List<RoomDto>`

#### **Beköltöztetés (Allokáció)**
* **Művelet:** `POST`
* **Útvonal:** `/allocations`
* **Jogosultság:** HR, ADMIN
* **Kérés törzs:** `CreateAllocationDto`
    ```json
    {
      "roomId": 5,
      "employeeId": 101,
      "checkInDate": "2026-01-27"
    }
    ```
* **Válasz:**
    * `200 OK`: Sikeres beköltöztetés.
    * `409 Conflict`: Ha a szoba megtelt vagy a dolgozónak van aktív szállása.

---

### 3.4 Pénzügy Modul (`/api/advances`)

#### **Előleg igénylése**
* **Erőforrás:** `AdvanceController`
* **Művelet:** `POST`
* **Útvonal:** `/`
* **Jogosultság:** EMPLOYEE
* **Kérés törzs:** `CreateAdvanceRequestDto`
    ```json
    {
      "amount": 50000,
      "reason": "Váratlan kiadás"
    }
    ```
* **Válasz (201 Created):** Az igénylés rögzítve `PENDING` státusszal.

#### **Igénylések bírálata**
* **Művelet:** `POST` (vagy `PUT`)
* **Útvonal:** `/{id}/review`
* **Jogosultság:** HR, ADMIN
* **Kérés törzs:** `ReviewAdvanceRequestDto`
    ```json
    {
      "status": "APPROVED",
      "rejectionReason": null
    }
    ```
* **Válasz (200 OK):** Státusz frissítve.

---

### 3.5 Szerződés Modul (`/api/contracts`)

#### **Szerződés generálás**
* **Erőforrás:** `ContractController`
* **Művelet:** `POST`
* **Útvonal:** `/`
* **Kérés törzs:** `CreateContractDto`
* **Válasz (201 Created):** Létrejött szerződés adatai.

---

## 4. Adatmodellek
Az adatmodellek is megtalálhatóak Swagger UI-on.
`/api/swagger-ui/index.html`

### **UserDto**

| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | Long | Egyedi azonosító |
| `email` | String | Felhasználónév |
| `role` | Enum | `ADMIN`, `HR`, `EMPLOYEE` |
| `token` | String | JWT hozzáférési token |

### **EmployeeDto**

| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | Long | Belső azonosító |
| `firstName` | String | Keresztnév |
| `lastName` | String | Vezetéknév |
| `taxId` | String | Adóazonosító |
| `active` | boolean | Aktív-e a dolgozó |

### **AdvanceRequestDto**

| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | Long | Azonosító |
| `amount` | BigDecimal | Igényelt összeg |
| `status` | Enum | `PENDING`, `APPROVED`, `REJECTED`, `PAID` |

---

## 5. Hibakezelés

### 5.1 Hibaválasz formátum (`ErrorDto`)
Minden kivétel esetén a `RestExceptionHandler` egy egységes JSON választ küld:

```json
{
  "message": "A kért erőforrás nem található.",
  "status": 404
}
```
### 5.2 Hibakódok katalógusa

Az API standard HTTP státuszkódokat használ a sikeres és sikertelen kérések jelzésére. Az egyedi üzleti hibák esetén az `AppException` osztály kerül dobásra, amelyet a `RestExceptionHandler` formáz JSON válaszüzenetté.

* **400 Bad Request:** Érvénytelen bemeneti adat vagy üzleti logika hiba (pl. "Email already exists"). Általában `AppException` váltja ki.
* **401 Unauthorized:** A kéréshez nem tartozik érvényes hitelesítési token (JWT), vagy a token lejárt.
* **403 Forbidden:** A hitelesített felhasználónak nincs megfelelő jogosultsága (`Role`) az erőforrás eléréséhez.
* **404 Not Found:** A kért erőforrás (pl. User ID, Szoba ID) nem található az adatbázisban (pl. "Unknown user").
* **500 Internal Server Error:** Váratlan, kezeletlen szerveroldali hiba (pl. adatbázis kapcsolódási hiba).

---

## 6. Korlátozások

### 6.1 Kérésgyakoriság limitálás (Rate Limiting)
A backend alkalmazás szintjén (`application.yml`) jelenleg nincs konfigurálva beépített Rate Limiting. Éles (Production) környezetben javasolt API Gateway vagy Reverse Proxy (pl. Nginx) szintű korlátozás bevezetése a DoS támadások elleni védelem érdekében.
