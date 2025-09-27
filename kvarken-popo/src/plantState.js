import { reactive } from 'vue';

// 1. All your application's data is stored here in a reactive object.
export const plantState = reactive({
  motors: [
    { id: 1, fuel: 'LNG', status: 'On', power: 3.6, efficiency: 92.1 },
    { id: 2, fuel: 'Hydrogen', status: 'On', power: 4.1, efficiency: 95.5 },
    { id: 3, fuel: 'Diesel', status: 'Standby', power: 0, efficiency: 0 },
    { id: 4, fuel: 'Natural Gas', status: 'On', power: 3.5, efficiency: 91.5 },
    { id: 5, fuel: 'Ammonia', status: 'On', power: 3.9, efficiency: 94.8 },
    { id: 6, fuel: 'LNG', status: 'Maintenance', power: 0, efficiency: 0 },
  ],
  totalPower: 15.1, // Initial calculation
  uptime: 8760.5, // Starting uptime in hours
  co2Credits: 5000, // Starting CO2 credits in tons
});

// 2. CO2 emission factors (tons of CO2 per GWh produced)
const co2Factors = {
  'Natural Gas': 200,
  'LNG': 200,
  'Diesel': 265,
  'Hydrogen': 0,
  'Ammonia': 0,
};

// 3. This function simulates the "live" data flicker and real-time calculations.
function simulateRealTimeData() {
  let currentTotalPower = 0;
  let co2ProducedThisTick = 0;
  const tickIntervalSeconds = 2; // The interval is 2000ms = 2s

  // Loop through each motor to update its state
  plantState.motors.forEach(motor => {
    if (motor.status === 'On') {
      // Add or subtract a small random amount to simulate fluctuation
      // Math.max ensures power doesn't go below a certain threshold
      motor.power = Math.max(3.0, motor.power + (Math.random() - 0.5) * 0.2);
      currentTotalPower += motor.power;

      // Calculate CO2 produced in this 2-second interval
      // (Power in GW * 2 seconds) / 3600 seconds per hour = GWh this tick
      const gwhThisTick = (motor.power * tickIntervalSeconds) / 3600;
      co2ProducedThisTick += gwhThisTick * co2Factors[motor.fuel];
    }
  });

  // Update the global state with the newly calculated values
  plantState.totalPower = currentTotalPower;
  plantState.uptime += tickIntervalSeconds / 3600; // Add fraction of an hour
  plantState.co2Credits -= co2ProducedThisTick;
}

// 4. Start the simulation loop, running the function every 2 seconds.
setInterval(simulateRealTimeData, 2000);