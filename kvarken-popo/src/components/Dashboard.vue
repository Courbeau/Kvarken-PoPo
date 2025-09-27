<template>
  <div class="view-container dashboard">
    <h1>Dashboard</h1>
  <div class="metrics">
      <div class="metric">
        <span class="label">Total Power</span>
        <span class="value">{{ totalPower.toFixed(2) }} GW</span>
      </div>
      <div class="metric">
        <span class="label">Avg. Efficiency</span>
        <span class="value">{{ avgEfficiency.toFixed(1) }}%</span>
      </div>
      <div class="metric">
        <span class="label">Uptime</span>
        <span class="value">{{ formattedUptime }}</span>
      </div>
      <div class="metric">
        <span class="label">CO₂ Credits</span>
        <span class="value">{{ plantState.co2Credits.toLocaleString(undefined, {maximumFractionDigits: 1}) }} t</span>
      </div>
    </div>

    <div class="report-bar">
      <h2>Motors</h2>
      <button class="get-report-btn" @click="showReportDialog = true">Get Report</button>
    </div>
    <table class="motors-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fuel</th>
          <th>Status</th>
          <th>Power (GW)</th>
          <th>Efficiency (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="motor in plantState.motors" :key="motor.id">
          <td>{{ motor.id }}</td>
          <td>{{ motor.fuel }}</td>
          <td>
            <span :class="['status', motor.status.toLowerCase()]">{{ motor.status }}</span>
          </td>
          <td>{{ motor.power.toFixed(2) }}</td>
          <td>{{ motor.efficiency ? motor.efficiency.toFixed(1) : '-' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Simple Report Dialog -->
    <div v-if="showReportDialog" class="modal-overlay">
      <div class="modal">
        <h3>Get Report</h3>
        <p>Select period:</p>
        <div class="period-btns">
          <button @click="selectReportPeriod('weekly')">Last Week</button>
          <button @click="selectReportPeriod('monthly')">Last Month</button>
          <button @click="selectReportPeriod('yearly')">Last Year</button>
        </div>
        <button class="close-btn" @click="showReportDialog = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { plantState } from '../plantState.js';
import { fakeReportData } from '../fakeReportData.js';
import jsPDF from 'jspdf';

const showReportDialog = ref(false);

function selectReportPeriod(period) {
  showReportDialog.value = false;
  generateReport(period);
}

function generateReport(period) {
  const doc = new jsPDF();
  const data = fakeReportData[period];
  let title = 'Energy Production Report - ';
  if (period === 'weekly') title += 'Last Week';
  else if (period === 'monthly') title += 'Last Month';
  else title += 'Last Year';

  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 18);

  // Summary
  doc.setFontSize(12);
  const totalPower = data.reduce((sum, d) => sum + parseFloat(d.power), 0).toFixed(2);
  const totalCO2 = data.reduce((sum, d) => sum + parseFloat(d.co2), 0).toFixed(2);
  doc.text(`Total Power: ${totalPower} GW`, 14, 32);
  doc.text(`Total CO₂: ${totalCO2} t`, 14, 40);

  // Table header
  doc.setFontSize(12);
  doc.text('Date', 14, 54);
  doc.text('Power (GW)', 54, 54);
  doc.text('CO₂ (t)', 114, 54);
  doc.setLineWidth(0.5);
  doc.line(14, 56, 180, 56);

  // Table rows
  let y = 62;
  data.forEach(row => {
    doc.text(String(row.date), 14, y);
    doc.text(String(row.power), 54, y);
    doc.text(String(row.co2), 114, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save('energy_report.pdf');
}

const totalPower = computed(() => plantState.totalPower);
const avgEfficiency = computed(() => {
  const onMotors = plantState.motors.filter(m => m.status === 'On');
  if (!onMotors.length) return 0;
  return onMotors.reduce((sum, m) => sum + m.efficiency, 0) / onMotors.length;
});
const formattedUptime = computed(() => {
  const hours = Math.floor(plantState.uptime);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
});
</script>

<style scoped>
/* Light mode styles */
.report-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5em;
}
.get-report-btn {
  background: #fff;
  color: #111;
  border: 1px solid #222;
  border-radius: 6px;
  padding: 10px 22px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.get-report-btn:hover {
  background: #f0f0f0;
  color: #000;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  padding: 32px 28px 20px 28px;
  border-radius: 12px;
  min-width: 320px;
  box-shadow: 0 4px 24px #bbb;
  text-align: center;
  border: 1px solid #e0e0e0;
}
.modal h3 {
  margin-bottom: 12px;
  color: #111;
}
.period-btns {
  display: flex;
  gap: 16px;
  margin: 18px 0 10px 0;
  justify-content: center;
}
.period-btns button {
  background: #fff;
  color: #111;
  border: 1px solid #222;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.period-btns button:hover {
  background: #f0f0f0;
  color: #000;
}
.close-btn {
  margin-top: 10px;
  background: #fff;
  color: #111;
  border: 1px solid #bbb;
  border-radius: 6px;
  padding: 6px 18px;
  font-size: 1rem;
  cursor: pointer;
}
.close-btn:hover {
  background: #f0f0f0;
  color: #000;
}
.dashboard {
  max-width: 900px;
  margin: 0 auto;
}
.metrics {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
}
.metric {
  background: #222;
  border-radius: 8px;
  padding: 18px 28px;
  min-width: 160px;
  text-align: center;
  box-shadow: 0 2px 8px #0002;
}
.metric .label {
  display: block;
  color: #aaa;
  font-size: 15px;
  margin-bottom: 6px;
}
.metric .value {
  font-size: 2rem;
  font-weight: bold;
  color: #00eaff;
}
/* Table and status styles for light mode */
.motors-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 18px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}
.motors-table th, .motors-table td {
  padding: 10px 14px;
  text-align: left;
}
.motors-table th {
  background: #f0f0f0;
  color: #111;
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
}
.motors-table tr:nth-child(even) {
  background: #f9f9f9;
}
.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  display: inline-block;
}
.status.on {
  background: #7be87b;
  color: #111;
}
.status.standby {
  background: #ffe066;
  color: #111;
}
.status.maintenance {
  background: #ff6b6b;
  color: #fff;
}
</style>