# Staffi - Szakszótár és Terminológia

## 1. Dokumentum Célja

Ez a dokumentum tartalmazza a Staffi dolgozói menedzsment rendszerben használt rövidítéseket, szakkifejezéseket és terminológiát. A dokumentum célja, hogy egységes nyelvezettet biztosítson a felhasználók, fejlesztők és rendszergazdák számára.

**Verzió:** 1.0  
**Utolsó frissítés:** 2026. január 28.  
**Célközönség:** Felhasználók, fejlesztők, rendszergazdák, HR munkatársak

---

## 2. Rövidítések

### 2.1 Általános Rövidítések

| Rövidítés | Teljes Alak | Jelentés | Kontextus |
|-----------|-------------|----------|-----------|
| **HR** | Human Resources | Emberi Erőforrás | HR munkatársak, akik kezelik a dolgozókat |
| **ADMIN** | Administrator | Adminisztrátor | Rendszergazda teljes hozzáféréssel |
| **TAJ** | Társadalombiztosítási Azonosító Jel | TB azonosító | Dolgozók társadalombiztosítási száma |
| **ID** | Identifier | Azonosító | Egyedi azonosító szám |
| **PDF** | Portable Document Format | Hordozható dokumentum formátum | Szerződések letöltési formátuma |

### 2.2 Technikai Rövidítések

| Rövidítés | Teljes Alak | Jelentés | Használat |
|-----------|-------------|----------|-----------|
| **API** | Application Programming Interface | Alkalmazás programozási felület | Backend kommunikáció |
| **JWT** | JSON Web Token | JSON webes token | Autentikációs token |
| **HTTP** | Hypertext Transfer Protocol | Hipertext átviteli protokoll | Webes kommunikáció |
| **HTTPS** | HTTP Secure | Biztonságos HTTP | Titkosított kommunikáció |
| **REST** | Representational State Transfer | REST architektúra | API design pattern |
| **CRUD** | Create, Read, Update, Delete | Létrehozás, Olvasás, Frissítés, Törlés | Alapvető adatműveletek |
| **UI** | User Interface | Felhasználói felület | Grafikus interfész |
| **UX** | User Experience | Felhasználói élmény | Használhatóság |

---

## 3. Szakterületi Fogalmak

### 3.1 HR és Munkaügyi Fogalmak

#### Dolgozó
**Definíció:** Az alkalmazásban regisztrált személy, aki a cég alkalmazásában áll.

**Típusok:**
- Aktív dolgozó: Jelenleg alkalmazásban lévő személy
- Inaktív dolgozó: Már nem alkalmazott vagy felfüggesztett státuszú személy

**Kontextus:** A rendszerben minden dolgozónak egyedi azonosítója van, és szerepköre lehet EMPLOYEE, HR vagy ADMIN.

#### Munkaszerződés
**Definíció:** Jogi dokumentum, amely rögzíti a munkaviszony feltételeit.

**Tartalma:**
- Kezdő dátum
- Végdátum (opcionális)
- Óradíj
- Heti munkaidő
- Szerződésszám

**Kontextus:** A rendszer automatikusan generál PDF formátumú szerződéseket.

#### Előleg
**Definíció:** A dolgozó által kért előzetes kifizetés, amelyet a következő fizetésből levonnak.

**Státuszok:**
- PENDING (Függőben): Még nem bírálták el
- APPROVED (Jóváhagyva): HR/Admin jóváhagyta
- REJECTED (Elutasítva): HR/Admin elutasította
- PAID (Kifizetve): Már kifizetésre került

**Kontextus:** Csak EMPLOYEE szerepkörű felhasználók kérhetnek előleget.

#### Szállás (Accommodation)
**Definíció:** Épület vagy létesítmény, ahol a dolgozók lakhatnak.

**Tulajdonságok:**
- Név
- Cím
- Manager kapcsolat
- Teljes kapacitás (automatikusan számolt)

**Kontextus:** Kapacitás a szobák kapacitásainak összege.

#### Szoba (Room)
**Definíció:** Lakóegység egy szálláson belül.

**Tulajdonságok:**
- Szobaszám (egyedi a szálláson belül)
- Kapacitás (hány fő fér el)
- Jelenlegi foglaltság
- Jelenlegi lakók listája

**Kontextus:** Egy szobában több dolgozó is lakhat, de nem több, mint a kapacitás.

---

## 4. Technikai Fogalmak

### 4.1 Autentikáció és Jogosultság

#### Token (JWT Token)
**Definíció:** Titkosított karakterlánc, amely azonosítja a bejelentkezett felhasználót.

**Tartalma:**
- Felhasználói adatok (név, email, szerepkör)
- Lejárati idő (4 óra)
- Digitális aláírás

**Példa használat:**
```
Bejelentkezéskor a backend visszaad egy tokent
→ Token tárolása localStorage-ban
→ Minden API kéréshez csatolva az Authorization headerben
→ Lejárat után automatikus kijelentkezés
```

#### Szerepkör (Role)
**Definíció:** A felhasználó jogosultsági szintje a rendszerben.

**Típusok:**
1. **ADMIN**: Teljes hozzáférés
   - Minden funkció elérhető
   - Felhasználók kezelése
   - Audit naplók megtekintése
   
2. **HR**: HR funkciók
   - Dolgozók kezelése
   - Szerződések kezelése
   - Előlegek elbírálása
   - Szállások megtekintése (nem módosítás)
   
3. **EMPLOYEE**: Alapvető dolgozói funkciók
   - Saját adatok megtekintése
   - Előleg kérelmezése
   - Szoba információk megtekintése

**Példa:**
```
Admin bejelentkezés → /admin/dashboard
HR bejelentkezés → /admin/dashboard (korlátozott funkciók)
Employee bejelentkezés → /employees/dashboard
```

#### Guard (Route Guard)
**Definíció:** Útvonal védelem, amely ellenőrzi a jogosultságokat navigáció előtt.

**Típusok:**
- **authGuard**: Bejelentkezést ellenőrzi
- **adminGuard**: ADMIN vagy HR szerepkört ellenőrzi
- **adminOnlyGuard**: Csak ADMIN szerepkört engedélyez

**Példa:**
```typescript
/admin/user-management → adminOnlyGuard
→ Csak ADMIN léphet be
→ HR és EMPLOYEE átirányítva
```

#### Lazy Loading
**Definíció:** Kódok késleltetett betöltése, amikor szükség van rájuk.

**Előnyök:**
- Kisebb kezdeti bundle méret (73% csökkenés)
- Gyorsabb oldal betöltés
- Jobb felhasználói élmény

**Példa:**
```
Alkalmazás indítás → Csak login betöltve (615 KB)
Admin bejelentkezés → Admin modul betöltve (+850 KB)
Employee bejelentkezés → Employee modul betöltve (+380 KB)
```

### 4.2 Backend Kommunikáció

#### API Endpoint
**Definíció:** Egyedi URL cím, amely egy adott backend funkcióhoz kapcsolódik.

**Formátum:** `HTTP_METÓDUS /api/útvonal`

**Példák:**
```
GET    /api/employees          - Dolgozók listázása
POST   /api/employees          - Új dolgozó létrehozása
PUT    /api/employees/{id}     - Dolgozó módosítása
DELETE /api/employees/{id}     - Dolgozó törlése

GET    /api/accommodations     - Szállások listázása
POST   /api/accommodations     - Új szállás létrehozása

POST   /api/auth/login         - Bejelentkezés
PUT    /api/auth/change-password - Jelszó módosítás
```

#### HTTP Státuszkódok
**Definíció:** Háromjegyű számok, amelyek jelzik a kérés eredményét.

**Gyakori kódok:**
- **200 OK**: Sikeres kérés
- **201 Created**: Sikeres létrehozás
- **400 Bad Request**: Hibás kérés (validációs hiba)
- **401 Unauthorized**: Nincs bejelentkezve
- **403 Forbidden**: Nincs jogosultság
- **404 Not Found**: Nem található erőforrás
- **500 Internal Server Error**: Szerver hiba

**Példa:**
```
POST /api/employees (email már létezik)
→ 400 Bad Request
→ {"message": "Email already exists"}
→ Frontend: "Ez az e-mail cím már használatban van"
```

#### Interceptor
**Definíció:** Köztes szoftver, amely minden HTTP kérést/választ kezel.

**Típusok a Staffi-ban:**
1. **authInterceptor**: Token hozzáadása minden kéréshez
2. **errorTranslationInterceptor**: Hibák magyar fordítása

**Példa működés:**
```
Component: Dolgozó létrehozása
→ authInterceptor: Token hozzáadása
→ Backend kérés
→ Backend válasz (hiba)
→ errorTranslationInterceptor: Fordítás magyarra
→ Snackbar megjelenítése
```

---

## 5. Üzleti Fogalmak

### 5.1 Adatkezelés és Nyilvántartás

#### Aktív/Inaktív Státusz
**Definíció:** Jelzi, hogy egy dolgozó vagy felhasználó jelenleg aktív-e a rendszerben.

**Aktív:**
- Bejelentkezhet a rendszerbe
- Hozzáfér a funkcionalitáshoz
- Megjelenik a listákban (alapértelmezett)

**Inaktív:**
- Nem jelentkezhet be
- Nem fér hozzá a rendszerhez
- Külön szűrővel jelenik meg a listákban

**Üzleti szabály:** 
- Saját fiók nem deaktiválható
- Csak ADMIN deaktiválhat ADMIN/HR felhasználót

#### Audit Log (Napló)
**Definíció:** Rendszeresemények nyilvántartása biztonsági és visszakeresési célból.

**Naplózott események:**
- CREATE: Új rekord létrehozása
- UPDATE: Meglévő rekord módosítása
- DELETE: Rekord törlése
- LOGIN: Bejelentkezés
- LOGOUT: Kijelentkezés

**Tartalma:**
- Ki végezte (felhasználó)
- Mit (művelet típusa)
- Mikor (időbélyeg)
- Min (entitás típusa és ID)
- Régi érték
- Új érték
- IP cím

**Hozzáférés:** Csak ADMIN szerepkör

**Példa:**
```
Esemény: Dolgozó email módosítása
- Felhasználó: Admin Bacsi (ADMIN)
- Művelet: UPDATE
- Entitás: Employee #5
- Régi érték: {"email": "old@test.com"}
- Új érték: {"email": "new@test.com"}
- Időpont: 2026-01-28 14:30:00
- IP: 192.168.1.100
```

### 5.2 Munkafolyamatok

#### Előleg Kérelmezési Folyamat
**Lépések:**
1. EMPLOYEE: Előleg kérelem beküldése (összeg + indoklás)
2. PENDING státusz
3. HR/ADMIN: Kérelem elbírálása
4. APPROVED vagy REJECTED státusz
5. Ha APPROVED: PAID státusz kifizetés után

**Üzleti szabályok:**
- Összeg > 0
- Indoklás kötelező
- Elutasításkor indoklás kötelező
- Már elbírált kérelem nem módosítható

#### Szoba Foglalási Folyamat
**Lépések:**
1. HR/ADMIN: Dolgozó profil megnyitása
2. Szobaszám megadása/módosítása
3. Rendszer ellenőrzi:
   - Szoba létezik?
   - Van szabad hely?
   - Dolgozó nincs már másik szobában?
4. Sikeres beállítás → RoomAllocation rekord
5. Dolgozó látja a szobát "Szobám" oldalon

**Üzleti szabályok:**
- Dolgozó max 1 aktív szobában lehet
- Szoba kapacitás nem léphető túl
- Betelt szoba nem törölhető

---

## 6. Projekt-specifikus Kifejezések

### 6.1 UI/UX Elemek

#### Snackbar
**Definíció:** Rövid üzenet, amely a képernyő alján jelenik meg.

**Típusok:**
- Siker üzenet (zöld): "Dolgozó sikeresen létrehozva!"
- Hiba üzenet (piros): "Ez az e-mail cím már használatban van"
- Info üzenet (kék): "Adat betöltése..."

**Tulajdonságok:**
- Automatikus eltűnés (3-5 másodperc)
- Bezárás gomb
- Pozíció: top-center

#### Dialog (Modal)
**Definíció:** Felugró ablak, amely átfedi a fő tartalmat.

**Típusok a Staffi-ban:**
- **Detail Dialog**: Megtekintés (pl. dolgozó adatai)
- **Edit Dialog**: Szerkesztés (pl. dolgozó módosítása)
- **Add Dialog**: Új létrehozása (pl. új dolgozó)
- **Confirmation Dialog**: Megerősítés (pl. törlés előtt)

**Példa:**
```
"Megtekintés" gomb → Employee Detail Dialog
"Szerkesztés" gomb → Employee Edit Dialog
"Új dolgozó" gomb → Employee Add Dialog
```

#### Chip
**Definíció:** Kis, színes címke státusz vagy információ megjelenítésére.

**Használat a Staffi-ban:**
- Státusz megjelenítés (Aktív/Inaktív)
- Szerepkör megjelenítés (ADMIN/HR/EMPLOYEE)
- Előleg státusz (Függőben/Jóváhagyva/Elutasítva)

**Színkódok:**
- Zöld: Aktív, Jóváhagyva
- Piros: Inaktív, Elutasítva
- Sárga: Függőben
- Kék: ADMIN
- Lila: HR
- Szürke: EMPLOYEE

### 6.2 Adatmezők

#### Magyar Név Formátum
**Definíció:** Vezetéknév + Keresztnév sorrend (magyar konvenció).

**Példák:**
- ✅ Helyes: "Kovács János"
- ❌ Helytelen: "János Kovács"

**Alkalmazás minden részén:**
- Listák
- Navbar felhasználó név
- Dialógok
- Kijelzések

#### Adóazonosító jel (Tax ID)
**Definíció:** 10 számjegyű egyedi azonosító, amely minden magyar állampolgárnak van.

**Formátum:** 10 számjegy (pl. 8234567891)

**Validáció:**
- Kötelező mező dolgozóknak
- Egyedinek kell lennie a rendszerben
- Backend ellenőrzi a duplikációt

#### TAJ szám
**Definíció:** 9 számjegyű társadalombiztosítási azonosító jel.

**Formátum:** 9 számjegy (pl. 123456789)

**Validáció:**
- Kötelező mező dolgozóknak
- Egyedinek kell lennie
- Backend validálja

#### Személyi igazolvány szám (ID Card Number)
**Definíció:** Személyi igazolvány egyedi azonosítója.

**Formátum:** Általában 6 betű és szám (pl. AB123456)

**Validáció:**
- Egyedi a rendszerben
- Backend ellenőrzés

---

## 7. Kapcsolódó Fogalmak Hivatkozás

### 7.1 Entitások Közötti Kapcsolatok

```
User (Felhasználó)
  └─> Employee (Dolgozó adatok)
        ├─> Contract[] (Szerződések)
        ├─> AdvanceRequest[] (Előleg kérelmek)
        └─> RoomAllocation? (Szoba beosztás)

Accommodation (Szállás)
  └─> Room[] (Szobák)
        └─> RoomAllocation[] (Foglalások)
              └─> Employee (Dolgozó)

AuditLog (Napló)
  ├─> User (Ki végezte)
  └─> Entity (Min végezte)
```

### 7.2 Státusz Átmenetek

#### Dolgozó Státusz
```
[Új dolgozó]
    ↓
  ACTIVE (Aktív)
    ↓
  INACTIVE (Inaktív)
```

#### Előleg Státusz
```
[Új kérelem]
    ↓
  PENDING (Függőben)
    ↓
    ├─> APPROVED (Jóváhagyva) → PAID (Kifizetve)
    └─> REJECTED (Elutasítva) [végállapot]
```

#### Szerződés Státusz
```
[Új szerződés]
    ↓
  DRAFT (Tervezet) → PDF generálás
    ↓
  ACTIVE (Aktív)
    ↓
    ├─> TERMINATED (Lezárt) [manuálisan]
    └─> EXPIRED (Lejárt) [automatikusan end date alapján]
```

---

## 8. Verziókezelés és Frissítések

### 8.1 Dokumentum Verzió Előzmények

| Verzió | Dátum | Változások | Szerző |
|--------|-------|------------|--------|
| 1.0 | 2026-01-28 | Kezdeti verzió | Staffi Dev Team |

### 8.2 Tervezett Kiegészítések

- [ ] Szerződés típusok részletesebb leírása
- [ ] Előleg számítási szabályok
- [ ] Jogosultsági mátrix
- [ ] API végpontok teljes listája
- [ ] Hibaüzenetek fordítási táblázata

---

## 9. Kapcsolódó Dokumentumok

- [Felhasználói Kézikönyv](USER_MANUAL.md)
- [API Dokumentáció](API_DOCUMENTATION.md)
- [Telepítési Útmutató](INSTALLATION_GUIDE.md)
- [Fejlesztői Dokumentáció](DEVELOPER_GUIDE.md)
- [Tesztelési Útmutató](TESTING_GUIDE.md)

---

## 10. Megjegyzések

### Használati Tanácsok

1. **Új felhasználóknak:** Kezdd a 2. és 3. fejezettel (Rövidítések és Szakterületi fogalmak)
2. **Fejlesztőknek:** Fókuszálj a 4. fejezetre (Technikai fogalmak)
3. **HR munkatársaknak:** Az 5. fejezet (Üzleti fogalmak) a legfontosabb
