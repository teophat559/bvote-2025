/**
 * Chrome Process Monitor
 * Advanced monitoring for Chrome automation processes
 */

import { EventEmitter } from "events";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import os from "os";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

class ChromeProcessMonitor extends EventEmitter {
  constructor(eventBus, logger) {
    super();
    this.eventBus = eventBus;
    this.logger = logger;

    // Process tracking
    this.monitoredProcesses = new Map();
    this.processMetrics = new Map();
    this.resourceAlerts = new Map();

    // Monitoring configuration
    this.config = {
      monitoringInterval: 5000, // 5 seconds
      memoryThreshold: 512 * 1024 * 1024, // 512MB
      cpuThreshold: 80, // 80%
      maxProcessAge: 30 * 60 * 1000, // 30 minutes
      healthCheckInterval: 10000, // 10 seconds
      crashDetectionEnabled: true,
      performanceLogging: true,
      resourceLimits: {
        maxMemoryMB: 1024,
        maxCpuPercent: 90,
        maxOpenTabs: 10,
        maxProcessTime: 60 * 60 * 1000, // 1 hour
      },
    };

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Register Chrome process for monitoring
   */
  registerProcess(profileId, processInfo) {
    const monitorData = {
      profileId,
      pid: processInfo.pid,
      debugPort: processInfo.debugPort,
      startTime: new Date(),
      lastHealthCheck: new Date(),
      status: "running",
      metrics: {
        memory: { current: 0, max: 0, average: 0 },
        cpu: { current: 0, max: 0, average: 0 },
        uptime: 0,
        tabCount: 0,
        networkRequests: 0,
        errors: 0,
      },
      alerts: [],
      performance: {
        responseTime: [],
        networkLatency: [],
        pageLoadTime: [],
      },
      metadata: {
        userDataDir: processInfo.userDataDir,
        platform: processInfo.platform,
        sessionId: processInfo.sessionId,
        accountId: processInfo.accountId,
      },
    };

    this.monitoredProcesses.set(profileId, monitorData);
    this.logger?.info(
      `Chrome process registered for monitoring: ${profileId} (PID: ${processInfo.pid})`
    );

    // Start individual process monitoring
    this.startProcessMonitoring(profileId);

    this.emit("process_registered", { profileId, processInfo: monitorData });
    return monitorData;
  }

  /**
   * Unregister Chrome process from monitoring
   */
  unregisterProcess(profileId) {
    const processData = this.monitoredProcesses.get(profileId);
    if (!processData) {
      return false;
    }

    processData.status = "stopped";
    processData.endTime = new Date();
    processData.totalUptime = processData.endTime - processData.startTime;

    this.logger?.info(
      `Chrome process unregistered: ${profileId} (Uptime: ${Math.round(
        processData.totalUptime / 1000
      )}s)`
    );

    this.emit("process_unregistered", { profileId, processData });

    // Clean up after delay to allow metrics collection
    setTimeout(() => {
      this.monitoredProcesses.delete(profileId);
      this.processMetrics.delete(profileId);
      this.resourceAlerts.delete(profileId);
    }, 30000);

    return true;
  }

  /**
   * Start general monitoring loop
   */
  startMonitoring() {
    // System-wide monitoring
    setInterval(() => {
      this.performSystemHealthCheck();
    }, this.config.healthCheckInterval);

    // Process-specific monitoring
    setInterval(() => {
      this.updateAllProcessMetrics();
    }, this.config.monitoringInterval);

    // Resource cleanup
    setInterval(() => {
      this.cleanupOldProcesses();
    }, 60000); // Every minute

    this.logger?.info("Chrome process monitoring started");
  }

  /**
   * Start monitoring individual process
   */
  async startProcessMonitoring(profileId) {
    const processData = this.monitoredProcesses.get(profileId);
    if (!processData) return;

    // Initial health check
    await this.performHealthCheck(profileId);

    // Monitor debugger connection
    this.monitorDebuggerConnection(profileId);
  }

  /**
   * Update metrics for all monitored processes
   */
  async updateAllProcessMetrics() {
    const updatePromises = [];

    for (const [profileId, processData] of this.monitoredProcesses) {
      if (processData.status === "running") {
        updatePromises.push(this.updateProcessMetrics(profileId));
      }
    }

    await Promise.allSettled(updatePromises);
  }

  /**
   * Update metrics for specific process
   */
  async updateProcessMetrics(profileId) {
    const processData = this.monitoredProcesses.get(profileId);
    if (!processData || processData.status !== "running") return;

    try {
      // Get process info
      const processInfo = await this.getProcessInfo(processData.pid);
      if (!processInfo.exists) {
        await this.handleProcessCrash(profileId, "Process not found");
        return;
      }

      // Update metrics
      const metrics = processData.metrics;
      metrics.memory.current = processInfo.memory;
      metrics.memory.max = Math.max(metrics.memory.max, processInfo.memory);
      metrics.cpu.current = processInfo.cpu;
      metrics.cpu.max = Math.max(metrics.cpu.max, processInfo.cpu);
      metrics.uptime = Date.now() - processData.startTime.getTime();

      // Calculate averages
      this.updateAverageMetrics(processData);

      // Get Chrome-specific metrics
      const chromeMetrics = await this.getChromeSpecificMetrics(profileId);
      if (chromeMetrics) {
        metrics.tabCount = chromeMetrics.tabCount;
        metrics.networkRequests = chromeMetrics.networkRequests;
      }

      // Check thresholds and generate alerts
      await this.checkResourceThresholds(profileId, processData);

      // Log performance data
      if (this.config.performanceLogging) {
        this.logPerformanceMetrics(profileId, processData);
      }

      this.emit("metrics_updated", { profileId, metrics: processData.metrics });
    } catch (error) {
      this.logger?.error(`Error updating metrics for ${profileId}:`, error);
      processData.metrics.errors++;
    }
  }

  /**
   * Get system process information
   */
  async getProcessInfo(pid) {
    try {
      const platform = os.platform();

      if (platform === "win32") {
        // Windows
        const { stdout } = await execAsync(
          `tasklist /FI "PID eq ${pid}" /FO CSV /NH`
        );
        if (!stdout.includes(`"${pid}"`)) {
          return { exists: false };
        }

        // Get memory info
        const { stdout: memInfo } = await execAsync(
          `wmic process where ProcessId=${pid} get WorkingSetSize /value`
        );
        const memMatch = memInfo.match(/WorkingSetSize=(\d+)/);
        const memory = memMatch ? parseInt(memMatch[1]) : 0;

        // Get CPU info (approximate)
        const { stdout: cpuInfo } = await execAsync(
          `wmic process where ProcessId=${pid} get PageFileUsage /value`
        );
        const cpuMatch = cpuInfo.match(/PageFileUsage=(\d+)/);
        const cpu = cpuMatch ? Math.min(parseInt(cpuMatch[1]) / 10000, 100) : 0;

        return { exists: true, memory, cpu };
      } else {
        // Unix/Linux/macOS
        const { stdout } = await execAsync(
          `ps -p ${pid} -o pid,rss,%cpu --no-headers`
        );
        if (!stdout.trim()) {
          return { exists: false };
        }

        const parts = stdout.trim().split(/\s+/);
        return {
          exists: true,
          memory: parseInt(parts[1]) * 1024, // Convert KB to bytes
          cpu: parseFloat(parts[2]),
        };
      }
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Get Chrome-specific metrics via debugger
   */
  async getChromeSpecificMetrics(profileId) {
    const processData = this.monitoredProcesses.get(profileId);
    if (!processData) return null;

    try {
      const response = await fetch(
        `http://localhost:${processData.debugPort}/json`
      );
      if (!response.ok) return null;

      const tabs = await response.json();
      const activeTab = tabs.find(
        (tab) => tab.type === "page" && !tab.url.startsWith("chrome://")
      );

      if (activeTab) {
        // Get runtime metrics
        const runtimeResponse = await fetch(
          `http://localhost:${processData.debugPort}/json/runtime/evaluate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expression: `JSON.stringify({
              networkRequests: performance.getEntriesByType('navigation').length + performance.getEntriesByType('resource').length,
              memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0,
              timing: performance.timing.loadEventEnd - performance.timing.navigationStart
            })`,
            }),
          }
        );

        if (runtimeResponse.ok) {
          const runtimeData = await runtimeResponse.json();
          const metrics = JSON.parse(runtimeData.result?.value || "{}");

          return {
            tabCount: tabs.length,
            networkRequests: metrics.networkRequests || 0,
            memoryUsage: metrics.memoryUsage || 0,
            pageLoadTime: metrics.timing || 0,
          };
        }
      }

      return { tabCount: tabs.length, networkRequests: 0 };
    } catch (error) {
      return null;
    }
  }

  /**
   * Monitor debugger connection health
   */
  async monitorDebuggerConnection(profileId) {
    const processData = this.monitoredProcesses.get(profileId);
    if (!processData) return;

    try {
      const response = await fetch(
        `http://localhost:${processData.debugPort}/json/version`
      );
      const isHealthy = response.ok;

      if (isHealthy) {
        processData.lastHealthCheck = new Date();
        if (processData.status === "unhealthy") {
          processData.status = "running";
          this.emit("process_recovered", { profileId });
        }
      } else {
        if (processData.status === "running") {
          processData.status = "unhealthy";
          this.emit("process_unhealthy", {
            profileId,
            reason: "Debugger not responding",
          });
        }
      }
    } catch (error) {
      if (processData.status === "running") {
        processData.status = "unhealthy";
        this.emit("process_unhealthy", { profileId, reason: error.message });
      }
    }
  }

  /**
   * Perform health check for specific process
   */
  async performHealthCheck(profileId) {
    const processData = this.monitoredProcesses.get(profileId);
    if (!processData) return;

    try {
      // Check if process still exists
      const processInfo = await this.getProcessInfo(processData.pid);
      if (!processInfo.exists) {
        await this.handleProcessCrash(
          profileId,
          "Process terminated unexpectedly"
        );
        return;
      }

      // Check debugger connection
      await this.monitorDebuggerConnection(profileId);

      // Check process age
      const age = Date.now() - processData.startTime.getTime();
      if (age > this.config.maxProcessAge) {
        this.emit("process_aging", {
          profileId,
          age,
          maxAge: this.config.maxProcessAge,
        });
      }
    } catch (error) {
      this.logger?.error(`Health check failed for ${profileId}:`, error);
    }
  }

  /**
   * Perform system-wide health check
   */
  async performSystemHealthCheck() {
    try {
      const systemMetrics = await this.getSystemMetrics();

      // Check system resources
      if (systemMetrics.memoryUsagePercent > 90) {
        this.emit("system_alert", {
          type: "high_memory_usage",
          value: systemMetrics.memoryUsagePercent,
          threshold: 90,
        });
      }

      if (systemMetrics.cpuUsagePercent > 85) {
        this.emit("system_alert", {
          type: "high_cpu_usage",
          value: systemMetrics.cpuUsagePercent,
          threshold: 85,
        });
      }

      // Check Chrome process count
      const activeProcesses = Array.from(
        this.monitoredProcesses.values()
      ).filter((p) => p.status === "running").length;

      if (activeProcesses > 10) {
        this.emit("system_alert", {
          type: "too_many_chrome_processes",
          value: activeProcesses,
          threshold: 10,
        });
      }

      this.emit("system_health_check", {
        systemMetrics,
        activeProcesses,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger?.error("System health check failed:", error);
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    // CPU usage (averaged over load averages)
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpuUsagePercent = Math.min((loadAvg / cpuCount) * 100, 100);

    return {
      totalMemory,
      freeMemory,
      memoryUsagePercent,
      cpuUsagePercent,
      loadAverage: loadAvg,
      cpuCount,
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
    };
  }

  /**
   * Check resource thresholds and generate alerts
   */
  async checkResourceThresholds(profileId, processData) {
    const metrics = processData.metrics;
    const limits = this.config.resourceLimits;
    const alerts = [];

    // Memory threshold
    if (metrics.memory.current > limits.maxMemoryMB * 1024 * 1024) {
      alerts.push({
        type: "memory_exceeded",
        value: Math.round(metrics.memory.current / (1024 * 1024)),
        limit: limits.maxMemoryMB,
        severity: "high",
      });
    }

    // CPU threshold
    if (metrics.cpu.current > limits.maxCpuPercent) {
      alerts.push({
        type: "cpu_exceeded",
        value: Math.round(metrics.cpu.current),
        limit: limits.maxCpuPercent,
        severity: "medium",
      });
    }

    // Process age threshold
    if (metrics.uptime > limits.maxProcessTime) {
      alerts.push({
        type: "process_age_exceeded",
        value: Math.round(metrics.uptime / (60 * 1000)), // minutes
        limit: Math.round(limits.maxProcessTime / (60 * 1000)),
        severity: "low",
      });
    }

    // Tab count threshold
    if (metrics.tabCount > limits.maxOpenTabs) {
      alerts.push({
        type: "tab_count_exceeded",
        value: metrics.tabCount,
        limit: limits.maxOpenTabs,
        severity: "medium",
      });
    }

    // Process new alerts
    for (const alert of alerts) {
      const alertKey = `${profileId}_${alert.type}`;
      const existingAlert = this.resourceAlerts.get(alertKey);

      if (!existingAlert || Date.now() - existingAlert.lastSent > 300000) {
        // 5 minutes
        this.resourceAlerts.set(alertKey, { ...alert, lastSent: Date.now() });
        this.emit("resource_alert", { profileId, alert });

        // Send to event bus
        await this.eventBus?.publish("chrome.resource_alert", {
          profileId,
          alert,
          processData: this.getProcessSummary(processData),
        });
      }
    }
  }

  /**
   * Handle process crash
   */
  async handleProcessCrash(profileId, reason) {
    const processData = this.monitoredProcesses.get(profileId);
    if (!processData) return;

    processData.status = "crashed";
    processData.crashTime = new Date();
    processData.crashReason = reason;

    this.logger?.error(`Chrome process crashed: ${profileId} - ${reason}`);

    this.emit("process_crashed", {
      profileId,
      reason,
      uptime: Date.now() - processData.startTime.getTime(),
      metrics: processData.metrics,
    });

    // Send to event bus
    await this.eventBus?.publish("chrome.process_crashed", {
      profileId,
      reason,
      processData: this.getProcessSummary(processData),
    });
  }

  /**
   * Update average metrics
   */
  updateAverageMetrics(processData) {
    const metrics = processData.metrics;

    // Simple moving average (could be improved with more sophisticated methods)
    if (!metrics.sampleCount) metrics.sampleCount = 0;
    metrics.sampleCount++;

    metrics.memory.average =
      (metrics.memory.average * (metrics.sampleCount - 1) +
        metrics.memory.current) /
      metrics.sampleCount;
    metrics.cpu.average =
      (metrics.cpu.average * (metrics.sampleCount - 1) + metrics.cpu.current) /
      metrics.sampleCount;
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(profileId, processData) {
    if (!this.logger) return;

    const metrics = processData.metrics;
    this.logger.debug(`Chrome Performance [${profileId}]:`, {
      memory: `${Math.round(metrics.memory.current / (1024 * 1024))}MB`,
      cpu: `${Math.round(metrics.cpu.current)}%`,
      uptime: `${Math.round(metrics.uptime / 1000)}s`,
      tabs: metrics.tabCount,
      errors: metrics.errors,
    });
  }

  /**
   * Clean up old/inactive processes
   */
  cleanupOldProcesses() {
    const now = Date.now();

    for (const [profileId, processData] of this.monitoredProcesses) {
      // Remove processes that have been stopped for more than 1 hour
      if (
        processData.status !== "running" &&
        processData.endTime &&
        now - processData.endTime.getTime() > 3600000
      ) {
        this.monitoredProcesses.delete(profileId);
        this.processMetrics.delete(profileId);
        this.resourceAlerts.delete(profileId);

        this.logger?.info(`Cleaned up old process data: ${profileId}`);
      }
    }
  }

  /**
   * Get process summary for external consumption
   */
  getProcessSummary(processData) {
    return {
      profileId: processData.profileId,
      pid: processData.pid,
      status: processData.status,
      uptime: processData.metrics.uptime,
      memory: Math.round(processData.metrics.memory.current / (1024 * 1024)),
      cpu: Math.round(processData.metrics.cpu.current),
      tabCount: processData.metrics.tabCount,
      errors: processData.metrics.errors,
      platform: processData.metadata.platform,
      accountId: processData.metadata.accountId,
    };
  }

  /**
   * Get all monitored processes
   */
  getAllProcesses() {
    const processes = [];
    for (const [profileId, processData] of this.monitoredProcesses) {
      processes.push(this.getProcessSummary(processData));
    }
    return processes;
  }

  /**
   * Get process by profile ID
   */
  getProcess(profileId) {
    const processData = this.monitoredProcesses.get(profileId);
    return processData ? this.getProcessSummary(processData) : null;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    const processes = Array.from(this.monitoredProcesses.values());
    const runningProcesses = processes.filter((p) => p.status === "running");

    return {
      totalProcesses: processes.length,
      runningProcesses: runningProcesses.length,
      crashedProcesses: processes.filter((p) => p.status === "crashed").length,
      unhealthyProcesses: processes.filter((p) => p.status === "unhealthy")
        .length,
      totalMemoryUsage: runningProcesses.reduce(
        (sum, p) => sum + p.metrics.memory.current,
        0
      ),
      averageCpuUsage:
        runningProcesses.length > 0
          ? runningProcesses.reduce(
              (sum, p) => sum + p.metrics.cpu.current,
              0
            ) / runningProcesses.length
          : 0,
      totalErrors: processes.reduce((sum, p) => sum + p.metrics.errors, 0),
      oldestProcess: Math.max(
        ...runningProcesses.map((p) => p.metrics.uptime),
        0
      ),
      activeAlerts: this.resourceAlerts.size,
      lastUpdate: new Date().toISOString(),
    };
  }
}

export default ChromeProcessMonitor;
