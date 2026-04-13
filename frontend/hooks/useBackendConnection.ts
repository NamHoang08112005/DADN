import { useState, useEffect, useCallback } from 'react';
import { getBackendHealthStatus, BackendHealthStatus } from '@/lib/backendHealth';

interface UseBackendConnectionOptions {
  autoRetry?: boolean;
  retryInterval?: number;
}

export function useBackendConnection(options: UseBackendConnectionOptions = {}) {
  const { autoRetry = true, retryInterval = 30000 } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const healthStatus = await getBackendHealthStatus();
      setHealth(healthStatus);
      setIsConnected(
        healthStatus.isBackendRunning && healthStatus.isAdafruitConnected
      );
      return healthStatus;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Auto retry interval
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRetry) {
      intervalId = setInterval(checkConnection, retryInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkConnection, autoRetry, retryInterval]);

  return {
    isConnected,
    health,
    isChecking,
    checkConnection,
  };
}
