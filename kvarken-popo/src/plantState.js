import { reactive } from 'vue';

// 1. All your application's data is stored here in a reactive object.
export const plantState = reactive({
  motors: [
    { id: 1, fuel: 'LNG', status: 'On', fuelInput: 8.5, power: 0, efficiency: 48.5, fuelConsumption: 0, co2Output: 0 },
    { id: 2, fuel: 'Hydrogen', status: 'On', fuelInput: 10.2, power: 0, efficiency: 43.2, fuelConsumption: 0, co2Output: 0 },
    { id: 3, fuel: 'Diesel', status: 'Standby', fuelInput: 0, power: 0, efficiency: 45.8, fuelConsumption: 0, co2Output: 0 },
    { id: 4, fuel: 'Natural Gas', status: 'On', fuelInput: 7.8, power: 0, efficiency: 49.1, fuelConsumption: 0, co2Output: 0 },
    { id: 5, fuel: 'Ammonia', status: 'On', fuelInput: 9.6, power: 0, efficiency: 41.8, fuelConsumption: 0, co2Output: 0 },
    { id: 6, fuel: 'LNG', status: 'Maintenance', fuelInput: 0, power: 0, efficiency: 48.5, fuelConsumption: 0, co2Output: 0 },
  ],
  totalPower: 0,
  totalCO2Output: 0, // kg CO2 per second
  uptime: 11.6, // 11 hours and 36 minutes (11 + 36/60)
  co2Credits: 5000, // Starting CO2 credits in tons
  co2CreditsChange: 0, // Credits gained (+) or lost (-) per tick
  
  // Historical data for graphs
  history: {
    // Real-time data (last 450 points = 15 minutes)
    realTime: {
      timestamps: [],
      powerOutput: [],
      co2Impact: [],
      maxDataPoints: 450
    },
    // Fake historical data for longer periods
    day: [],
    week: [],
    month: []
  },
  
  // Chart settings
  chartPeriod: 'realtime', // 'realtime', 'day', 'week', 'month'
  
  // Regional settings and compliance data
  region: 'EU', // 'EU', 'US', 'China'
  plantCapacity: 18.5, // MW - total plant capacity
  
  // Region-specific regulatory data
  regulatory: {
    // EU specific
    euAllowances: {
      purchased: 2450, // EUAs purchased
      surrendered: 1890, // EUAs surrendered
      remaining: 560 // Current balance
    },
    
    // China specific
    efficiency: {
      benchmark: 310, // gCO2/kWh benchmark
      actual: 0, // Calculated from current operations
      extraAllowancesRequired: 0
    },
    ccerOffsets: 125, // tons CO2 offset via CCER
    
    // US specific
    carbonCredits: {
      purchased: 890, // Credits purchased
      surrendered: 340, // Credits surrendered  
      remaining: 550 // Current balance
    },
    
    // Common metrics
    co2EmissionsPerMWh: 0, // Updated in real-time
    verificationStatus: 'Pending', // 'Verified', 'Pending', 'Required'
    lastAuditDate: new Date(2025, 8, 15) // Sept 15, 2025
  }
});

// 2. Fuel energy densities and CO2 emission factors
const fuelEnergyDensity = {
  'LNG': 50, // MJ/kg
  'Natural Gas': 50, // MJ/kg  
  'Hydrogen': 120, // MJ/kg
  'Ammonia': 18.6, // MJ/kg
  'Diesel': 42.7 // MJ/kg
};

const co2Factors = {
  'LNG': 2.75, // kg CO2 per kg LNG
  'Natural Gas': 2.75, // kg CO2 per kg natural gas
  'Hydrogen': 0, // Zero direct emissions
  'Ammonia': 0, // Zero direct emissions when cracked
  'Diesel': 3.15 // kg CO2 per kg diesel
};

// 3. This function calculates power output from fuel input and efficiency
function simulateRealTimeData() {
  let totalPowerOutput = 0;
  let totalCO2Output = 0; // kg CO2 per second
  
  plantState.motors.forEach(motor => {
    // Only calculate for running motors
    if (motor.status === 'On') {
      // Add realistic fluctuations to fuel input (±5%)
      const fuelFluctuation = (Math.random() - 0.5) * 0.1; // ±5%
      const actualFuelInput = motor.fuelInput * (1 + fuelFluctuation);
      
      // Calculate power output from fuel input and efficiency
      // Power (MW) = Fuel Input (MW) × Efficiency (%)
      motor.power = actualFuelInput * (motor.efficiency / 100);
      
      // Calculate actual fuel consumption rate (kg/h)
      // Convert MW to MJ/h, then to kg/h using energy density
      motor.fuelConsumption = (actualFuelInput * 3600) / fuelEnergyDensity[motor.fuel];
      
      // Calculate CO2 impact (kg CO2 per second) - scaled to match historical range
      // Positive for emissions, negative for clean energy offset
      if (motor.fuel === 'Hydrogen' || motor.fuel === 'Ammonia') {
        // Clean energy sources create negative CO2 impact (carbon offset)
        motor.co2Output = -(motor.power * 0.02); // Reduced from 0.2 to 0.02 for scale matching
      } else {
        // Fossil fuels create positive CO2 emissions
        motor.co2Output = (motor.fuelConsumption * co2Factors[motor.fuel]) / 36000; // Divided by 36000 instead of 3600
      }
      
      totalPowerOutput += motor.power;
      totalCO2Output += motor.co2Output; // This can now be negative overall
    } else {
      // Motor is off/standby/maintenance
      motor.power = 0;
      motor.fuelConsumption = 0;
      motor.co2Output = 0;
    }
  });
  
  // Update global state
  plantState.totalPower = totalPowerOutput;
  plantState.totalCO2Output = totalCO2Output;
  
  // Calculate CO2 credits change based on emissions AND clean energy production
  // Each ton of CO2 costs 1 credit, but clean energy generates credits
  const co2TonsPerHour = totalCO2Output * 3.6; // kg/s to tons/hour (negative impact)
  
  // Calculate clean energy credit generation
  // Award credits for hydrogen and ammonia power production (0.5 credits per MWh)
  let cleanEnergyCredits = 0;
  plantState.motors.forEach(motor => {
    if (motor.status === 'On' && (motor.fuel === 'Hydrogen' || motor.fuel === 'Ammonia')) {
      cleanEnergyCredits += motor.power * 0.5; // 0.5 credits per MW per hour
    }
  });
  
  // Net credit change = clean energy gains - emission losses
  plantState.co2CreditsChange = cleanEnergyCredits - co2TonsPerHour;
  
  // Update total credits
  plantState.co2Credits += plantState.co2CreditsChange / 1800; // Divide by 1800 for 2-second intervals
  
  // Calculate region-specific regulatory metrics
  updateRegulatoryMetrics(totalPowerOutput, totalCO2Output);
  
  // Increment uptime by 2 seconds
  plantState.uptime += 2 / 3600; // Convert seconds to hours
  
  // Store historical data for graphs
  const now = new Date();
  plantState.history.realTime.timestamps.push(now);
  plantState.history.realTime.powerOutput.push(totalPowerOutput);
  plantState.history.realTime.co2Impact.push(totalCO2Output * 3600); // Convert to kg/h
  
  // Keep only the last 60 data points (2 minutes of history)
  if (plantState.history.realTime.timestamps.length > plantState.history.realTime.maxDataPoints) {
    plantState.history.realTime.timestamps.shift();
    plantState.history.realTime.powerOutput.shift();
    plantState.history.realTime.co2Impact.shift();
  }
}

// 3.5 Update regulatory metrics based on region
function updateRegulatoryMetrics(totalPowerOutput, totalCO2Output) {
  // Calculate CO2 emissions per MWh (common metric)
  if (totalPowerOutput > 0) {
    plantState.regulatory.co2EmissionsPerMWh = (totalCO2Output * 3600) / totalPowerOutput; // kg CO2 per MWh
  }
  
  // Region-specific calculations
  switch (plantState.region) {
    case 'EU':
      // EU: Track EUA consumption based on emissions
      if (totalCO2Output > 0) {
        const euaConsumptionRate = (totalCO2Output * 3.6) / 1000; // tons CO2 per hour
        plantState.regulatory.euAllowances.remaining = Math.max(0, 
          plantState.regulatory.euAllowances.remaining - (euaConsumptionRate / 1800)
        );
        plantState.regulatory.euAllowances.surrendered += euaConsumptionRate / 1800;
      }
      break;
      
    case 'China':
      // China: Check efficiency benchmarks
      plantState.regulatory.efficiency.actual = Math.abs(plantState.regulatory.co2EmissionsPerMWh);
      if (plantState.regulatory.efficiency.actual > plantState.regulatory.efficiency.benchmark) {
        const excessEmissions = plantState.regulatory.efficiency.actual - plantState.regulatory.efficiency.benchmark;
        plantState.regulatory.efficiency.extraAllowancesRequired = 
          (excessEmissions * totalPowerOutput) / 1000; // tons CO2 excess per hour
      } else {
        plantState.regulatory.efficiency.extraAllowancesRequired = 0;
      }
      break;
      
    case 'US':
      // US: Update carbon credits based on emissions
      if (totalCO2Output > 0) {
        const creditConsumptionRate = (totalCO2Output * 3.6) / 1000; // tons CO2 per hour
        plantState.regulatory.carbonCredits.remaining = Math.max(0,
          plantState.regulatory.carbonCredits.remaining - (creditConsumptionRate / 1800)
        );
        plantState.regulatory.carbonCredits.surrendered += creditConsumptionRate / 1800;
      }
      break;
  }
}

// 3.6 Initialize real-time data with 15 minutes of fake history
function initializeRealTimeData() {
  const now = new Date();
  
  // Generate 450 data points (15 minutes at 2-second intervals)
  for (let i = 449; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 2000); // 2 seconds per point
    
    // Generate realistic power output similar to current simulation
    const basePower = 15 + Math.sin(i / 50) * 3 + (Math.random() - 0.5) * 2;
    const powerOutput = Math.max(8, basePower);
    
    // Generate CO2 impact in similar range to historical data (±500kg/h)
    const co2Impact = -100 + powerOutput * 20 + (Math.random() - 0.5) * 200;
    
    plantState.history.realTime.timestamps.push(timestamp);
    plantState.history.realTime.powerOutput.push(powerOutput);
    plantState.history.realTime.co2Impact.push(co2Impact);
  }
}

// 4. Generate fake historical data for longer periods
function generateHistoricalData() {
  const now = new Date();
  
  // Generate day data (24 hours, 1 point per hour) - positive CO2 emissions (red)
  plantState.history.day = [];
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const basePower = 15 + Math.sin((24 - i) / 24 * Math.PI * 2) * 3 + (Math.random() - 0.5) * 2;
    // Positive CO2 showing emissions (kg/h produced) - will display as red
    const co2Impact = 50 + basePower * 20 + (Math.random() - 0.5) * 60;
    
    plantState.history.day.push({
      timestamp,
      powerOutput: Math.max(8, basePower),
      co2Impact: Math.max(10, co2Impact) // Ensure positive values
    });
  }
  
  // Generate week data (7 days, 1 point per day) - green surplus with high fluctuation
  plantState.history.week = [];
  for (let i = 6; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const basePower = 14 + Math.sin(i / 7 * Math.PI) * 4 + (Math.random() - 0.5) * 6;
    // High fluctuation carbon credits - dramatic swings between -400 to -50
    const baseCredits = -(120 + basePower * 25);
    const volatility = (Math.random() - 0.5) * 300; // ±150 volatility
    const seasonalEffect = Math.sin(i / 7 * Math.PI * 4) * 100; // Seasonal pattern
    const co2Impact = baseCredits + volatility + seasonalEffect;
    
    plantState.history.week.push({
      timestamp,
      powerOutput: Math.max(8, basePower),
      co2Impact: Math.min(-30, co2Impact) // Ensure negative but with big swings
    });
  }
  
  // Generate month data (30 days, 1 point per day) - extreme fluctuation in carbon credits
  plantState.history.month = [];
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const basePower = 13 + Math.sin(i / 30 * Math.PI * 3) * 5 + (Math.random() - 0.5) * 4;
    // Extreme fluctuations showing market volatility and policy changes
    const baseCredits = -(180 + basePower * 35);
    const marketVolatility = (Math.random() - 0.5) * 400; // ±200 market swings
    const policyEffect = Math.sin(i / 30 * Math.PI * 6) * 150; // Policy cycle effects  
    const weatherEffect = Math.cos(i / 30 * Math.PI * 8) * 80; // Weather impact on renewables
    const co2Impact = baseCredits + marketVolatility + policyEffect + weatherEffect;
    
    plantState.history.month.push({
      timestamp,
      powerOutput: Math.max(6, basePower),
      co2Impact: Math.min(-20, co2Impact) // Ensure negative with dramatic swings
    });
  }
}

// Initialize real-time and historical data
initializeRealTimeData();
generateHistoricalData();

// 5. Start the simulation loop, running the function every 2 seconds.
setInterval(simulateRealTimeData, 2000);