# WN3 Project: Server Configuration & API Documentation (for Users & Admins)

This document provides essential information for administrators and advanced users on how to configure the WN3 centralized node management dashboard and understand its API.

## ⚙️ Server Configuration (For Administrators)

This section details how to configure the central backend and individual node workers.

### Central Backend Configuration (`wn3/backend/`)

#### Environment Variables (`.env` file)

Create or edit the `.env` file in the `wn3/backend/` directory. This file stores sensitive information and configuration parameters.

*   **`SHARED_ADMIN_SECRET`**: **CRITICAL!** This secret key is used by the central backend to authenticate with individual node workers when proxying requests (e.g., pushing configurations, sending commands, or fetching live data via the proxy). It **must** match the `SHARED_ADMIN_SECRET` defined in each `node-server.js` file of your worker nodes.
    *   **Example:** `SHARED_ADMIN_SECRET=your-super-secure-shared-secret-change-this`
*   **`JWT_SECRET`**: This secret key is used for signing and verifying JSON Web Tokens (JWTs) for user authentication. **Change this to a strong, unique secret in production.**
    *   **Example:** `JWT_SECRET=your-jwt-secret-change-this`

#### Data Files (`wn3/backend/data/`)

These JSON files store the application's core data. They are automatically created with default empty values if they don't exist on server startup.

*   **`nodes.json`**: Defines the registered nodes that the central dashboard monitors.
    *   **Structure:** An array of node objects.
    *   **Example Entry:**
        ```json
        [
          {
            "id": "node_1719500000000",
            "name": "Worker 01 - RTX 4090",
            "apiUrl": "http://localhost:3002",
            "wsUrl": "http://localhost:4002",
            "enabled": true
          }
        ]
        ```
    *   **`id`**: Unique identifier for the node (auto-generated on creation).
    *   **`name`**: Display name for the node.
    *   **`apiUrl`**: The base URL of the individual node worker's REST API.
    *   **`wsUrl`**: The base URL of the individual node worker's WebSocket API (if applicable).
    *   **`enabled`**: Boolean indicating if the node is active.

*   **`users.json`**: Stores user accounts for the dashboard.
    *   **Structure:** An array of user objects.
    *   **Example Entry:**
        ```json
        [
          {
            "username": "admin",
            "password": "$2a$10$HASHED_PASSWORD_HERE", // Hashed password
            "role": "admin"
          }
        ]
        ```
    *   **Default Admin:** If `users.json` is empty on startup, a default admin user (`username: admin`, `password: admin`) is created.

*   **`assignments.json`**: Defines which users are assigned to which nodes, enabling role-based access control.
    *   **Structure:** An object where keys are usernames and values are arrays of assigned node objects.
    *   **Example Entry:**
        ```json
        {
          "user1": [
            { "nodeId": "node_1719500000000", "permission": "view" }
          ],
          "admin": [] // Admins implicitly have access to all nodes
        }
        ```
    *   **`nodeId`**: The ID of the assigned node.
    *   **`permission`**: The level of permission (e.g., "view").

### Node Worker Configuration (`wn3/node-workers/workerX/`)

Each node worker directory contains its own configuration files.

*   **`node-server.js`**: The main application file for the individual node worker. Contains the `SHARED_ADMIN_SECRET` that **must** match the one in the central backend's `.env`.
*   **`config.json`**: Stores the operational configuration for the specific node worker. This file can be updated remotely via the central dashboard's API.
*   **`status.json`**: Stores the current status and system information of the node. This is updated by the node worker itself.
*   **`telegramstatus.json`**: Stores logs related to Telegram notifications (if implemented).

## 💻 API Documentation (For Advanced Users & Developers)

This section outlines the REST API endpoints exposed by the central backend (`http://localhost:2225/api`). All authenticated endpoints require a JWT in the `Authorization: Bearer <token>` header.

### 1. Authentication

*   **`POST /api/login`**
    *   **Description:** Authenticates a user and returns a JWT.
    *   **Request Body:**
        ```json
        {
          "username": "admin",
          "password": "admin"
        }
        ```
    *   **Response:**
        ```json
        {
          "success": true,
          "token": "eyJhbGciOiJIUzI1Ni...",
          "role": "admin"
        }
        ```

### 2. Node Management (Admin Only)

*   **`GET /api/nodes`**
    *   **Description:** Retrieves a list of all registered nodes (for admins) or nodes assigned to the current user (for regular users).
    *   **Response:** Array of node objects.

*   **`POST /api/nodes`**
    *   **Description:** Registers a new node.
    *   **Request Body:**
        ```json
        {
          "name": "New Worker",
          "apiUrl": "http://localhost:3003",
          "wsUrl": "http://localhost:4003"
        }
        ```
    *   **Response:** The newly created node object.

*   **`PUT /api/nodes/:nodeId`**
    *   **Description:** Updates an existing node's information.
    *   **Request Body:** (Partial update allowed)
        ```json
        {
          "name": "Updated Worker Name",
          "enabled": false
        }
        ```
    *   **Response:** The updated node object.

*   **`DELETE /api/nodes/:nodeId`**
    *   **Description:** Deletes a registered node and its assignments.
    *   **Response:** `{ success: true, message: "Node deleted" }`

### 3. User Management (Admin Only)

*   **`GET /api/users`**
    *   **Description:** Retrieves a list of all registered users and their assigned nodes.
    *   **Response:** Array of user objects with `username`, `role`, and `assignedNodes`.

*   **`POST /api/users`**
    *   **Description:** Creates a new user account.
    *   **Request Body:**
        ```json
        {
          "username": "newUser",
          "password": "newPass",
          "role": "user"
        }
        ```
    *   **Response:** `{ success: true, user: { username, role } }`

*   **`PUT /api/users/:username/role`**
    *   **Description:** Updates a user's role.
    *   **Request Body:** `{ "role": "admin" }`
    *   **Response:** `{ success: true, user: { username, role } }`

*   **`PUT /api/users/:username/assign-nodes`**
    *   **Description:** Assigns nodes to a user. Overwrites existing assignments.
    *   **Request Body:**
        ```json
        {
          "assignedNodes": [
            { "nodeId": "node_1719500000000", "permission": "view" }
          ]
        }
        ```
    *   **Response:** `{ success: true, message: "Node assignments updated" }`

*   **`DELETE /api/users/:username`**
    *   **Description:** Deletes a user account and their assignments.
    *   **Response:** `{ success: true, message: "User deleted" }`

### 4. Node-Specific Actions (Admin Only, via Proxy)

These endpoints proxy requests to the individual node workers. The central backend handles authorization before forwarding.

*   **`POST /api/push-config/:nodeId`**
    *   **Description:** Pushes a new configuration to a specific node.
    *   **Request Body:** The configuration object (structure depends on `node-server.js` `config.json`).
    *   **Response:** `{ success: true, message: "Config pushed successfully" }` or error.

*   **`POST /api/command/:nodeId`**
    *   **Description:** Sends a command (e.g., "start", "stop", "restart") to a specific node.
    *   **Request Body:** `{ "cmd": "start" }`
    *   **Response:** Command execution result from the node.

### 5. Live Data Endpoints (SSE Proxy)

These endpoints provide Server-Sent Events (SSE) for live data streams from individual nodes, proxied through the central backend for authorization.

*   **`GET /api/nodes/:nodeId/proxy/live/:targetPath`**
    *   **Description:** Proxies an SSE stream from a specific node's live endpoint (e.g., `/live/system`, `/live/progress`).
    *   **`targetPath`**: The specific live endpoint on the node (e.g., `system`, `progress`).
    *   **Response:** A continuous SSE stream (`text/event-stream`).

## ❓ Troubleshooting (For Users & Admins)

*   **Cannot log in:**
    *   Verify your username and password.
    *   Ensure the central backend server is running.
    *   Check the backend server's console for authentication errors.
*   **Nodes show "Offline" or "Loading..." indefinitely:**
    *   Ensure the individual node worker servers are running and accessible on their configured `apiUrl`s.
    *   Check the central backend server's console for errors when trying to connect to nodes.
    *   Check the node worker server's console for errors.
*   **"Access Restricted" message:**
    *   You are trying to access a node or feature for which your user account does not have sufficient permissions.
    *   Contact an administrator to verify your role and node assignments.
*   **"Failed to load dashboard data." (for admins):**
    *   This indicates an issue with the central backend connecting to the specific node's API for initial data.
    *   Check if the node worker server is running and its `apiUrl` is correct in `nodes.json`.
    *   Check the central backend server's console for errors related to proxying requests to that node.
*   **Unexpected behavior or errors:**
    *   Always check the browser's developer console (F12) for frontend errors.
    *   Check the console output of both the central backend server and the relevant node worker server for backend errors.
    *   Ensure all `npm install` steps were completed successfully for both frontend and backend.
