// src/components/NodeCard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NodeCard.css"; // We'll add CSS next

export default function NodeCard({ node, userRole }) {
  const [data, setData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isOnline && userRole !== "admin") {
      alert("Node Offline. Contact ADMIN to start.");
      return;
    }
    navigate(`/dashboard/${node.id}`);
  };

  useEffect(() => {
    // Assuming node.apiUrl is something like http://localhost:3002
    // and SSE endpoint is http://localhost:3005/live/system
    const sseUrl = node.apiUrl + "/live/system";
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setIsOnline(true);
      console.log("SSE connection opened");
    };

    eventSource.onerror = (event) => {
      console.error("SSE error:", event);
      setIsOnline(false);
      eventSource.close();
    };

    eventSource.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        // Transform rawData to match NodeCard's expected structure
        const transformedData = {
          system: {
            cpu_usage: rawData.cpu?.usage_percent || 0,
            gpu_load: rawData.gpu?.usage_percent || 0,
            gpu_temp: rawData.gpu?.temp_c || 0,
            ram_used: (rawData.memory?.ram_used_mb || 0) * 1024 * 1024,
            ram_total: (rawData.memory?.ram_total_mb || 0) * 1024 * 1024,
            uptime: rawData.system?.uptime || 0, // Assuming uptime might be under a 'system' key in rawData
          },
          progress: { current: 0, total: 0 }, // Default values as progress is not from this SSE
          found: [], // Default values as found is not from this SSE
        };
        setData(transformedData);
        setIsOnline(true);
        setLastUpdateTime(new Date());
      } catch (e) {
        console.error("SSE data parse error:", e);
      }
    };

    return () => {
      eventSource.close();
      console.log("SSE connection closed");
    };
  }, [node.apiUrl]);

  const formatBytes = (bytes) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`node-card ${isOnline ? "online" : "offline"}`} onClick={handleClick}>
      {/* Header: Name + Status */}
      <div className="node-header">
        <h3>{node.name}</h3>
        <span className={`status-badge ${isOnline ? "online" : "offline"}`}>
          {isOnline ? "🟢 Online" : "🔴 Offline"}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="node-metrics">
        {/* CPU */}
        <div className="metric">
          <div className="metric-label">🖥️ CPU</div>
          <div className="metric-value">{data?.system?.cpu_usage?.toFixed(1) || 0}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill cpu"
              style={{ width: `${data?.system?.cpu_usage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* GPU */}
        <div className="metric">
          <div className="metric-label">🎮 GPU Load</div>
          <div className="metric-value">{data?.system?.gpu_load?.toFixed(1) || 0}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill gpu"
              style={{ width: `${data?.system?.gpu_load || 0}%` }}
            ></div>
          </div>
        </div>

        {/* GPU Temp */}
        <div className="metric">
          <div className="metric-label">🌡️ GPU Temp</div>
          <div className="metric-value">
            {data?.system?.gpu_temp != null ? `${data.system.gpu_temp}°C` : "N/A"}
          </div>
        </div>

        {/* RAM */}
        <div className="metric">
          <div className="metric-label">🧠 RAM</div>
          <div className="metric-value">
            {formatBytes(data?.system?.ram_used)} / {formatBytes(data?.system?.ram_total)}
          </div>
        </div>

        

        {/* Found Items */}
        <div className="metric">
          <div className="metric-label">✅ Found</div>
          <div className="metric-value found">{data?.found?.length || 0}</div>
        </div>

        {/* Uptime */}
        <div className="metric">
          <div className="metric-label">⏱️ Uptime</div>
          <div className="metric-value">
            {Math.floor((data?.system?.uptime || 0) / 3600)}h
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="node-footer">
        Last update:{" "}
        {isOnline ? (
          <strong>Now</strong>
        ) : (
          lastUpdateTime ? (
            <span style={{ color: "#e74c3c" }}>{new Date(lastUpdateTime).toLocaleString()}</span>
          ) : (
            <span style={{ color: "#e74c3c" }}>Never</span>
          )
        )}
      </div>
    </div>
  );
}