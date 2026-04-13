/**
 * Utility functions to check backend and Adafruit IO connection status
 */

const BACKEND_URL = "http://127.0.0.1:8000";
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

export interface BackendHealthStatus {
  isBackendRunning: boolean;
  isAdafruitConnected: boolean;
  backendError?: string;
  adafruitError?: string;
  timestamp?: string;
}

/**
 * Check if backend server is running
 */
export async function checkBackendServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Backend server check failed:", error);
    return false;
  }
}

/**
 * Get detailed health status of backend and Adafruit connection
 */
export async function getBackendHealthStatus(): Promise<BackendHealthStatus> {
  const result: BackendHealthStatus = {
    isBackendRunning: false,
    isAdafruitConnected: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      result.isBackendRunning = false;
      result.backendError = `Backend returned status ${response.status}`;
      return result;
    }

    const data = await response.json();
    result.isBackendRunning = true;
    result.isAdafruitConnected = data.adafruit_io?.connected || false;
    result.adafruitError = data.adafruit_io?.error;
    result.timestamp = data.timestamp;

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Health check failed:", errorMessage);

    // Network error or timeout
    if (errorMessage.includes("AbortError")) {
      result.backendError = "Backend connection timeout (server may be down)";
    } else if (errorMessage.includes("Failed to fetch")) {
      result.backendError =
        "Failed to connect to backend (CORS issue or server unreachable)";
    } else {
      result.backendError = `Connection error: ${errorMessage}`;
    }

    result.isBackendRunning = false;
    return result;
  }
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(health: BackendHealthStatus): string {
  if (!health.isBackendRunning) {
    return (
      health.backendError ||
      "Backend server is not running. Please start the backend with: fastapi dev main.py"
    );
  }

  if (!health.isAdafruitConnected) {
    return (
      health.adafruitError ||
      "Adafruit IO connection failed. Please check your credentials and internet connection."
    );
  }

  return "All services are running";
}

/**
 * Format status for debugging
 */
export function formatHealthStatus(health: BackendHealthStatus): string {
  return `
Backend Status:
  - Server Running: ${health.isBackendRunning ? "✓" : "✗"}
  - Adafruit Connected: ${health.isAdafruitConnected ? "✓" : "✗"}
  ${health.backendError ? `- Backend Error: ${health.backendError}` : ""}
  ${health.adafruitError ? `- Adafruit Error: ${health.adafruitError}` : ""}
  - Checked at: ${health.timestamp || "N/A"}
  `.trim();
}
