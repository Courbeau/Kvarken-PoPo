# Kvarken-PoPo Power Plant Monitoring System

## Project Overview

This is a Vue 3 + Vite application for real-time power plant monitoring and sustainability compliance. Built for Junction x Vaasa's Hackathon 2025, it simulates a multi-fuel power plant with regulatory compliance across different regions (EU, US, China).

## Architecture & Key Patterns

### Central State Management

- **Core state**: `src/plantState.js` contains the entire application state in a single reactive object
- **Real-time simulation**: Auto-updates every 2 seconds via `setInterval(simulateRealTimeData, 2000)`
- **Multi-fuel motors**: 6 motors with different fuel types (LNG, Hydrogen, Diesel, Natural Gas, Ammonia)
- **Regional compliance**: Different regulatory metrics based on `plantState.region` (EU/US/China)

### Component Structure

- **App.vue**: Main layout with sidebar navigation and flag-based region selector in top-right userbox
- **PlantOverview.vue**: SVG diagram showing motors/generators with real-time power output
- **Dashboard.vue**: Sustainability metrics, charts (D3.js), and regulatory compliance data

### Data Flow Patterns

```javascript
// Always import and use the reactive state object
import { plantState } from './plantState.js';

// Motors have calculated properties updated in simulation:
motor.power = actualFuelInput * (motor.efficiency / 100);
motor.fuelConsumption = (actualFuelInput * 3600) / fuelEnergyDensity[motor.fuel];
motor.co2Output = // Positive for emissions, negative for clean energy offset
```

## Development Workflows

### Commands

- `npm run dev` - Development server with hot reload
- `npm run build` - Production build
- `npm run preview` - Preview production build

### File Organization

- `@/` alias maps to `src/` (configured in vite.config.js and jsconfig.json)
- Components in `src/components/`
- Flag images in `src/flags/` (eu.png, us.png, china.png)
- Shared state and utilities in root of `src/`

## Critical Implementation Details

### Fuel Type Logic

Different fuels have specific energy densities and CO2 factors:

- **Clean fuels** (Hydrogen, Ammonia): Zero direct emissions, create negative CO2 impact
- **Fossil fuels** (LNG, Diesel, Natural Gas): Positive emissions based on consumption rate
- Motors in 'Standby' or 'Maintenance' status produce zero output

### Regional Compliance Systems

Each region tracks different metrics:

- **EU**: EUA (European Union Allowances) consumption tracking
- **China**: Efficiency benchmarks with extra allowance requirements
- **US**: Carbon credits system with purchased/surrendered tracking

### Chart Data Management

- **Real-time**: Last 60 data points (2 minutes) in `plantState.history.realTime`
- **Historical**: Pre-generated fake data for day/week/month views
- **D3.js integration**: Charts update reactively when `chartPeriod` changes

### Styling Conventions

- Modern glassmorphism design with `backdrop-filter: blur()`
- Consistent color coding: Green (operational), yellow (standby), red (maintenance)
- Responsive layout with sidebar + main content area
- Status indicators use emoji + text combinations

## Common Modification Patterns

### Adding New Motor States

Update `motorColor()` function in PlantOverview.vue and add corresponding legend item.

### New Regional Compliance

Add case to `updateRegulatoryMetrics()` switch statement in plantState.js with region-specific calculations.

### Chart Period Extensions

Add new period to `chartPeriod` options and generate corresponding fake data in `generateHistoricalData()`.

## Dependencies

- **Vue 3**: Composition API with `<script setup>`
- **D3.js**: Chart rendering and data visualization
- **jsPDF**: Report generation functionality
- **Vite**: Build tool with Vue plugin and dev tools
