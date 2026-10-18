"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getSystemHealthDashboard } from "@/actions/dashboard.actions";
import {
  SystemHealthDashboardData,
  SystemHealthMetrics,
  ServiceHealthStatus,
} from "@/types/sysconfig.types";
import Loader from "@/components/ui/loader/Loader";

interface MetricCardData {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: ServiceHealthStatus;
  change?: number;
  trend?: "up" | "down" | "neutral";
}

export const SystemHealthDashboard: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [dashboardData, setDashboardData] =
    useState<SystemHealthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSystemHealthDashboard();

      if (response.success && response.data) {
        setDashboardData(response.data);
        setLastRefresh(new Date());
      } else {
        setError(response.message || "Failed to fetch system health data");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching system health:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Transform API metrics to card format
  const getMetricsData = (metrics: SystemHealthMetrics): MetricCardData[] => {
    return [
      {
        id: "uptime",
        label: "System Uptime",
        value: metrics.system_uptime,
        unit: "%",
        status:
          metrics.system_uptime >= 99
            ? "healthy"
            : metrics.system_uptime >= 95
              ? "warning"
              : "critical",
        trend: "up" as const,
      },
      {
        id: "latency",
        label: "Avg Response Time",
        value: metrics.avg_response_time_ms,
        unit: "ms",
        status:
          metrics.avg_response_time_ms < 200
            ? "healthy"
            : metrics.avg_response_time_ms < 500
              ? "warning"
              : "critical",
        trend: "neutral" as const,
      },
      {
        id: "error_rate",
        label: "Error Rate",
        value: metrics.error_rate,
        unit: "%",
        status:
          metrics.error_rate < 1
            ? "healthy"
            : metrics.error_rate < 5
              ? "warning"
              : "critical",
        trend: metrics.error_rate > 1 ? "up" : "down",
      },
      {
        id: "sla",
        label: "SLA Compliance",
        value: metrics.sla_compliance,
        unit: "%",
        status:
          metrics.sla_compliance >= 99
            ? "healthy"
            : metrics.sla_compliance >= 95
              ? "warning"
              : "critical",
        trend: "neutral" as const,
      },
    ];
  };

  // Helper to get status color
  const getStatusColor = (status: ServiceHealthStatus) => {
    switch (status) {
      case "healthy":
        return "text-emerald-700 bg-emerald-50 border-emerald-200 border";
      case "warning":
        return "text-amber-700 bg-amber-50 border-amber-200 border";
      case "critical":
        return "text-rose-700 bg-rose-50 border-rose-200 border";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200 border";
    }
  };

  // Helper to get status dot color
  const getStatusDotColor = (status: ServiceHealthStatus) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "critical":
        return "bg-rose-500";
      default:
        return "bg-slate-400";
    }
  };

  // Helper to get service icon
  const getServiceIcon = (type: string) => {
    switch (type) {
      case "Security":
        return <Shield size={14} />;
      case "AI Model":
        return <Zap size={14} />;
      case "Gateway":
        return <Server size={14} className="text-blue-500" />;
      default:
        return <Server size={14} />;
    }
  };

  // Format uptime percentage
  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  // Format latency
  const formatLatency = (latencyMs: number) => {
    return `${latencyMs}ms`;
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader size="28" stroke="4" speed="3.5" />
        <span className="ml-2 text-muted-foreground">
          Loading system health data...
        </span>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500 font-semibold mb-2">
          Error loading system health
        </p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const metricsData = dashboardData?.metrics
    ? getMetricsData(dashboardData.metrics)
    : [];
  const services = dashboardData?.services || [];

  return (
    <div className="space-y-6">
      {/* Refresh indicator */}
      <div className="flex justify-end items-center gap-2">
        {lastRefresh && (
          <span className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh data"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric) => (
          <div
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            className={`p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
              selectedMetric === metric.id
                ? "ring-2 ring-blue-500 border-transparent"
                : "border-border bg-card"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusColor(
                  metric.status,
                )}`}
              >
                {metric.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-foreground">
                {metric.id === "uptime" || metric.id === "sla"
                  ? metric.value.toFixed(2)
                  : metric.value.toFixed(metric.id === "error_rate" ? 2 : 0)}
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  {metric.unit}
                </span>
              </h3>
            </div>
            {metric.trend && metric.trend !== "neutral" && (
              <div
                className={`flex items-center mt-2 text-sm ${
                  metric.trend === "up" && metric.id !== "error_rate"
                    ? "text-green-600"
                    : metric.trend === "down" && metric.id === "error_rate"
                      ? "text-green-600"
                      : "text-red-600"
                }`}
              >
                {metric.trend === "up" ? (
                  <TrendingUp size={16} className="mr-1" />
                ) : (
                  <TrendingDown size={16} className="mr-1" />
                )}
                Trend {metric.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drill Down Area (Conditional) */}
      {selectedMetric && (
        <div className="p-6 bg-card border border-border rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">
              Deep Dive Analysis:{" "}
              {metricsData.find((m) => m.id === selectedMetric)?.label}
            </h3>
            <button
              onClick={() => setSelectedMetric(null)}
              className="text-sm text-primary-foreground hover:underline"
            >
              Close
            </button>
          </div>
          <div className="h-48 bg-card/60 rounded flex items-center justify-center text-muted-foreground border border-dashed border-border">
            [Interactive Analytics Chart Placeholder for {selectedMetric}]
          </div>
        </div>
      )}

      <div className="">
        {/* 2. System Components Status */}
        <div className="flex justify-between items-center w-full pt-4 pb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Server size={18} /> Service Health
          </h3>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Live Updates
          </span>
        </div>
        <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-white font-medium">
                <tr>
                  <th className="px-5 py-3 rounded-tl-lg">Component</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Uptime</th>
                  <th className="px-5 py-3">Latency</th>
                  <th className="px-5 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-muted-foreground"
                    >
                      No service health data available
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <tr
                      key={service.component_name}
                      className="hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {service.display_name}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          {getServiceIcon(service.type)}
                          {service.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatUptime(service.uptime)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatLatency(service.latency_ms)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getStatusColor(
                            service.status,
                          )}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(
                              service.status,
                            )}`}
                          ></div>
                          {service.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
