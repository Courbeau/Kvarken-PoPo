<template>
  <div class="overview-container">
    <div class="overview-header">
      <h1>Plant Overview</h1>
    </div>
    
    <!-- Plant Diagram Section -->
    <div class="plant-diagram-section">
      <div class="section-header">
        <h2>Real-time Energy Production Systems</h2>
        <div class="status-legend-compact">
          <div class="legend-items-horizontal">
            <div class="legend-item">
              <div class="status-indicator on"></div>
              <span>Operational</span>
            </div>
            <div class="legend-item">
              <div class="status-indicator standby"></div>
              <span>Standby</span>
            </div>
            <div class="legend-item">
              <div class="status-indicator maintenance"></div>
              <span>Maintenance</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="diagram-card">
        <svg :width="svgWidth" :height="svgHeight" viewBox="0 0 800 320">
          <!-- Motors and Generators -->
          <g v-for="(motor, i) in plantState.motors" :key="motor.id">
            <!-- Motor symbol (circle + M) -->
            <circle :cx="motorX(i)" :cy="motorY" r="24" :fill="motorColor(motor.status)" stroke="#2d3748" stroke-width="3" />
            <text :x="motorX(i)" :y="motorY+8" text-anchor="middle" font-size="22" fill="#2d3748" font-family="system-ui, -apple-system, sans-serif" font-weight="700">M</text>
            <!-- Motor ID -->
            <text :x="motorX(i)" :y="motorY-32" text-anchor="middle" font-size="14" fill="#4a5568" font-weight="600">#{{ motor.id }}</text>
            <!-- Link to generator -->
            <line :x1="motorX(i)" :y1="motorY+24" :x2="motorX(i)" :y2="genY-18" stroke="#a0aec0" stroke-width="4" />
            <!-- Generator symbol (rectangle) -->
            <rect :x="motorX(i)-18" :y="genY-18" width="36" height="36" rx="8" fill="#fff" stroke="#2d3748" stroke-width="3" />
            <text :x="motorX(i)" :y="genY+7" text-anchor="middle" font-size="18" fill="#2d3748" font-weight="700">G</text>
            <!-- Power output -->
            <text :x="motorX(i)+28" :y="genY+5" text-anchor="start" font-size="14" fill="#4a5568" font-weight="600">{{ motor.power.toFixed(2) }} MW</text>
          </g>
          <!-- Lines from generators to total -->
          <g v-for="(motor, i) in plantState.motors" :key="'line'+motor.id">
            <line :x1="motorX(i)" :y1="genY+18" :x2="sumX" :y2="sumY-30" stroke="#667eea" stroke-width="3" stroke-dasharray="8,6" opacity="0.8" />
          </g>
          <!-- Total output node -->
          <g>
            <rect :x="sumX-32" :y="sumY-32" width="64" height="40" rx="12" fill="#667eea" stroke="#2d3748" stroke-width="3" />
            <text :x="sumX" :y="sumY-8" text-anchor="middle" font-size="16" fill="white" font-weight="700">Total</text>
            <text :x="sumX" :y="sumY+32" text-anchor="middle" font-size="16" fill="#2d3748" font-weight="700">{{ totalPower.toFixed(2) }} MW</text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Motor Status Overview Section -->
    <div class="motors-section">
      <div class="section-header">
        <h2>Motor Status Overview</h2>
      </div>
      
      <div class="table-container">
        <table class="motors-table">
          <thead>
            <tr>
              <th>Motor ID</th>
              <th>Fuel Type</th>
              <th>Status</th>
              <th>Power Output</th>
              <th>Efficiency</th>
              <th>Fuel Consumption</th>
              <th>CO₂ Output</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="motor in plantState.motors" :key="motor.id" class="motor-row">
              <td class="motor-id">#{{ motor.id }}</td>
              <td class="fuel-type">{{ motor.fuel }}</td>
              <td>
                <span :class="['status-badge', motor.status.toLowerCase()]">{{ motor.status }}</span>
              </td>
              <td class="power-output">{{ motor.power.toFixed(2) }} MW</td>
              <td class="efficiency">{{ motor.efficiency ? motor.efficiency.toFixed(1) + '%' : 'N/A' }}</td>
              <td class="fuel-consumption">{{ motor.fuelConsumption.toFixed(1) }} kg/h</td>
              <td class="co2-output">
                <span :class="getCO2Class(motor.co2Output)">
                  {{ motor.co2Output >= 0 ? '+' : '' }}{{ (motor.co2Output * 3600).toFixed(1) }} kg/h
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="7" class="summary-container">
                <div class="summary-grid">
                  <div class="summary-metric">
                    <div class="summary-content">
                      <div class="summary-label">Total Power</div>
                      <div class="summary-value">{{ totalPower.toFixed(2) }} MW</div>
                    </div>
                  </div>
                  <div class="summary-metric">
                    <div class="summary-content">
                      <div class="summary-label">Avg. Efficiency</div>
                      <div class="summary-value">{{ avgEfficiency.toFixed(1) }}%</div>
                    </div>
                  </div>
                  <div class="summary-metric">
                    <div class="summary-content">
                      <div class="summary-label">Uptime</div>
                      <div class="summary-value">{{ formattedUptime }}</div>
                    </div>
                  </div>
                  <div class="summary-metric">
                    <div class="summary-content">
                      <div class="summary-label">Total Fuel</div>
                      <div class="summary-value">{{ plantState.motors.filter(m => m.status === 'On').reduce((sum, m) => sum + m.fuelConsumption, 0).toFixed(1) }} kg/h</div>
                    </div>
                  </div>
                  <div class="summary-metric">
                    <div class="summary-content">
                      <div class="summary-label">Total CO₂</div>
                      <div class="summary-value" :class="plantState.totalCO2Output <= 0 ? 'positive-co2' : 'negative-co2'">
                        {{ plantState.totalCO2Output >= 0 ? '+' : '' }}{{ (plantState.totalCO2Output * 3600).toFixed(1) }} kg/h
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { plantState } from '../plantState.js';

// SVG layout helpers
const svgWidth = 800;
const svgHeight = 320;
const motorY = 70;
const genY = 170;
const sumX = svgWidth / 2;
const sumY = 270;

function motorX(i) {
  return 90 + i * 120;
}

function motorColor(status) {
  if (status === 'On') return '#7be87b';
  if (status === 'Standby') return '#ffe066';
  if (status === 'Maintenance') return '#ff6b6b';
  return '#bbb';
}

const gridDots = Array.from({ length: 9 }, (_, idx) => {
  const gx = idx % 3;
  const gy = Math.floor(idx / 3);
  return {
    key: `g${gx}${gy}`,
    cx: sumX - 16 + gx * 16,
    cy: sumY - 16 + gy * 12,
  };
});

// Computed properties for motor status table
const totalPower = computed(() => plantState.totalPower);

const avgEfficiency = computed(() => {
  const activeMotors = plantState.motors.filter(m => m.status === 'On');
  if (activeMotors.length === 0) return 0;
  return activeMotors.reduce((sum, m) => sum + m.efficiency, 0) / activeMotors.length;
});

const formattedUptime = computed(() => {
  const hours = Math.floor(plantState.uptime);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
});

// Helper functions for motor status table
const getCO2Class = (co2Output) => {
  const hourlyOutput = co2Output * 3600; // Convert to kg/h
  if (Math.abs(hourlyOutput) < 0.1) return 'neutral-co2'; // Nearly zero
  return hourlyOutput <= 0 ? 'positive-co2' : 'negative-co2';
};
</script>

<style scoped>
/* Modern Plant Overview Styling */
.overview-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.overview-header {
  text-align: center;
  margin-bottom: 48px;
}

.overview-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 8px;
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
  font-weight: 500;
}

/* Plant Diagram Section - same styling as motors section */
.plant-diagram-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 32px;
}

/* Compact Status Legend - integrated into section header */
.status-legend-compact {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.08);
}

.legend-items-horizontal {
  display: flex;
  gap: 20px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

.status-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #2d3748;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.status-indicator.on {
  background: linear-gradient(135deg, #48bb78, #38a169);
}

.status-indicator.standby {
  background: linear-gradient(135deg, #edc836, #ddb720);
}

.status-indicator.maintenance {
  background: linear-gradient(135deg, #f56565, #e53e3e);
}

.diagram-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  width: 100%;
  overflow: hidden;
  margin-top: 24px;
}

.diagram-card svg {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  width: 100%;
  height: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Responsive Design */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .status-legend-compact {
    width: 100%;
  }
  
  .legend-items-horizontal {
    justify-content: space-between;
    gap: 12px;
  }
  
  .legend-item {
    font-size: 0.8rem;
  }
  
  .overview-header h1 {
    font-size: 2rem;
  }
  
  .diagram-card {
    padding: 24px;
  }
  
  .plant-diagram-section {
    padding: 24px;
  }
}

/* Motors Section Styles */
.motors-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 48px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.section-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h2::before {
  content: '';
  width: 4px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

/* Table Styling */
.table-container {
  overflow-x: auto;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.motors-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.motors-table th {
  background: #f7fafc;
  padding: 20px 24px;
  text-align: left;
  font-weight: 700;
  color: #4a5568;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.motor-row {
  transition: background-color 0.2s ease;
}

.motor-row:hover {
  background: #f7fafc;
}

.motors-table td {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  font-weight: 500;
}

.motor-id {
  font-weight: 700;
  color: #4a5568;
}

.fuel-type {
  font-weight: 600;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-badge.on {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.standby {
  background: #fef5e7;
  color: #c05621;
}

.status-badge.maintenance {
  background: #fed7d7;
  color: #c53030;
}

.power-output, .efficiency, .fuel-consumption {
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

/* Enhanced Summary Row */
.summary-row {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-top: 2px solid #cbd5e0;
}

.summary-container {
  padding: 20px !important;
  border: none !important;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.summary-metric {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e2e8f0;
  padding: 16px;
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-metric:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 1);
}

.summary-content {
  flex: 1;
  text-align: center;
}

.summary-label {
  font-size: 0.8rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 700;
  line-height: 1.2;
}

.summary-value.positive-co2 {
  color: #38a169;
}

.summary-value.negative-co2 {
  color: #e53e3e;
}

.positive-co2 {
  color: #38a169; /* Green for carbon removal */
  font-weight: 600;
}

.negative-co2 {
  color: #e53e3e; /* Red for carbon emissions */
  font-weight: 600;
}

.neutral-co2 {
  color: #a0aec0; /* Gray for zero emissions */
  font-weight: 500;
}
</style>