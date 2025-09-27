<script setup>
import { ref, shallowRef } from 'vue';
import Dashboard from './components/Dashboard.vue';
import PlantOverview from './components/PlantOverview.vue';

// A dictionary to easily access our components
const views = {
  PlantOverview,
  Dashboard
};

// Default to PlantOverview
const activeView = shallowRef(PlantOverview);

// User/location state
const location = ref('china');
const showLocationDropdown = ref(false);
function setLocation(loc) {
  location.value = loc;
  showLocationDropdown.value = false;
}
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
        <div class="user-role">Operator</div>
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