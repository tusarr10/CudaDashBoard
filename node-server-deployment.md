# 🚀 Deploying and Managing Node.js Server with PM2 on Windows

This guide explains how to run, monitor, and auto-start a Node.js server on Windows using **PM2**.

---

## 1. Install PM2
Open **PowerShell (Run as Administrator)** and install PM2 globally:
```powershell
npm install -g pm2
```

---

## 2. Start Your Node.js Server
Run your app with PM2:
```powershell
pm2 start node-server.js --name node-server
```

Save the process list so it can be restored later:
```powershell
pm2 save
```

---

## 3. Check Status
View all processes managed by PM2:
```powershell
pm2 status
```

Example output:
```
┌─────┬─────────────┬─────┬──────┬────────┬─────────┐
│ id  │ name        │ mode│ pid  │ status │ cpu/mem │
├─────┼─────────────┼─────┼──────┼────────┼─────────┤
│ 0   │ node-server │ fork│ 1234 │ online │ 0.2%/25MB │
└─────┴─────────────┴─────┴──────┴────────┴─────────┘
```

---

## 4. View Logs
To see **live logs**:
```powershell
pm2 logs node-server
```

To inspect **detailed info**:
```powershell
pm2 show node-server
```

---

## 5. Auto-Start on Windows

### Option A: Using `pm2-windows-startup` (Recommended)
1. Install the helper package:
   ```powershell
   npm install pm2-windows-startup -g
   ```
2. Install auto-start:
   ```powershell
   pm2-startup install
   ```
3. Save processes:
   ```powershell
   pm2 save
   ```
4. (Optional) Check status:
   ```powershell
   pm2-startup status
   ```

### Option B: Using Windows Task Scheduler
1. Open **Task Scheduler** → **Create Task**.  
2. Set trigger: **At startup**.  
3. Set action:  
   - Program/script: `pm2`  
   - Arguments: `resurrect`  
4. Save and reboot.

---

## 6. Useful Commands
- Restart app:
  ```powershell
  pm2 restart node-server
  ```
- Stop app:
  ```powershell
  pm2 stop node-server
  ```
- Delete app:
  ```powershell
  pm2 delete node-server
  ```
- Monitor in terminal (CPU/Memory live):
  ```powershell
  pm2 monit
  ```

---

✅ With this setup, your Node.js server will always restart automatically on Windows boot and you can monitor it easily.
