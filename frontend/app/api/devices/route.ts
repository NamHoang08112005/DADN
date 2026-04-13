import { NextRequest, NextResponse } from 'next/server';
import { DeviceState, DeviceType } from '../../../models/deviceState';

interface DeviceUpdateRequest {
  device: DeviceType;
  state: boolean;
}

export async function GET() {
  // Mock data - trong thực tế sẽ lấy từ database hoặc IoT platform
  const deviceStates: DeviceState = {
    humidity: false,
    temperature: true,
    ledColor: false,
    lightIntensity: false
  };
  
  return NextResponse.json(deviceStates);
}

export async function POST(request: NextRequest) {
  const data = await request.json() as DeviceUpdateRequest;
  const { device, state } = data;
  
  // Logic để update trạng thái thiết bị trong database hoặc IoT platform
  
  return NextResponse.json({ success: true });
}
