# WN3 Project: Centralized Node Management Dashboard

This project provides a centralized dashboard for managing and monitoring various nodes (worker machines). It consists of a React-based frontend, a Node.js Express backend, and individual Node.js worker applications.

## 📁 Folder Structure

```
wn3/
├── backend/            # Central Node.js Express server
│   ├── data/           # Stores application data (nodes.json, users.json, assignments.json, serverstatus.json, securityaudit.json, etc.)
│   ├── .env            # Environment variables (e.g., SHARED_ADMIN_SECRET, JWT_SECRET)
│   ├── central-server.js # Main backend application logic
│   ├── package.json    # Node.js dependencies for the backend
│   └── ...
├── Frontend/           # React.js frontend application
│   ├── public/         # Public assets
│   ├── src/            # React components, styles, and main application logic
│   │   ├── AdminPanel/ # Components specific to the Admin Panel
│   │   │   ├── AllSetting/ # Various settings components (LogsSettings, SecurityAudit, ApiManagement)
│   │   │   └── ...
│   │   ├── components/ # Reusable UI components (e.g., NodeCard, NodeDashboard)
│   │   ├── Dashboard/  # Components specific to the Node Dashboard view
│   │   │   ├── Found.js # Now handles default empty array for 'found' prop
│   │   │   └── ...
│   │   ├── App.js      # Main application component, routing
│   │   ├── login.js    # Login component (now uses centralized API config)
│   │   └── ...
│   ├── package.json    # Node.js dependencies for the frontend
│   └── ...
└── node-workers/       # Individual Node.js worker applications (simulated nodes)
    ├── worker1/
    │   ├── node-server.js # Individual node server logic
    │   └── ...
    └── worker2/
        ├── node-server.js
        └── ...
```

## 🚀 Setup and Running the Project

To get the project up and running, follow these steps:

### 1. Start Node Workers (Simulated Nodes)

Ensure your individual node worker applications are running. These are the "machines" that the central dashboard will monitor. Each worker directory contains a `node-server.js` file that acts as the API and WebSocket server for that specific node.

*   **Example:** For `worker1` (configured to run on `http://localhost:3002` in `nodes.json`):
    ```bash
    cd G:\test2\wn3\node-workers\worker1
    npm install
    node node-server.js
    ```
*   **Example:** For `worker2` (configured to run on `http://localhost:3005` in `nodes.json`):
    ```bash
    cd G:\test2\wn3\node-workers\worker2
    npm install
    node node-server.js
    ```
    *(Adjust paths and commands based on your actual worker setup and `nodes.json` configuration)*

### 2. Start the Central Backend Server

The central backend server handles user authentication, node registration, and proxies requests to individual nodes. It also now logs server events and security audit events.

```bash
cd G:\test2\wn3\backend
npm install
# Ensure .env file exists with SHARED_ADMIN_SECRET and JWT_SECRET
# SHARED_ADMIN_SECRET should match the one in your node-server.js files
# Example .env content:
# SHARED_ADMIN_SECRET=your-super-secure-shared-secret-change-this
# JWT_SECRET=your-jwt-secret-change-this
node central-server.js
```

### 3. Start the Frontend Application

The React frontend provides the user interface for the dashboard. All API calls are now centralized through the `api` (axios) instance, leveraging `REACT_APP_CENTRAL_API_URL` from the `.env` file.

```bash
cd G:\test2\wn3\Frontend
npm install
npm start
```
The frontend application will typically open in your browser at `http://localhost:3000`.

## ✨ Key Features & Functionality

### User Authentication (Login)
*   Users log in to the dashboard using credentials managed by the central backend.
*   Default admin user: `username: admin`, `password: admin` (created on first run if no users exist).

### Node Dashboard
*   Displays a list of registered nodes.
*   Each node is represented by a `NodeCard` showing its online/offline status.
*   Users only see nodes assigned to them (configured in the Admin Panel).
*   Admins see all registered nodes.

### Node Details (Dashboard Page)
*   Clicking on a node card navigates to a detailed dashboard view for that specific node.
*   **System Info & Progress:** These sections display live data (CPU, GPU, RAM usage, keys scanned, etc.) fetched directly from the individual node servers via Server-Sent Events (SSE).
*   Other sections (Found, Config, Telegram Log, BloomCard, InitCard, LoadCard) fetch data via the central backend's proxy, ensuring authorization.

### Admin Panel
*   Accessible only to users with the "admin" role.
*   Provides functionality for managing users (add, edit, delete) and assigning nodes to users.
*   Allows for CRUD operations on registered nodes.
*   **Logs Settings:** View central server events and status logs.
*   **Security & Audit:** Monitor security-related events and unauthorized access attempts.
*   **API Management:** Browse available API endpoints for both the central server and individual nodes, including method, path, description, and example payloads/responses.
*   **Add New Node Modal:** Includes a "Test Connection" feature to verify API and WebSocket connectivity of a node before adding it, and can auto-fill the node name from its `system_identifier`.

### Role-Based Access Control (RBAC)
*   The central backend enforces authorization based on user roles and node assignments.
*   Regular users can only view data for nodes assigned to them.
*   Admin users have full access to all nodes and management features.

### SSE for Live Data
*   `SystemInfo.js` and `Progress.js` components establish direct Server-Sent Event connections to the individual node servers for real-time data updates.

### Error Handling and Redirects
*   If a non-admin user clicks on an offline node, a message "Node Offline. Contact ADMIN to start." is displayed.
*   If an admin user clicks on an offline node, they are still redirected to the node's dashboard.
*   If a user (including admin) attempts to access a node's dashboard they are not authorized for (e.g., by changing the URL), an "Access Restricted" message is displayed.
*   If an admin user encounters a "Failed to load dashboard data." error, they are shown the error message for 3 seconds and then redirected to the Admin Panel.

## ⚠️ Important Notes for Developers

### `SHARED_ADMIN_SECRET` Configuration
*   The `SHARED_ADMIN_SECRET` in `wn3/backend/.env` **must** match the `SHARED_ADMIN_SECRET` hardcoded in your individual `node-server.js` files (e.g., `final_project/node-workers/worker1/node-server.js`). This secret is used by the central backend to authenticate with the node servers for proxying requests.

### Security Considerations (Direct SSE Connection)
*   The `SystemInfo.js` and `Progress.js` components connect directly to the node servers for SSE data. This bypasses the central backend's authorization for these specific live data streams.
*   **Security Implication:** If your node servers do not have their own authentication/authorization for their SSE endpoints, an unauthorized user could potentially access live system and progress data by directly hitting the node's `/live/system` or `/live/progress` endpoints if they know the `apiUrl`.
*   **Recommendation:** For production environments, consider implementing authentication/authorization directly on the node servers for all endpoints, or a more robust SSE proxy solution within the central backend that can authenticate and authorize every SSE event.

### Troubleshooting
*   **"Loading..." messages persist:**
    *   Ensure your node worker servers are running and accessible on their configured `apiUrl`s.
    *   Check the browser's developer console for any network errors (e.g., `ERR_CONNECTION_REFUSED`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` for API endpoints).
    *   Check the console output of both the central backend and the individual node servers for errors.
*   **`403 Forbidden` errors:**
    *   Verify that the `SHARED_ADMIN_SECRET` in `wn3/backend/.env` matches the one in your `node-server.js` files.
    *   Ensure the JWT token is being correctly sent in the `Authorization` header for REST API calls and as a `token` query parameter for SSE calls.
    *   Check user assignments in `wn3/backend/data/assignments.json`.
    *   **CORS Issues:** If you see CORS errors in the browser console (e.g., "Access-Control-Allow-Origin missing"), ensure the `origin` in your `node-server.js`'s CORS configuration matches your frontend's URL (e.g., `http://localhost:3000`).
*   **`404 Not Found` for new API endpoints (e.g., `/api/server-logs`, `/api/security-audit-logs`, `/api/central-endpoints`, `/api/node-endpoints`):**
    *   Ensure your central backend server is running and has been restarted after the latest code changes.
    *   Verify that the endpoint paths in your frontend (e.g., `ApiManagement.js`, `LogsSettings.js`, `SecurityAudit.js`) correctly match the backend routes.
    *   Check the backend console for any errors related to these routes.
*   **`TypeError: nodes.map is not a function`:** This usually means the API call to `/api/nodes` failed and returned something other than an array. Check for `403 Forbidden` or other network errors preceding this.
*   **`EADDRINUSE` error:** This means a server is already running on the specified port. Ensure you only have one instance of each server (backend, node workers) running.
*   **"API Test Error: TypeError: Cannot read properties of undefined (reading 'source')" in Add Node Modal:**
    *   This indicates an issue with Axios's `CancelToken` usage. Ensure `axios` is directly imported in `AddNodeModal.js` and `axios.CancelToken.source()` is used.
