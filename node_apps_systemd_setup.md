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
📝 Steps to Auto-start Frontend
1. Create a systemd service file

Run:sudo nano /etc/systemd/system/frontend.service
Paste this inside:.
[Unit]
Description=Frontend React App (serve build)
After=network.target

[Service]
ExecStart=/usr/bin/serve -s /home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/frontend/build -l 3000
Restart=always
RestartSec=10
User=tusar
WorkingDirectory=/home/tusar/Desktop/CudaDashBoard-main/CudaDashBoard-main/frontend
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

Make sure /usr/bin/serve is correct. You can check with:
which serve
If it shows something else (e.g. /usr/local/bin/serve), update the ExecStart path.
2. Reload systemd
sudo systemctl daemon-reload
3. Enable service at boot
sudo systemctl enable frontend

4. Start the service
sudo systemctl start frontend
5. Check status
systemctl status frontend

6. View logs (live)
journalctl -u frontend -f

✅ Now your frontend will always auto-start at boot and serve at:
👉 http://localhost:3000
