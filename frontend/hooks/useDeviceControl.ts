import { useState, useEffect } from 'react';
import { fetchDeviceStates, updateDeviceState, DeviceState, DeviceType } from '../models/deviceState';

export const useDeviceControl = () => {
  const [devices, setDevices] = useState<DeviceState>({
    humidity: false,
    temperature: true,
    ledColor: false,
    lightIntensity: false
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeviceStates = async () => {
      try {
        setLoading(true);
        const states = await fetchDeviceStates();
        setDevices(states);
        setError(null);
      } catch (err) {
        setError('Failed to load device states');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDeviceStates();
  }, []);

  const toggleDevice = async (device: DeviceType, newState: boolean): Promise<boolean> => {
    try {
      const result = await updateDeviceState(device, newState);
      if (result.success) {
        setDevices(prev => ({
          ...prev,
          [device]: newState
        }));
      }
      return result.success;
    } catch (err) {
      setError(`Failed to toggle ${device}`);
      console.error(err);
      return false;
    }
  };

  return {
    devices,
    toggleDevice,
    loading,
    error
  };
};