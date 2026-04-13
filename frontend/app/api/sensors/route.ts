import { NextRequest, NextResponse } from 'next/server';
import { SensorData } from '../../../models/sensorData';

export async function GET(request: NextRequest) {
  // Xử lý request parameters nếu cần
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'Month';
  
  // Mock data - trong thực tế sẽ lấy từ database
  const sensorData: SensorData[] = [
    { date: '1 Oct', humidity: 35, light: 80, temperature: 23, airQuality: 50 },
    { date: '3 Oct', humidity: 65, light: 75, temperature: 25, airQuality: 45 },
    // ... data khác
  ];
  
  return NextResponse.json(sensorData);
}