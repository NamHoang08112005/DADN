# Smart Home Frontend

## Overview
The frontend of the Smart Home project is built using Next.js, React, and TypeScript. It provides a modern, responsive user interface for monitoring and controlling various aspects of a smart home, including temperature, humidity, light intensity, and fan control.

## Features
- Real-time monitoring of environmental sensors (temperature, humidity, light)
- Interactive dashboard with data visualization
- Device control interface for fans and lights
- Responsive design for various screen sizes
- Time-based data filtering (Day, Week, Month, Year)

## Tech Stack
- **Framework**: Next.js 15.3.1
- **Language**: TypeScript
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 4
- **Charts**: Chart.js 4.4.9, React-Chartjs-2 5.3.0
- **Icons**: @iconify/react 5.2.1

## Project Structure
```
frontend/
├── app/                  # Next.js app directory
│   ├── dashboard/        # Dashboard page
│   ├── fan/              # Fan control page
│   ├── humidity/         # Humidity monitoring page
│   ├── light_itensity/   # Light intensity monitoring page
│   ├── temperature/      # Temperature monitoring page
│   └── ...
├── components/           # Reusable React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── layout/           # Layout components (Sidebar, Header)
│   └── ui/               # UI components (Icons, ToggleSwitch, etc.)
├── hooks/                # Custom React hooks
├── models/               # TypeScript interfaces and types
├── public/               # Static assets
└── styles/               # Global styles
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Development
To start the development server:
```
npm run dev
```
or
```
yarn dev
```
The application will be available at http://localhost:3000

### Building for Production
To build the application for production:
```
npm run build
```
or
```
yarn build
```

To start the production server:
```
npm run start
```
or
```
yarn start
```

## API Integration
The frontend communicates with the backend API at http://localhost:8000. The main API endpoints used are:

- **Temperature**: `/sensor/temp/latest`, `/sensor/temp/history1000`
- **Humidity**: `/sensor/humid/latest`, `/sensor/humid/history1000`
- **Light**: `/sensor/light/latest`, `/sensor/light/history1000`
- **Fan Control**: `/fan/fan/on`, `/fan/fan/off`
- **Light Control**: `/light/switch/on`, `/light/switch/off`