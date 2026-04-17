# nCore Streamio Addon V3

[English version below](#english)

---

## Magyar

Biztonságos, saját hosztolású [Stremio](https://www.stremio.com) addon, amely lehetővé teszi a tartalom streamelését közvetlenül az nCore.pro oldalról. Modern kezelőfelülettel rendelkezik a felhasználók és eszközök kezeléséhez.

### Funkciók
- **On-Demand Streaming:** Csak azt tölti le, amit éppen nézel, így spórol a sávszélességgel és a tárhellyel.
- **Felhasználó Kezelés:** Külön admin felület a felhasználók hozzáadásához és törléséhez.
- **Eszköz Kezelés:** Generálj egyedi manifest URL-eket minden eszközödre (TV, Telefon, Web).
- **Automata Tisztítás:** A letöltött adatok 24 óra után automatikusan törlődnek.
- **Title Fallback:** Ha nem található tartalom IMDB ID alapján, a rendszer automatikusan keres cím alapján is a Cinemeta segítségével.
- **Biztonság:** AES-256-GCM titkosítás az nCore hitelesítő adatokhoz és aláírt lejátszási URL-ek.

### Telepítés (Docker)

1. Győződj meg róla, hogy a **Docker** és a **Docker Compose** telepítve van.
2. Másold át a fájlokat a szerveredre.
3. Hozz létre egy `.env` fájlt a `server` mappában (használd a példát):
   ```env
   PORT=3000
   ENCRYPTION_KEY=64_karakteres_hex_kulcs
   SESSION_SECRET=hosszú_titkos_szöveg
   ADDON_DIR=./data
   DOWNLOADS_DIR=./downloads
   NODE_ENV=production
   APP_URL=http://szervered_ip_cime:3000
   NCORE_URL=https://ncore.pro
   ```
4. Indítsd el a konténert:
   ```bash
   docker compose up -d --build
   ```
5. Nyisd meg a böngésződben: `http://localhost:3000`
6. Futtasd az **Initial Setup** folyamatot az első admin létrehozásához.

---

<a name="english"></a>
## English

A secure, self-hosted [Stremio](https://www.stremio.com) addon that allows streaming content directly from nCore.pro. It features a modern management dashboard for users and devices.

### Features
- **On-Demand Streaming:** Only downloads the specific file you are watching, saving bandwidth and disk space.
- **User Management:** Dedicated admin interface to add and remove program users.
- **Device Management:** Generate unique manifest URLs for each of your installations (TV, Mobile, Web).
- **Automatic Cleanup:** Downloaded data is automatically deleted after 24 hours.
- **Title Fallback:** If content isn't found by IMDB ID, the system automatically performs a title-based search using Cinemeta.
- **Security:** AES-256-GCM encryption for nCore credentials and HMAC-signed playback URLs.

### Installation (Docker)

1. Ensure **Docker** and **Docker Compose** are installed.
2. Copy the files to your server.
3. Create a `.env` file in the `server` folder:
   ```env
   PORT=3000
   ENCRYPTION_KEY=64_character_hex_key
   SESSION_SECRET=long_random_string
   ADDON_DIR=./data
   DOWNLOADS_DIR=./downloads
   NODE_ENV=production
   APP_URL=http://your_server_ip:3000
   NCORE_URL=https://ncore.pro
   ```
4. Start the container:
   ```bash
   docker compose up -d --build
   ```
5. Open in your browser: `http://localhost:3000`
6. Run the **Initial Setup** to create the first admin user.

## License
MIT
