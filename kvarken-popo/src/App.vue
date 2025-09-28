<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue';
import Dashboard from './components/Dashboard.vue';
import PlantOverview from './components/PlantOverview.vue';
import { plantState } from './plantState.js';

// Import flag images
import euFlag from './flags/eu.png';
import usFlag from './flags/us.png';
import chinaFlag from './flags/china.png';

// A dictionary to easily access our components
const views = {
  PlantOverview,
  Dashboard
};

// Default to PlantOverview
const activeView = shallowRef(PlantOverview);

// Demo Mode
const demoMode = ref(false);

function toggleDemo() {
  demoMode.value = !demoMode.value;
  // Notify child components about demo mode
  if (activeView.value.name === 'Dashboard') {
    // Trigger demo mode in Dashboard
    window.dispatchEvent(new CustomEvent('demo-toggle', { detail: demoMode.value }));
  }
}

// Demo scenario functions
function startReportDemo() {
  // Switch to dashboard and highlight report generation
  activeView.value = Dashboard;
  // Trigger report demo mode
  window.dispatchEvent(new CustomEvent('start-report-demo'));
}

function startForecastingDemo() {
  // Switch to dashboard and highlight forecasting
  activeView.value = Dashboard;
  // Set balanced production for forecasting demo
  plantState.motors[1].status = 'On';  // Hydrogen
  plantState.motors[3].status = 'On';  // Natural Gas
  plantState.motors[4].status = 'On';  // Ammonia
  // Trigger forecasting demo mode
  window.dispatchEvent(new CustomEvent('start-forecasting-demo'));
}

// Listen for demo events
onMounted(() => {
  window.addEventListener('demo-toggle', (e) => {
    demoMode.value = e.detail;
  });
});

// Flag mapping
const flagMap = {
  EU: euFlag,
  US: usFlag,
  China: chinaFlag
};

// Region display names
const regionNames = {
  EU: 'EU',
  US: 'USA', 
  China: 'China'
};

// Get current flag
const currentFlag = computed(() => flagMap[plantState.region]);

// User/location state
const location = ref('china');
const showLocationDropdown = ref(false);

function setLocation(loc) {
  location.value = loc;
  showLocationDropdown.value = false;
}

function setRegion(region) {
  plantState.region = region;
  showLocationDropdown.value = false;
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  const regionSelector = document.querySelector('.region-selector');
  if (regionSelector && !regionSelector.contains(event.target)) {
    showLocationDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div id="layout">
    <nav class="sidebar">
      <h2>⚡ Kvarken Plant</h2>
      <div class="subtitle">Sustainability Control System</div>
      
      <!-- Demo Mode Toggle -->
      <div class="demo-section">
        <button @click="toggleDemo" :class="['demo-toggle', { active: demoMode }]">
          {{ demoMode ? '🎪 Exit Demo' : '🚀 Start Demo' }}
        </button>
        
        <div v-if="demoMode" class="demo-scenarios">
          <h4>Demo Scenarios</h4>
          <button @click="startReportDemo" class="scenario-btn">📊 Report Generation</button>
          <button @click="startForecastingDemo" class="scenario-btn">⚡ Energy Forecasting</button>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="navigation-section">
        <h3>Navigation</h3>
        <ul>
          <li><button @click="activeView = PlantOverview" :class="{ active: activeView.name === 'PlantOverview' }">🏭 Plant Overview</button></li>
          <li><button @click="activeView = Dashboard" :class="{ active: activeView.name === 'Dashboard' }">📊 Dashboard</button></li>
        </ul>
      </div>
      
      <!-- Session Control -->
      <div class="session-section">
        <h3>Session</h3>
        <div class="session-info">
          <div class="operator-badge">
            <span class="operator-icon">👤</span>
            <span class="operator-role">Control Operator</span>
          </div>
          
          <div class="region-selector">
            <label class="region-label-small">Regulatory Region:</label>
            <div class="flag-selector" @click="showLocationDropdown = !showLocationDropdown">
              <img :src="currentFlag" :alt="plantState.region" class="selected-flag" />
              <span class="region-label">{{ regionNames[plantState.region] }}</span>
              <span class="dropdown-arrow">▼</span>
            </div>
            
            <!-- Custom dropdown menu -->
            <div v-if="showLocationDropdown" class="flag-dropdown">
              <div class="flag-option" 
                   v-for="(flag, region) in flagMap" 
                   :key="region"
                   @click="setRegion(region)"
                   :class="{ active: plantState.region === region }">
                <img :src="flag" :alt="region" class="flag-img" />
                <span class="region-name">{{ regionNames[region] }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="main-area">
      <main class="content">
        <component :is="activeView" />
      </main>
    </div>
  </div>
</template>

<style>
/* Basic CSS Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #2d3748;
  line-height: 1.6;
  font-size: 14px;
}

/* Modern Layout */
#layout {
  display: flex;
  height: 100vh;
  min-height: 100vh;
  background: transparent;
  overflow: hidden;
}
.main-area {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
/* Navigation Section */
.navigation-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.navigation-section h3 {
  color: #ffd700;
  font-size: 0.85rem;
  margin-bottom: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.navigation-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.navigation-section li {
  margin-bottom: 8px;
}

/* Session Section */
.session-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.session-section h3 {
  color: #ffd700;
  font-size: 0.85rem;
  margin-bottom: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.session-info {
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255,215,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.operator-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.operator-icon {
  font-size: 1.2rem;
  background: #ffd700;
  color: #1a202c;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.operator-role {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.9rem;
}

.region-label-small {
  display: block;
  color: #a0aec0;
  font-size: 0.75rem;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
}



.region-selector {
  position: relative;
}

.flag-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,215,0,0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
}

.flag-selector:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,215,0,0.4);
}

.selected-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.region-label {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.9rem;
  flex: 1;
}

.dropdown-arrow {
  font-size: 0.7rem;
  color: #ffd700;
  transition: transform 0.2s ease;
}

.flag-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #2d3748;
  border: 1px solid rgba(255,215,0,0.3);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
}

.flag-option {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.flag-option:hover {
  background-color: rgba(255,255,255,0.05);
}

.flag-option.active {
  background-color: #ffd700;
  color: #1a202c;
}

.flag-option.active .flag-img {
  border: 2px solid #1a202c;
}

.flag-img {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: border 0.2s ease;
  flex-shrink: 0;
}

.region-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #e2e8f0;
  transition: color 0.2s ease;
}

.flag-option.active .region-name {
  color: #1a202c;
  font-weight: 600;
}

/* Modern Sidebar */
.sidebar {
  width: 280px;
  background: #000000;
  color: #e2e8f0;
  padding: 24px;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  height: 100vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar h2 {
  margin-bottom: 8px;
  font-size: 1.3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700, #ffa500);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 0.8rem;
  color: #a0aec0;
  margin-bottom: 24px;
  font-weight: 500;
}

.demo-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.demo-toggle {
  width: 100%;
  padding: 12px;
  border: 2px dashed #ffd700;
  background: transparent;
  color: #ffd700;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
}

.demo-toggle:hover {
  background: rgba(255, 215, 0, 0.1);
  transform: scale(1.02);
}

.demo-toggle.active {
  background: #ffd700;
  color: #1a202c;
  animation: pulse 2s infinite;
}

.demo-scenarios {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.demo-scenarios h4 {
  color: #ffd700;
  font-size: 0.75rem;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
}

.scenario-btn {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: rgba(255,215,0,0.1);
  border: 1px solid rgba(255,215,0,0.3);
  color: #ffd700;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.scenario-btn:hover {
  background: rgba(255,215,0,0.2);
  transform: translateX(2px);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Demo section positioned after title */
.demo-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar button {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  text-align: left;
}

.sidebar button:hover {
  background: rgba(255,255,255,0.05);
  border-color: #ffd700;
  transform: translateX(4px);
}

.sidebar button.active {
  background: linear-gradient(135deg, #ffd700, #ffa500);
  color: #1a202c;
  font-weight: 700;
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.content {
  flex: 1;
  padding: 40px;
  background: #f6f8fa;
  overflow-y: auto;
  height: calc(100vh - 80px);
}
</style>