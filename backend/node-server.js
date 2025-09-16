// backend/node-server.js
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const WebSocket = require("ws");
const { exec } = require("child_process");

const app = express();
const PORT = 3002;
const WS_PORT = 4005;

// 🔐 Shared secret (must match central-server.js's SHARED_ADMIN_SECRET)
const SHARED_ADMIN_SECRET ="tusarranjanpradhan1234567890";

// 📂 Base directory (adjust this to your actual path)
const BASE_PATH = process.env.CUDA_BASE_PATH || "C:\\Users\\USER\\source\\Software\\Cuda";

// File paths
const STATUS_FILE   = path.join(BASE_PATH, "status.json");
const CONFIG_FILE   = path.join(BASE_PATH, "config.json");
const TELEGRAM_FILE = path.join(BASE_PATH, "telegramstatus.json");
const SCRIPTS_DIR   = path.join(BASE_PATH, "scripts");

// === Helper: Read JSON safely ===
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return null;
  }
}

// === Get System Data (nested format) ===
async function getSystemData() {
  const data = await readJsonFile(STATUS_FILE);
  if (!data || !data.systems) throw new Error("Invalid status.json format");

  const systemIdentifier = Object.keys(data.systems)[0];
  return {
    systemIdentifier,
    systemData: data.systems[systemIdentifier]
  };
}

// === CORS: Allow requests from your React frontend ===
app.use(cors({
  origin: "http://localhost:3000", // Your React app's URL
  methods: ["GET", "POST", "PUT"]
}));

// === Middleware: Parse JSON bodies ===
app.use(express.json());

// === GET Endpoints (Public, no auth needed for reading) ===
app.get("/system_identifier", async (req, res) => {
  try {
    const { systemIdentifier } = await getSystemData();
    res.json({ system_identifier: systemIdentifier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/data", async (req, res) => {
  try {
    const { systemIdentifier, systemData } = await getSystemData();
    res.json({ system_identifier: systemIdentifier, ...systemData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/bloom", async (req, res) => {
  try {
    const { systemData } = await getSystemData();
    res.json(systemData.bloom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/found", async (req, res) => {
  try {
    const { systemData } = await getSystemData();
    res.json(systemData.found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/init", async (req, res) => {
  try {
    const { systemData } = await getSystemData();
    res.json(systemData.init);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/load", async (req, res) => {
  try {
    const { systemData } = await getSystemData();
    res.json(systemData.load);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/progress", async (req, res) => {
  try {
    const { systemData } = await getSystemData();
    res.json(systemData.progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/system", async (req, res) => {
  try {
    const { systemData } = await getSystemData();
    res.json(systemData.system);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/config", async (req, res) => {
  try {
    const config = await readJsonFile(CONFIG_FILE);
    res.json(config || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/telegramstatus", async (req, res) => {
  try {
    const status = await readJsonFile(TELEGRAM_FILE);
    res.json(status || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === POST: Update config.json (from central dashboard) ===
app.post("/config", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== SHARED_ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const config = req.body;

  fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), (err) => {
    if (err) {
      console.error("Failed to save config:", err);
      return res.status(500).json({ success: false, message: "Save failed" });
    }
    console.log("✅ Config updated remotely");
    res.json({ success: true, message: "Config saved!" });
  });
});

// === POST: Run commands (start, stop, etc.) ===
app.post("/command", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== SHARED_ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { cmd, cmdId } = req.body;

  const scriptMap = {
    start: "start.bat",
    stop: "stop.bat",
    restart: "restart.bat",
    pause: "pause.bat",
    resume: "resume.bat"
  };

  const scriptName = scriptMap[cmd];
  if (!scriptName) {
    return res.json({ success: false, error: "Unknown command", cmdId });
  }

  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  console.log(`[COMMAND] Running: ${scriptPath}`);

  exec(`"${scriptPath}"`, (err, stdout, stderr) => {
    res.json({
      success: !err,
      output: stdout,
      error: stderr || err?.message,
      cmdId
    });
  });
});

app.post("/service-control", (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== SHARED_ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { action } = req.body;

  const commands = {
    start: "sudo systemctl start cryptohunt.service",
    stop: "sudo systemctl stop cryptohunt.service",
    restart: "sudo systemctl restart cryptohunt.service",
    status: "systemctl status cryptohunt.service",
  };

  const command = commands[action];

  if (!command) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error executing command: ${command}`, stderr);
      return res.status(500).json({ success: false, message: stderr });
    }
    res.json({ success: true, status: "success", message: stdout });
  });
});

// === SSE: Progress ===
app.get("/live/progress", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const interval = setInterval(async () => {
    try {
      const { systemData } = await getSystemData();
      res.write(`data: ${JSON.stringify(systemData.progress)}\n\n`);
    } catch (err) {
      res.write(`event: error\ndata: ${err.message}\n\n`);
    }
  }, 2000);

  req.on("close", () => {
    clearInterval(interval);
  });
});

// === SSE: System ===
app.get("/live/system", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const interval = setInterval(async () => {
    try {
      const { systemData } = await getSystemData();
      res.write(`data: ${JSON.stringify(systemData.system)}\n\n`);
    } catch (err) {
      res.write(`event: error\ndata: ${err.message}\n\n`);
    }
  }, 2000);

  req.on("close", () => {
    clearInterval(interval);
  });
});

// === WebSocket: Combined Updates ===
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  const interval = setInterval(async () => {
    try {
      const { systemData } = await getSystemData();
      ws.send(JSON.stringify({
        system: systemData.system,
        progress: systemData.progress
      }));
    } catch (err) {
      ws.send(JSON.stringify({ error: err.message }));
    }
  }, 2000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("WebSocket client disconnected");
  });
});

// === Start Server ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ CUDA Node API running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket live at ws://localhost:${WS_PORT}`);
});