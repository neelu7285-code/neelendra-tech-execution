import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const app = express();
const PORT = 3000;

// Initialize Database
const db = new Database("leads.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());

// API Route to save leads
app.post("/api/leads", (req, res) => {
  const { name, email, details } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const stmt = db.prepare("INSERT INTO leads (name, email, details) VALUES (?, ?, ?)");
    stmt.run(name, email, details);
    res.status(201).json({ message: "Lead saved successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to save lead" });
  }
});

// API Route for Admin Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "neelu7285@gmail.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // In a real app, we'd use JWT. For this demo, we'll return a simple token.
    res.json({ token: "secure-admin-session-token", email });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// API Route to fetch leads (Secure with Token)
app.get("/api/admin/leads", (req, res) => {
  const token = req.headers["authorization"];

  if (token !== "secure-admin-session-token") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "admin.html"));
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
