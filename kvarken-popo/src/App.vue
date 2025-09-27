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

    <main class="content">
      <component :is="activeView" />
    </main>
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f6f8fa;
  color: #222;
}

/* Main Layout using Flexbox */
/* Main Layout using Flexbox */
#layout {
  display: flex;
  height: 100vh;
  background: #f6f8fa;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background-color: #e9eef5;
  padding: 20px;
  border-right: 1px solid #cfd8dc;
}

.sidebar h2 {
  margin-bottom: 20px;
  color: #111;
}

.sidebar button {
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 10px;
  background-color: #fff;
  color: #222;
  border: 1px solid #bbb;
  border-radius: 5px;
  text-align: left;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.sidebar button:hover {
  background-color: #f0f0f0;
  color: #000;
}

.content {
  flex-grow: 1; /* Takes up the remaining space */
  padding: 40px;
  background: #f6f8fa;
}
</style>