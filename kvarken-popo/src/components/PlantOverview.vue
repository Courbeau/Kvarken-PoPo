<template>
  <div class="overview-container">
    <div class="overview-header">
      <h1>⚡ Plant Overview</h1>
      <p class="subtitle">Real-time monitoring of energy production systems</p>
    </div>
    
    <div class="status-legend">
      <h3>📊 Motor Status Legend</h3>
      <div class="legend-items">
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
    
    <div class="diagram-container">
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
            <text :x="motorX(i)+28" :y="genY+5" text-anchor="start" font-size="14" fill="#4a5568" font-weight="600">{{ motor.power.toFixed(2) }} GW</text>
          </g>
          <!-- Lines from generators to total -->
          <g v-for="(motor, i) in plantState.motors" :key="'line'+motor.id">
            <line :x1="motorX(i)" :y1="genY+18" :x2="sumX" :y2="sumY-30" stroke="#667eea" stroke-width="3" stroke-dasharray="8,6" opacity="0.8" />
          </g>
          <!-- Total output node -->
          <g>
            <rect :x="sumX-32" :y="sumY-32" width="64" height="40" rx="12" fill="#667eea" stroke="#2d3748" stroke-width="3" />
            <text :x="sumX" :y="sumY-8" text-anchor="middle" font-size="16" fill="white" font-weight="700">Total</text>
            <text :x="sumX" :y="sumY+32" text-anchor="middle" font-size="16" fill="#2d3748" font-weight="700">{{ totalPower.toFixed(2) }} GW</text>
          </g>
        </svg>
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
const totalPower = computed(() => plantState.totalPower);
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

/* Status Legend */
.status-legend {
  position: absolute;
  top: 32px;
  left: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px 28px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  z-index: 10;
  min-width: 200px;
}

.status-legend h3 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
  letter-spacing: -0.025em;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #4a5568;
}

.status-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid #2d3748;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-indicator.on {
  background: linear-gradient(135deg, #48bb78, #38a169);
}

.status-indicator.standby {
  background: linear-gradient(135deg, #ed8936, #dd6b20);
}

.status-indicator.maintenance {
  background: linear-gradient(135deg, #f56565, #e53e3e);
}

/* Diagram Container */
.diagram-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.diagram-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.15);
  max-width: 900px;
  width: 100%;
  overflow: hidden;
}

.diagram-card svg {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 16px;
  width: 100%;
  height: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Responsive Design */
@media (max-width: 768px) {
  .status-legend {
    position: relative;
    top: auto;
    left: auto;
    margin-bottom: 24px;
    width: 100%;
  }
  
  .legend-items {
    flex-direction: row;
    justify-content: space-around;
  }
  
  .overview-header h1 {
    font-size: 2rem;
  }
  
  .diagram-card {
    padding: 24px;
  }
}
</style>