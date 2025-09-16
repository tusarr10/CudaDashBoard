// backend/central-server.js
const express = require("express");
require('dotenv').config();
const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createServer } = require("http");
const WebSocket = require("ws");
const fetch = require("node-fetch");
const { Readable } = require('stream');
const os = require('os'); // Import the os module

const app = express();
const PORT = process.env.PORT || 2225;

// === Paths ===
const DATA_DIR = path.join(__dirname, "data");
const NODES_FILE = path.join(DATA_DIR, "nodes.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ASSIGNMENTS_FILE = path.join(DATA_DIR, "assignments.json");
const COMMAND_HISTORY_FILE = path.join(DATA_DIR, "command-history.json");
const SERVER_STATUS_FILE = path.join(DATA_DIR, "serverstatus.json");
const SECURITY_AUDIT_FILE = path.join(DATA_DIR, "securityaudit.json");
const HISTORY_DIR = path.join(DATA_DIR, "config-history");

// 🔐 Secrets (CHANGE THESE IN PRODUCTION!)
const SHARED_ADMIN_SECRET ="tusarranjanpradhan1234567890"; // Must match node-server.js
const JWT_SECRET ="tusarranjanpradhan1234567890@"; // Change this!

// === Ensure data directories exist ===
async function init() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(HISTORY_DIR, { recursive: true });

  const defaults = [
    { file: NODES_FILE, content: [] },
    { file: USERS_FILE, content: [] },
    { file: ASSIGNMENTS_FILE, content: {} },
    { file: COMMAND_HISTORY_FILE, content: [] },
    { file: SERVER_STATUS_FILE, content: [] },
    { file: SECURITY_AUDIT_FILE, content: [] }
  ];

  for (const { file, content } of defaults) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify(content, null, 2));
    }
  }

  // Create default admin user if none exists
  const users = await readJSON(USERS_FILE);
  if (users.length === 0) {
    const hashed = await bcrypt.hash("admin", 10);
    await writeJSON(USERS_FILE, [{ username: "admin", password: hashed, role: "admin" }]);
    console.log("✅ Default admin created: username='admin', password='admin'");
  }
}

init();

// === Middleware ===
const cors = require("cors");
app.use(cors({
  origin: "*", // Allow all origins
  credentials: true
}));
app.use(express.json());

// === Auth Middleware ===
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1] || req.query.token;
  if (!token) {
    logSecurityEvent("warn", "Unauthorized access attempt: No token provided", { ip: req.ip, path: req.path });
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logSecurityEvent("warn", "Unauthorized access attempt: Invalid or expired token", { ip: req.ip, path: req.path, error: err.message });
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    logSecurityEvent("warn", "Unauthorized access attempt: Admin access required", { username: req.user.username, ip: req.ip, path: req.path });
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

async function authorizeNodeAccess(req, res, next) {
  const { nodeId } = req.params;
  const nodes = await readJSON(NODES_FILE);
  const assignments = await readJSON(ASSIGNMENTS_FILE);

  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    logSecurityEvent("warn", "Node access attempt failed: Node not found", { username: req.user.username, nodeId, ip: req.ip, path: req.path });
    return res.status(404).json({ error: "Node not found" });
  }

  if (req.user.role === "admin") {
    req.node = node; // Admin can access any node
    logSecurityEvent("info", "Admin accessed node", { username: req.user.username, nodeId, ip: req.ip, path: req.path });
    return next();
  }

  const userAssignments = assignments[req.user.username] || [];
  const isAssigned = userAssignments.some(assignment => assignment.nodeId === nodeId);

  if (!isAssigned) {
    logSecurityEvent("warn", "Node access attempt failed: Forbidden", { username: req.user.username, nodeId, ip: req.ip, path: req.path });
    return res.status(403).json({ error: "Access to this node is forbidden" });
  }

  req.node = node; // Attach node info to request for later use
  logSecurityEvent("info", "User accessed node", { username: req.user.username, nodeId, ip: req.ip, path: req.path });
  next();
}

// === File Helpers ===
async function readJSON(file) {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    return [];
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function logServerEvent(level, message, details = {}) {
  try {
    const logs = await readJSON(SERVER_STATUS_FILE);
    const newLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...details,
    };
    logs.push(newLog);
    await writeJSON(SERVER_STATUS_FILE, logs);
  } catch (error) {
    console.error("Error logging server event:", error);
  }
}

async function logSecurityEvent(level, message, details = {}) {
  try {
    const logs = await readJSON(SECURITY_AUDIT_FILE);
    const newLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...details,
    };
    logs.push(newLog);
    await writeJSON(SECURITY_AUDIT_FILE, logs);
  } catch (error) {
    console.error("Error logging security event:", error);
  }
}

// === API Routes ===

// --- Login ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username, password });
  const users = await readJSON(USERS_FILE);
  console.log("Users:", users);
  const user = users.find(u => u.username === username);
  console.log("User found:", user);

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    logServerEvent("info", "User logged in successfully", { username: user.username });
    logSecurityEvent("info", "Successful login", { username: user.username });
    return res.json({ success: true, token, role: user.role });
  }

  logServerEvent("warn", "Failed login attempt", { username });
  logSecurityEvent("warn", "Failed login attempt", { username, ip: req.ip });
  res.status(401).json({ success: false, message: "Invalid credentials" });
});

// --- Get Nodes (User sees assigned, Admin sees all) ---
app.get("/api/nodes", authenticateToken, async (req, res) => {
  const nodes = await readJSON(NODES_FILE);
  const assignments = await readJSON(ASSIGNMENTS_FILE);
  const users = await readJSON(USERS_FILE);

  if (req.user.role === "admin") {
    // For admin, add who the node is assigned to
    nodes.forEach(n => {
      n.assignedTo = Object.keys(assignments)
        .filter(uid => assignments[uid]?.some(a => a.nodeId === n.id))
        .map(uid => users.find(u => u.username === uid)?.username || uid);
    });
    return res.json(nodes);
  }

  // For regular user, show only nodes they are assigned to
  const userAssignments = assignments[req.user.username] || [];
  const allowedNodes = nodes.filter(n =>
    userAssignments.some(assignment => assignment.nodeId === n.id)
  );

  res.json(allowedNodes);
});

// --- Proxy for Node-specific API calls (with authorization) ---
app.all("/api/nodes/:nodeId/proxy/*", authenticateToken, authorizeNodeAccess, async (req, res) => {
  const { nodeId } = req.params;
  const targetPath = req.params[0]; // This captures everything after /proxy/
  const node = req.node; // Node object attached by authorizeNodeAccess

  if (!node) {
    return res.status(500).json({ error: "Node information not available" });
  }

  const fullUrl = `${node.apiUrl}/${targetPath}`;
  console.log(`Proxying request to: ${fullUrl}`);

  try {
    const proxyRes = await fetch(fullUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "x-admin-token": SHARED_ADMIN_SECRET, // Pass admin token to node
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    const responseBody = await proxyRes.json();
    res.status(proxyRes.status).json(responseBody);
  } catch (error) {
    console.error(`Error proxying request to ${fullUrl}:`, error);
    res.status(500).json({ error: "Failed to proxy request to node" });
  }
});

app.post("/api/nodes/:nodeId/proxy/service-control", authenticateToken, authorizeNodeAccess, async (req, res) => {
  const { nodeId } = req.params;
  const { action } = req.body;
  const node = req.node;

  if (!node) {
    return res.status(500).json({ error: "Node information not available" });
  }

  const fullUrl = `${node.apiUrl}/service-control`;
  console.log(`Proxying service control request to: ${fullUrl}`);

  try {
    const proxyRes = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": SHARED_ADMIN_SECRET,
      },
      body: JSON.stringify({ action }),
    });

    const responseBody = await proxyRes.json();
    res.status(proxyRes.status).json(responseBody);
  } catch (error) {
    console.error(`Error proxying service control request to ${fullUrl}:`, error);
    res.status(500).json({ error: "Failed to proxy request to node" });
  }
});

// --- SSE Proxy for Node-specific live data (with authorization) ---
app.get("/api/nodes/:nodeId/proxy/live/:targetPath", authenticateToken, authorizeNodeAccess, async (req, res) => {
  const { nodeId, targetPath } = req.params;
  const node = req.node; // Node object attached by authorizeNodeAccess

  if (!node) {
    return res.status(500).json({ error: "Node information not available" });
  }

  const fullUrl = `${node.apiUrl}/live/${targetPath}`;
  console.log(`Proxying SSE request to: ${fullUrl}`);

  let upstreamResponse = null; // To hold the response from the node

  try {
    upstreamResponse = await fetch(fullUrl, {
      headers: {
        "x-admin-token": SHARED_ADMIN_SECRET,
        "Accept": "text/event-stream",
        "Connection": "keep-alive", // Explicitly request keep-alive
      },
    });

    if (!upstreamResponse.ok) {
      throw new Error(`Node SSE responded with status ${upstreamResponse.status}`);
    }

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Pipe the upstream response body to the client response
    upstreamResponse.body.pipe(res);

    // Handle client disconnect
    req.on("close", () => {
      console.log(`Client disconnected from SSE proxy for node ${nodeId} ${targetPath}`);
      if (upstreamResponse && upstreamResponse.body && typeof upstreamResponse.body.destroy === 'function') {
        upstreamResponse.body.destroy(); // Terminate the upstream connection
      }
    });

    // Handle upstream errors
    upstreamResponse.body.on('error', (err) => {
      console.error(`Error from node SSE stream for ${fullUrl}:`, err);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });

  } catch (error) {
    console.error(`Error setting up SSE proxy to ${fullUrl}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to set up SSE proxy to node" });
    } else {
      res.end();
    }
  }
});

// --- CRUD for Nodes (Admin Only) ---
app.put("/api/nodes/:nodeId", authenticateToken, requireAdmin, async (req, res) => {
  const { nodeId } = req.params;
  const { name, apiUrl, wsUrl } = req.body;

  const nodes = await readJSON(NODES_FILE);
  const nodeIndex = nodes.findIndex(n => n.id === nodeId);

  if (nodeIndex === -1) {
    return res.status(404).json({ error: "Node not found" });
  }

  nodes[nodeIndex] = { ...nodes[nodeIndex], name, apiUrl, wsUrl };
  await writeJSON(NODES_FILE, nodes);

  logServerEvent("info", "Node updated", { nodeId, name, apiUrl, wsUrl });
  res.json({ success: true, node: nodes[nodeIndex] });
});

app.post("/api/nodes", authenticateToken, requireAdmin, async (req, res) => {
  const { name, apiUrl, wsUrl } = req.body;

  const nodes = await readJSON(NODES_FILE);
  const newNode = {
    id: `node_${Date.now()}`,
    name,
    apiUrl,
    wsUrl,
    enabled: true
  };

  nodes.push(newNode);
  await writeJSON(NODES_FILE, nodes);

  logServerEvent("info", "Node added", { nodeId: newNode.id, name: newNode.name });
  res.status(201).json(newNode);
});

app.delete("/api/nodes/:nodeId", authenticateToken, requireAdmin, async (req, res) => {
  const { nodeId } = req.params;

  let nodes = await readJSON(NODES_FILE);
  const initialLength = nodes.length;
  nodes = nodes.filter(n => n.id !== nodeId);

  if (nodes.length === initialLength) {
    return res.status(404).json({ error: "Node not found" });
  }

  await writeJSON(NODES_FILE, nodes);

  // Also remove node's assignments from all users
  const assignments = await readJSON(ASSIGNMENTS_FILE);
  for (const userId in assignments) {
    assignments[userId] = assignments[userId].filter(assignment => assignment.nodeId !== nodeId);
  }
  await writeJSON(ASSIGNMENTS_FILE, assignments);

  logServerEvent("info", "Node deleted", { nodeId });
  res.json({ success: true, message: "Node deleted" });
});

// --- CRUD for Users (Admin Only) ---
app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
  const users = await readJSON(USERS_FILE);
  const assignments = await readJSON(ASSIGNMENTS_FILE);

  const enrichedUsers = users.map(u => {
    const userAssignments = assignments[u.username] || [];
    return {
      username: u.username,
      role: u.role,
      assignedNodes: userAssignments // Array of { nodeId, permission }
    };
  });

  res.json(enrichedUsers);
});

app.post("/api/users", authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "Username, password, and role are required" });
  }

  const users = await readJSON(USERS_FILE);
  const existingUser = users.find(u => u.username === username);

  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword, role };

  users.push(newUser);
  await writeJSON(USERS_FILE, users);

  logServerEvent("info", "User added", { username, role });
  res.status(201).json({ success: true, user: { username, role } });
});

app.put("/api/users/:username/role", authenticateToken, requireAdmin, async (req, res) => {
  const { username } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }

  const users = await readJSON(USERS_FILE);
  const userIndex = users.findIndex(u => u.username === username);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  users[userIndex].role = role;
  await writeJSON(USERS_FILE, users);

  logServerEvent("info", "User role updated", { username, newRole: role });
  logSecurityEvent("info", "User role updated", { admin: req.user.username, targetUser: username, newRole: role });
  res.json({ success: true, user: { username, role } });
});

app.put("/api/users/:username/password", authenticateToken, requireAdmin, async (req, res) => {
  const { username } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const users = await readJSON(USERS_FILE);
  const userIndex = users.findIndex(u => u.username === username);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users[userIndex].password = hashedPassword;
  await writeJSON(USERS_FILE, users);

  logServerEvent("info", "User password updated", { username });
  logSecurityEvent("info", "User password updated", { admin: req.user.username, targetUser: username });
  res.json({ success: true, message: "Password updated successfully" });
});

app.put("/api/users/:username/assign-nodes", authenticateToken, requireAdmin, async (req, res) => {
  const { username } = req.params;
  const { assignedNodes } = req.body; // Array of { nodeId, permission }

  if (!Array.isArray(assignedNodes)) {
    return res.status(400).json({ error: "assignedNodes must be an array" });
  }

  const assignments = await readJSON(ASSIGNMENTS_FILE);
  assignments[username] = assignedNodes; // Overwrite existing assignments
  await writeJSON(ASSIGNMENTS_FILE, assignments);

  logServerEvent("info", "User node assignments updated", { username, assignedNodes: assignedNodes.map(a => a.nodeId) });
  res.json({ success: true, message: "Node assignments updated" });
});

app.delete("/api/users/:username", authenticateToken, requireAdmin, async (req, res) => {
  const { username } = req.params;

  let users = await readJSON(USERS_FILE);
  const initialLength = users.length;
  users = users.filter(u => u.username !== username);

  if (users.length === initialLength) {
    return res.status(404).json({ error: "User not found" });
  }

  await writeJSON(USERS_FILE, users);

  // Also remove user's assignments
  const assignments = await readJSON(ASSIGNMENTS_FILE);
  delete assignments[username];
  await writeJSON(ASSIGNMENTS_FILE, assignments);

  logServerEvent("info", "User deleted", { username });
  logSecurityEvent("info", "User deleted", { admin: req.user.username, targetUser: username });
  res.json({ success: true, message: "User deleted" });
});

app.get("/api/logs", authenticateToken, requireAdmin, async (req, res) => {
  const logs = await readJSON(COMMAND_HISTORY_FILE);
  res.json(logs);
});

app.get("/api/logs/:nodeId", authenticateToken, authorizeNodeAccess, async (req, res) => {
  const { nodeId } = req.params;
  const node = req.node;

  if (!node) {
    return res.status(500).json({ error: "Node information not available" });
  }

  const fullUrl = `${node.apiUrl}/logs`;
  console.log(`Proxying request to: ${fullUrl}`);

  try {
    const proxyRes = await fetch(fullUrl, {
      headers: {
        "x-admin-token": SHARED_ADMIN_SECRET,
      },
    });

    const responseBody = await proxyRes.json();
    res.status(proxyRes.status).json(responseBody);
  } catch (error) {
    console.error(`Error proxying request to ${fullUrl}:`, error);
    res.status(500).json({ error: "Failed to proxy request to node" });
  }
});

// --- Push Config to Node ---
app.post("/api/push-config/:nodeId", authenticateToken, requireAdmin, async (req, res) => {
  const { nodeId } = req.params;
  const newConfig = req.body;

  const nodes = await readJSON(NODES_FILE);
  const node = nodes.find(n => n.id === nodeId);

  if (!node) {
    return res.status(404).json({ error: "Node not found" });
  }

  try {
    const response = await fetch(`${node.apiUrl}/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": SHARED_ADMIN_SECRET
      },
      body: JSON.stringify(newConfig)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      res.json({ success: true, message: "Config pushed successfully" });
    } else {
      res.status(500).json({ success: false, message: result.message || "Push failed" });
    }
  } catch (err) {
    console.error("Error pushing config:", err);
    logServerEvent("error", "Error pushing config to node", { nodeId, error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: "Node unreachable" });
  }
});

// --- Send Command to Node ---
app.post("/api/command/:nodeId", authenticateToken, requireAdmin, async (req, res) => {
  const { nodeId } = req.params;
  const { cmd } = req.body;

  const nodes = await readJSON(NODES_FILE);
  const node = nodes.find(n => n.id === nodeId);

  if (!node) {
    return res.status(404).json({ error: "Node not found" });
  }

  const cmdId = `cmd_${Date.now()}`;

  try {
    const response = await fetch(`${node.apiUrl}/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": SHARED_ADMIN_SECRET
      },
      body: JSON.stringify({ cmd, cmdId })
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("Error sending command:", err);
    logServerEvent("error", "Error sending command to node", { nodeId, error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: "Node offline" });
  }
});

// --- Get Command History ---
app.get("/api/command-history", authenticateToken, requireAdmin, async (req, res) => {
  const history = await readJSON(COMMAND_HISTORY_FILE);
  res.json(history);
});

// --- Get Central Server Status (Admin Only) ---
app.get("/api/server-status", authenticateToken, requireAdmin, (req, res) => {
  const uptimeSeconds = process.uptime();
  const uptime = {
    days: Math.floor(uptimeSeconds / (3600 * 24)),
    hours: Math.floor((uptimeSeconds % (3600 * 24)) / 3600),
    minutes: Math.floor((uptimeSeconds % 3600) / 60),
    seconds: Math.floor(uptimeSeconds % 60),
  };

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const cpuUsage = os.loadavg(); // [1m, 5m, 15m average load]

  res.json({
    status: "online",
    uptime,
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
    },
    cpuLoad: cpuUsage,
    timestamp: new Date().toISOString(),
  });
});

// --- Get Central Server Logs (Admin Only) ---
app.get("/api/server-logs", authenticateToken, requireAdmin, async (req, res) => {
  const logs = await readJSON(SERVER_STATUS_FILE);
  res.json(logs);
});

// --- Get Security Audit Logs (Admin Only) ---
app.get("/api/security-audit-logs", authenticateToken, requireAdmin, async (req, res) => {
  const logs = await readJSON(SECURITY_AUDIT_FILE);
  res.json(logs);
});

// --- Get Central Server API Endpoints (Admin Only) ---
app.get("/api/central-endpoints", authenticateToken, requireAdmin, (req, res) => {
  const endpoints = [
    {
      path: "/api/login",
      method: "POST",
      description: "Authenticates a user and returns a JWT token.",
      payload: {
        username: "string",
        password: "string",
      },
      response: {
        success: "boolean",
        token: "string",
        role: "string",
      },
      exampleResponse: {
        success: true,
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        role: "admin",
      },
    },
    {
      path: "/api/nodes",
      method: "GET",
      description: "Retrieves a list of all registered nodes (admin) or assigned nodes (user).",
      response: [
        {
          id: "string",
          name: "string",
          apiUrl: "string",
          wsUrl: "string",
          enabled: "boolean",
          assignedTo: "array<string> (admin only)",
        },
      ],
      exampleResponse: [
        {
          id: "node_123",
          name: "My Node",
          apiUrl: "http://localhost:3002",
          wsUrl: "ws://localhost:3005",
          enabled: true,
          assignedTo: ["admin"],
        },
      ],
    },
    {
      path: "/api/users",
      method: "GET",
      description: "Retrieves a list of all registered users and their assigned nodes (Admin only).",
      response: [
        {
          username: "string",
          role: "string",
          assignedNodes: "array<{ nodeId: string, permission: string }>",
        },
      ],
      exampleResponse: [
        {
          username: "admin",
          role: "admin",
          assignedNodes: [{ nodeId: "node_123", permission: "full" }],
        },
      ],
    },
    {
      path: "/api/server-status",
      method: "GET",
      description: "Retrieves the current status of the central server (Admin only).",
      response: {
        status: "string",
        uptime: {
          days: "number",
          hours: "number",
          minutes: "number",
          seconds: "number",
        },
        memory: {
          total: "number",
          free: "number",
          used: "number",
        },
        cpuLoad: "array<number>",
        timestamp: "string (ISO 8601)",
      },
      exampleResponse: {
        status: "online",
        uptime: { days: 0, hours: 1, minutes: 30, seconds: 45 },
        memory: { total: 16000000000, free: 8000000000, used: 8000000000 },
        cpuLoad: [0.5, 0.6, 0.7],
        timestamp: "2025-09-16T12:00:00.000Z",
      },
    },
    {
      path: "/api/security-audit-logs",
      method: "GET",
      description: "Retrieves security audit logs (Admin only).",
      response: [
        {
          timestamp: "string (ISO 8601)",
          level: "string (info, warn, error)",
          message: "string",
          details: "object (optional)",
        },
      ],
      exampleResponse: [
        {
          timestamp: "2025-09-16T16:34:02.130Z",
          level: "info",
          message: "Admin accessed node",
          details: { username: "admin", nodeId: "node_123" },
        },
      ],
    },
  ];
  res.json(endpoints);
});

// --- Get Node API Endpoints (Admin Only) ---
app.get("/api/node-endpoints", authenticateToken, requireAdmin, (req, res) => {
  const endpoints = [
    {
      path: "/system",
      method: "GET",
      description: "Retrieves system information (CPU, RAM, GPU, Uptime) from the node.",
      response: {
        cpu_usage: "number",
        gpu_load: "number",
        gpu_temp: "number",
        ram_used_mb: "number",
        ram_total_mb: "number",
        uptime: "number (seconds)",
      },
      exampleResponse: {
        cpu_usage: 25.5,
        gpu_load: 70.2,
        gpu_temp: 65.0,
        ram_used_mb: 4096,
        ram_total_mb: 8192,
        uptime: 36000,
      },
    },
    {
      path: "/config",
      method: "GET",
      description: "Retrieves the current configuration of the node.",
      response: {
        config_key: "config_value",
      },
      exampleResponse: {
        mining_pool: "stratum+tcp://pool.example.com:3333",
        worker_name: "myWorker",
      },
    },
    {
      path: "/config",
      method: "POST",
      description: "Updates the configuration of the node.",
      payload: {
        config_key: "new_config_value",
      },
      response: {
        success: "boolean",
        message: "string",
      },
      exampleResponse: {
        success: true,
        message: "Configuration updated successfully.",
      },
    },
    {
      path: "/command",
      method: "POST",
      description: "Sends a command to the node for execution.",
      payload: {
        cmd: "string (e.g., 'restart', 'stop')",
        cmdId: "string (unique command ID)",
      },
      response: {
        success: "boolean",
        output: "string (command output)",
      },
      exampleResponse: {
        success: true,
        output: "Command executed successfully.",
      },
    },
    {
      path: "/logs",
      method: "GET",
      description: "Retrieves node-specific log entries.",
      response: [
        {
          timestamp: "string (ISO 8601)",
          level: "string (info, warn, error)",
          message: "string",
        },
      ],
      exampleResponse: [
        {
          timestamp: "2025-09-16T12:00:00.000Z",
          level: "info",
          message: "Node started successfully.",
        },
      ],
    },
  ];
  res.json(endpoints);
});

// --- Config History (Placeholder) ---
app.get("/api/config-history/:nodeId", authenticateToken, requireAdmin, async (req, res) => {
  res.json([]); // Placeholder, implement as needed
});

// === Fallback for undefined routes ===
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// === Start Server ===
const httpServer = createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

wss.on("connection", (ws) => {
  console.log("Client connected to central WebSocket");
  ws.send(JSON.stringify({ type: "status", message: "Connected to dashboard backend" }));
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Central Admin Backend running at http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ${DATA_DIR}`);
  logServerEvent("info", "Central server started", { port: PORT });
});
