# 🔀 HashingMs POC

> **Proof of Concept** demonstrujący architekturę mikroserwisową opartą na kolejkowaniu zadań przez Redis Pub/Sub. Wiadomość wprowadzona w interfejsie użytkownika jest wysyłana do backendu, który przekazuje ją do odpowiedniego workera (Java lub C#) za pośrednictwem kanałów Redis. Wynik jest zwracany asynchronicznie przez WebSocket (Socket.IO).

---

## 📐 Architektura systemu

```
┌─────────────────────────────────────────────────────────────────┐
│                         UŻYTKOWNIK                              │
│                      React Frontend                             │
│                    localhost:5173 (Vite)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP POST /test
                           │  WebSocket (Socket.IO)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Backend (Express)                     │
│                      localhost:3000                             │
│  - odbiera żądania HTTP                                         │
│  - publikuje zadania do Redis (kanał: java / csharp)            │
│  - subskrybuje kanał "result" i pushuje wyniki przez WS         │
└────────────┬────────────────┬────────────────┬──────────────────┘
             │  PUBLISH       │  SUBSCRIBE     │  PUBLISH
             ▼  "java"        ▲  "result"      ▼  "csharp"
┌────────────┴────────────────┴────────────────┴──────────────────┐
│                        Redis 8.2                                │
│                    (Pub/Sub broker)                             │
│                      localhost:6379                             │
└────────────┬────────────────────────────────┬───────────────────┘
             │  SUBSCRIBE "java"              │  SUBSCRIBE "csharp"
             ▼  PUBLISH "result"              ▼  PUBLISH "result"
┌────────────────────────┐      ┌─────────────────────────────────┐
│     Java Worker        │      │         C# Worker               │
│  (Java 17 + Jedis)     │      │   (.NET 10 + StackExchange.Redis)│
└────────────────────────┘      └─────────────────────────────────┘
```

### Przepływ danych

1. Użytkownik wpisuje tekst w przeglądarce i klika **JAVA** lub **C#**
2. Frontend wysyła `POST /test` do backendu Node.js z `{ text, algorithm }`
3. Backend generuje unikalny `UUID`, publikuje zadanie na odpowiednim kanale Redis (`java` lub `csharp`)
4. Odpowiedni worker subskrybuje swój kanał, odbiera zadanie, symuluje przetwarzanie (`Thread.sleep`), a następnie publikuje wynik na kanale `result`
5. Backend nasłuchuje na kanale `result` i przesyła dane do frontendu przez WebSocket (`io.emit('result', data)`)
6. Frontend wyświetla wynik w czasie rzeczywistym

---

## 🛠️ Tech Stack

### Frontend
| Technologia        | Wersja  | Rola                                   |
|--------------------|---------|----------------------------------------|
| React              | 19.x    | Biblioteka UI                          |
| TypeScript         | ~7.0    | Typowanie statyczne                    |
| Vite               | 8.x     | Dev server i bundler                   |
| Socket.IO Client   | 4.x     | Komunikacja WebSocket z backendem      |

### Backend
| Technologia        | Wersja  | Rola                                          |
|--------------------|---------|-----------------------------------------------|
| Node.js            | 20 LTS  | Środowisko uruchomieniowe                     |
| Express            | 5.x     | Framework HTTP                                |
| Socket.IO          | 4.x     | WebSocket server (push wyników do klienta)    |
| redis (npm)        | 6.x     | Klient Redis (publisher + subscriber)         |
| cors               | 2.x     | Middleware CORS                               |

### Java Worker
| Technologia        | Wersja  | Rola                                   |
|--------------------|---------|----------------------------------------|
| Java               | 17      | Środowisko uruchomieniowe              |
| Maven              | 3.9     | Build tool                             |
| Jedis              | 5.0.2   | Klient Redis (Pub/Sub)                 |
| Gson               | 2.10.1  | Serializacja/deserializacja JSON       |
| SLF4J              | 1.7.36  | Logowanie                              |

### C# Worker
| Technologia            | Wersja  | Rola                                   |
|------------------------|---------|----------------------------------------|
| .NET                   | 10.0    | Środowisko uruchomieniowe              |
| StackExchange.Redis    | 3.4.5   | Klient Redis (Pub/Sub)                 |
| System.Text.Json       | wbudowany | Serializacja/deserializacja JSON     |

### Infrastruktura
| Technologia     | Wersja       | Rola                              |
|-----------------|--------------|-----------------------------------|
| Redis           | 8.2 (Alpine) | Broker komunikatów (Pub/Sub)      |
| Docker          | -            | Konteneryzacja serwisów           |
| Docker Compose  | 3.8          | Orkiestracja kontenerów           |

---

## 📁 Struktura projektu

```
hashingMsPOC/
├── docker-compose.yml          # Orkiestracja wszystkich serwisów
│
├── backend/                    # Node.js + Express API
│   ├── index.js                # Główny plik serwera
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx             # Główny komponent UI
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── java-worker/                # Worker napisany w Javie
│   └── java-worker/
│       ├── src/main/java/hash/ms/poc/
│       │   └── Main.java       # Logika workera
│       ├── pom.xml
│       └── Dockerfile
│
└── csharp-worker/              # Worker napisany w C#
    └── csharp-worker/
        ├── Program.cs          # Logika workera
        ├── csharp-worker.csproj
        └── Dockerfile
```

---

## 🚀 Uruchomienie

### Wymagania wstępne

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (z obsługą Docker Compose)
- [Node.js](https://nodejs.org/) 20+ (tylko do lokalnego uruchomienia frontendu)

---

### ▶️ Uruchomienie przez Docker Compose (zalecane)

Uruchamia Redis, backend i obydwa workery w kontenerach.

```bash
# Zbuduj i uruchom wszystkie serwisy
docker compose up --build

# Lub w tle (detached)
docker compose up --build -d
```

> Redis → Backend → Java Worker i C# Worker startują automatycznie w odpowiedniej kolejności (health check Redis).

**Zatrzymanie:**
```bash
docker compose down
```

---

### 🖥️ Frontend – uruchomienie lokalne

Frontend NIE jest zawarty w `docker-compose.yml` i musi być uruchomiony osobno na hoście.

```bash
cd frontend
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem: **http://localhost:5173**

---

### Adresy serwisów

| Serwis         | Adres                    |
|----------------|--------------------------|
| Frontend       | http://localhost:5173    |
| Backend (HTTP) | http://localhost:3000    |
| Redis          | localhost:6379           |

---
## 📡 API

### `POST /test`

Wysyła zadanie do workera przez Redis.

**Request body:**
```json
{
  "text": "Hello World",
  "algorithm": "java"
}
```

| Pole        | Typ    | Wartości           |
|-------------|--------|--------------------|
| `text`      | string | dowolny tekst      |
| `algorithm` | string | `"java"` / `"csharp"` |

**Response `202 Accepted`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### WebSocket – zdarzenie `result`

Po przetworzeniu zadania przez workera backend emituje zdarzenie `result` przez Socket.IO:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "text": "HANDLED BY JAVAHello World"
}
```

---

## ⚙️ Kanały Redis

| Kanał     | Producent  | Konsument     | Opis                            |
|-----------|------------|---------------|---------------------------------|
| `java`    | Backend    | Java Worker   | Zadania do przetworzenia w Javie |
| `csharp`  | Backend    | C# Worker     | Zadania do przetworzenia w C#    |
| `result`  | Workers    | Backend       | Wyniki przetworzonych zadań      |
