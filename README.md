# Tennis-Tournament-Ph-Schedule
It's so hard to find a website that shows the tennis schedule, especially UTC +8 time. 
So this shows live and upcoming tennis match schedules converted to **Philippine Standard Time (PHT / UTC+8)**.

---

## What It Does

- Shows ATP and WTA tennis matches in **Philippine time**
- Displays **live matches**, **upcoming**, and **finished** matches
- Shows **set-by-set scores** for completed and in-progress matches
- **Auto-refreshes** every 3 minutes

---

## Requirements

- [Node.js](https://nodejs.org) (v16 or higher)
- A [SportDB.dev](https://sportdb.dev) API key (free plan works)

---

## Setup

1. **Download** all files into the same folder:
   ```
   tennis-ph-time/
   ├── server.js #Fetches data from SportDB API
   └── index.html #Frontend
   ```

---

## Running the App

**Step 1** — Start the server in your terminal:
```bash
node server.js
```

You should see:
```
✅  Tennis PH Time — http://localhost:3456
    Open index.html in your browser!
```

**Step 2** — Open `index.html` in your browser.

---

## How It Works

```
Browser (index.html)
      ↓  fetch http://localhost:3456/matches
server.js (Node.js proxy)
      ↓  HTTPS requests with API key
SportDB.dev API (Flashscore data)
```

The browser can't call the SportDB API directly due to CORS restrictions, so `server.js` acts as a local proxy — it fetches the data server-side and passes it to the frontend.

---
