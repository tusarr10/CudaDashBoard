# 🚀 Running Multiple Node.js Apps with systemd on Ubuntu

This guide shows how to run **two Node.js apps** (`node-server.js` and `central-server.js`) located in:

```
/home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/backend/
│── node-server.js
└── central-server.js
```

Both apps will **auto-start on boot**, **restart if they crash**, and can be controlled separately.

---

## 📂 1. Create systemd Service for `node-server`

Create a new service file:

```bash
sudo nano /etc/systemd/system/node-server.service
```

Add this content:

```ini
[Unit]
Description=Node.js App - node-server
After=network.target

[Service]
ExecStart=/usr/bin/node /home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/backend/node-server.js
WorkingDirectory=/home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/backend
Restart=always
RestartSec=10
User=tusar
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## 📂 2. Create systemd Service for `central-server`

Create another service file:

```bash
sudo nano /etc/systemd/system/central-server.service
```

Add this content:

```ini
[Unit]
Description=Node.js App - central-server
After=network.target

[Service]
ExecStart=/usr/bin/node /home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/backend/central-server.js
WorkingDirectory=/home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/backend
Restart=always
RestartSec=10
User=tusar
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## ⚙️ 3. Reload & Enable Services

Run the following commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable node-server central-server
sudo systemctl start node-server central-server
```

---

## 📊 4. Manage Services

- **Check status:**
  ```bash
  systemctl status node-server
  systemctl status central-server
  ```

- **Start/Stop/Restart:**
  ```bash
  sudo systemctl start node-server
  sudo systemctl stop central-server
  sudo systemctl restart node-server central-server
  ```

- **View logs (live):**
  ```bash
  journalctl -u node-server -f
  journalctl -u central-server -f
  ```

---

## 🔐 5. File Permissions

- Services run as the **`tusar` user** (`User=tusar` in the service file).  
- Ensure `tusar` has **read & write permissions** for project files and logs:  

```bash
sudo chown -R tusar:tusar /home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/backend
```

---

## ✅ Summary

- `node-server.service` → runs `node-server.js`  
- `central-server.service` → runs `central-server.js`  
- Both apps start automatically at boot.  
- Logs are accessible via `journalctl`.  
- Restart automatically on failure.  

Now both Node.js apps are **fully managed by systemd** 🎉
