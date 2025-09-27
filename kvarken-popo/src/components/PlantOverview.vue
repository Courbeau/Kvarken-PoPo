<template>
  <div class="view-container">
    <h1>Plant Overview</h1>
    <div class="scada-diagram">
      <svg :width="svgWidth" :height="svgHeight" viewBox="0 0 800 320" style="background:#fff;">
        <!-- Motors and Generators -->
        <g v-for="(motor, i) in plantState.motors" :key="motor.id">
          <!-- Motor symbol (circle + M) -->
          <circle :cx="motorX(i)" :cy="motorY" r="24" :fill="motorColor(motor.status)" stroke="#222" stroke-width="2" />
          <text :x="motorX(i)" :y="motorY+8" text-anchor="middle" font-size="22" fill="#111" font-family="monospace">M</text>
          <!-- Motor ID -->
          <text :x="motorX(i)" :y="motorY-32" text-anchor="middle" font-size="14" fill="#111">#{{ motor.id }}</text>
          <!-- Link to generator -->
          <line :x1="motorX(i)" :y1="motorY+24" :x2="motorX(i)" :y2="genY-18" stroke="#bbb" stroke-width="3" />
          <!-- Generator symbol (rectangle) -->
          <rect :x="motorX(i)-18" :y="genY-18" width="36" height="36" rx="7" fill="#fff" stroke="#222" stroke-width="2" />
          <text :x="motorX(i)" :y="genY+7" text-anchor="middle" font-size="18" fill="#111">G</text>
          <!-- Power output (to the right of generator box) -->
          <text :x="motorX(i)+26" :y="genY+5" text-anchor="start" font-size="14" fill="#111">{{ motor.power.toFixed(2) }} GW</text>
        </g>
        <!-- Lines from all generators to sum node -->
        <g v-for="(motor, i) in plantState.motors" :key="'line'+motor.id">
          <line :x1="motorX(i)" :y1="genY+18" :x2="sumX" :y2="sumY-30" stroke="#222" stroke-width="2" stroke-dasharray="6,4" />
        </g>
        <!-- Total node (output) -->
        <g>
          <rect :x="sumX-32" :y="sumY-32" width="64" height="40" rx="10" fill="#fff" stroke="#222" stroke-width="3" />
          <text :x="sumX" :y="sumY-8" text-anchor="middle" font-size="16" fill="#111">Total</text>
          <text :x="sumX" :y="sumY+32" text-anchor="middle" font-size="15" fill="#111">{{ totalPower.toFixed(2) }} GW</text>
        </g>
      </svg>
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
.scada-diagram {
  margin: 32px auto 24px auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 16px #e0e0e0;
  padding: 18px 0 8px 0;
  max-width: 820px;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
}
.view-container {
  background: #f6f8fa;
  color: #222;
  border-radius: 12px;
  padding: 16px 0 0 0;
}
</style>