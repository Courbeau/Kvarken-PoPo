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
      <h2>Plant Control</h2>
      <ul>
        <li><button @click="activeView = PlantOverview">Plant Overview</button></li>
        <li><button @click="activeView = Dashboard">Sustainability Dashboard</button></li>
      </ul>
    </nav>

    <div class="main-area">
      <div class="userbox-global">
        <div class="user-role">Role: Operator</div>
        <div class="region-selector">
          <label for="region">Regulatory Region:</label>
          <div class="flag-selector" @click="showLocationDropdown = !showLocationDropdown">
            <img :src="currentFlag" :alt="plantState.region" class="selected-flag" />
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
  background: transparent;
}
.main-area {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}
.userbox-global {
  position: absolute;
  top: 24px;
  right: 48px;
  background: #fff;
  color: #222;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  z-index: 100;
}
.user-role {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.region-selector {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  position: relative;
}

.region-selector label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.flag-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 60px;
}

.flag-selector:hover {
  border-color: #bbb;
}

.flag-selector:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.selected-flag {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dropdown-arrow {
  font-size: 0.7rem;
  color: #999;
  margin-left: 8px;
  transition: transform 0.2s ease;
}

.flag-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  background-color: #f7fafc;
}

.flag-option.active {
  background-color: #667eea;
  color: white;
}

.flag-option.active .flag-img {
  border: 2px solid white;
}

.flag-img {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: border 0.2s ease;
  flex-shrink: 0;
}

.region-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  transition: color 0.2s ease;
}

.flag-option.active .region-name {
  color: white;
}

/* Modern Sidebar */
.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 32px 24px;
  border-radius: 0 24px 24px 0;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}

.sidebar h2 {
  margin-bottom: 32px;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  text-align: center;
}

.sidebar ul {
  list-style-type: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar button {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #4a5568;
  border: none;
  border-radius: 16px;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
.sidebar button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  color: #2d3748;
}

.content {
  flex-grow: 1; /* Takes up the remaining space */
  padding: 40px;
  background: #f6f8fa;
}
</style>