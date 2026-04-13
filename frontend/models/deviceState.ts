export interface DeviceState {
    humidity: boolean;
    temperature: boolean;
    ledColor?: boolean;
    lightIntensity: boolean;
  }
  
  export type DeviceType = 'humidity' | 'temperature' | 'ledColor' | 'lightIntensity';
  
  export interface UpdateResponse {
    success: boolean;
  }
  
  export const fetchDeviceStates = async (): Promise<DeviceState> => {
    return {
      humidity: false,
      temperature: true,
      ledColor: false,
      lightIntensity: false
    };
  };
  
  export const updateDeviceState = async (device: DeviceType, state: boolean): Promise<UpdateResponse> => {
    console.log(`Setting ${device} to ${state}`);
    return { success: true };
  };
  