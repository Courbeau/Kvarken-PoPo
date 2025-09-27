<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Sustainability Dashboard</h1>
      <p class="subtitle">Real-time energy production and environmental impact monitoring</p>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">🌱</div>
        <div class="metric-content">
          <span class="metric-label">CO₂ Credits</span>
          <span class="metric-value">{{ plantState.co2Credits.toLocaleString(undefined, {maximumFractionDigits: 1}) }} t</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">💨</div>
        <div class="metric-content">
          <span class="metric-label">CO₂ Impact</span>
          <span class="metric-value" :class="plantState.totalCO2Output <= 0 ? 'positive' : 'negative'">
            {{ plantState.totalCO2Output >= 0 ? '+' : '' }}{{ (plantState.totalCO2Output * 3600).toFixed(1) }} kg/h
          </span>
          <span class="metric-sublabel">
            {{ plantState.totalCO2Output <= 0 ? '🌿 Net carbon removal' : '🏭 Net emissions' }}
          </span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📈</div>
        <div class="metric-content">
          <span class="metric-label">Credits Change</span>
          <span class="metric-value" :class="plantState.co2CreditsChange >= 0 ? 'positive' : 'negative'">
            {{ plantState.co2CreditsChange >= 0 ? '+' : '' }}{{ plantState.co2CreditsChange.toFixed(2) }} t/h
          </span>
          <span class="metric-sublabel">
            {{ plantState.co2CreditsChange >= 0 ? '🌿 Clean energy gains' : '🏭 Emission losses' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Historical Graphs Section -->
    <div class="graphs-section">
      <div class="section-header">
        <h2>Historical Performance</h2>
        <div class="period-selector">
          <button 
            v-for="period in ['realtime', 'day', 'week', 'month']" 
            :key="period"
            @click="plantState.chartPeriod = period"
            :class="['period-btn', { active: plantState.chartPeriod === period }]"
          >
            {{ period === 'realtime' ? 'Live' : period.charAt(0).toUpperCase() + period.slice(1) }}
          </button>
        </div>
      </div>
      
      <div class="graphs-container">
        <div class="graph-card">
          <h3>Power Output</h3>
          <div class="chart-info">
            <span class="chart-period">{{ chartPeriodLabel }}</span>
            <span class="chart-value">{{ getCurrentPowerValue() }} MW</span>
          </div>
          <canvas ref="powerChart" width="500" height="200"></canvas>
        </div>
        <div class="graph-card">
          <h3>CO₂ Impact</h3>
          <div class="chart-info">
            <span class="chart-period">{{ chartPeriodLabel }}</span>
            <span class="chart-value" :class="getCurrentCO2Value() <= 0 ? 'positive' : 'negative'">
              {{ getCurrentCO2Value() >= 0 ? '+' : '' }}{{ getCurrentCO2Value().toFixed(1) }} kg/h
            </span>
          </div>
          <canvas ref="co2Chart" width="500" height="200"></canvas>
        </div>
      </div>
    </div>

    <div class="motors-section">
      <div class="section-header">
        <h2>Motor Status Overview</h2>
        <button class="report-btn" @click="showReportDialog = true">
          <span class="btn-icon">📄</span>
          Generate Report
        </button>
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
                <span :class="motor.co2Output <= 0 ? 'positive-co2' : 'negative-co2'">
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

    <!-- Modern Report Modal -->
    <div v-if="showReportDialog" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>📊 Generate Energy Report</h3>
          <button class="close-x" @click="showReportDialog = false">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">Select the time period for your sustainability report:</p>
          <div class="period-options">
            <button class="period-option" @click="selectReportPeriod('weekly')">
              <span class="period-icon">📅</span>
              <span class="period-text">Last Week</span>
            </button>
            <button class="period-option" @click="selectReportPeriod('monthly')">
              <span class="period-icon">📊</span>
              <span class="period-text">Last Month</span>
            </button>
            <button class="period-option" @click="selectReportPeriod('yearly')">
              <span class="period-icon">📈</span>
              <span class="period-text">Last Year</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, onMounted } from 'vue';
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

// Chart drawing functions
const drawChart = (canvas, data, timestamps, label, color, yAxisLabel) => {
  if (!canvas || !data.length) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  if (data.length < 2) return;
  
  // Calculate scales
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = Math.max(maxValue - minValue, 1); // Prevent division by zero
  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Draw background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Draw chart area background
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(padding, padding, chartWidth, chartHeight);
  
  // Draw grid lines and Y-axis labels
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#718096';
  ctx.font = '11px sans-serif';
  
  // Horizontal grid lines (Y-axis)
  for (let i = 0; i <= 5; i++) {
    const y = padding + chartHeight * (i / 5);
    const value = maxValue - (range * (i / 5));
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    
    // Y-axis label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toFixed(1), padding - 10, y);
  }
  
  // Vertical grid lines and X-axis labels
  const timeLabels = getTimeLabels(timestamps, plantState.chartPeriod);
  for (let i = 0; i < timeLabels.length; i++) {
    const x = padding + chartWidth * (i / Math.max(timeLabels.length - 1, 1));
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
    
    // X-axis label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(timeLabels[i], x, height - padding + 10);
  }
  
  // Draw data line
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  
  data.forEach((value, index) => {
    const x = padding + chartWidth * (index / Math.max(data.length - 1, 1));
    const y = height - padding - chartHeight * ((value - minValue) / range);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw data points
  ctx.fillStyle = color;
  data.forEach((value, index) => {
    const x = padding + chartWidth * (index / Math.max(data.length - 1, 1));
    const y = height - padding - chartHeight * ((value - minValue) / range);
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  // Y-axis title
  ctx.save();
  ctx.translate(20, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4a5568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(yAxisLabel, 0, 0);
  ctx.restore();
  
  // X-axis title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#4a5568';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Time', width / 2, height - 20);
};

const getTimeLabels = (timestamps, period) => {
  if (!timestamps.length) return [];
  
  switch (period) {
    case 'realtime':
      // Show last few seconds
      return timestamps.map((_, i) => `${i * 2}s`).slice(-6);
    case 'day':
      // Show hours
      return timestamps.map(t => `${t.getHours()}:00`);
    case 'week':
      // Show day names
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return timestamps.map(t => days[t.getDay()]);
    case 'month':
      // Show dates
      return timestamps.map(t => `${t.getDate()}/${t.getMonth() + 1}`);
    default:
      return [];
  }
};

const updateCharts = () => {
  const chartData = getChartData();
  if (chartData.powerOutput.length > 1) {
    drawChart(
      powerChart.value, 
      chartData.powerOutput,
      chartData.timestamps,
      'Power Output', 
      '#3182ce', 
      'MW'
    );
    drawChart(
      co2Chart.value, 
      chartData.co2Impact,
      chartData.timestamps,
      'CO₂ Impact', 
      chartData.co2Impact[chartData.co2Impact.length - 1] <= 0 ? '#38a169' : '#e53e3e',
      'kg/h'
    );
  }
};

const getChartData = () => {
  switch (plantState.chartPeriod) {
    case 'day':
      return {
        timestamps: plantState.history.day.map(d => d.timestamp),
        powerOutput: plantState.history.day.map(d => d.powerOutput),
        co2Impact: plantState.history.day.map(d => d.co2Impact)
      };
    case 'week':
      return {
        timestamps: plantState.history.week.map(d => d.timestamp),
        powerOutput: plantState.history.week.map(d => d.powerOutput),
        co2Impact: plantState.history.week.map(d => d.co2Impact)
      };
    case 'month':
      return {
        timestamps: plantState.history.month.map(d => d.timestamp),
        powerOutput: plantState.history.month.map(d => d.powerOutput),
        co2Impact: plantState.history.month.map(d => d.co2Impact)
      };
    default: // realtime
      return {
        timestamps: plantState.history.realTime.timestamps,
        powerOutput: plantState.history.realTime.powerOutput,
        co2Impact: plantState.history.realTime.co2Impact
      };
  }
};

const chartPeriodLabel = computed(() => {
  switch (plantState.chartPeriod) {
    case 'day': return 'Last 24 Hours';
    case 'week': return 'Last 7 Days';
    case 'month': return 'Last 30 Days';
    default: return 'Live (2 minutes)';
  }
});

const getCurrentPowerValue = () => {
  const data = getChartData();
  return data.powerOutput.length > 0 ? data.powerOutput[data.powerOutput.length - 1].toFixed(1) : '0.0';
};

const getCurrentCO2Value = () => {
  const data = getChartData();
  return data.co2Impact.length > 0 ? data.co2Impact[data.co2Impact.length - 1] : 0;
};

const powerChart = ref(null);
const co2Chart = ref(null);

// Watch for data changes and update charts
watchEffect(() => {
  updateCharts();
});

onMounted(() => {
  updateCharts();
});
</script>

<style scoped>
/* Modern Dashboard Styling */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.dashboard-header {
  margin-bottom: 40px;
  text-align: center;
}

.dashboard-header h1 {
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

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 32px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.15);
}

.metric-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.metric-content {
  flex: 1;
}

.metric-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.metric-sublabel {
  display: block;
  font-size: 0.75rem;
  color: #a0aec0;
  font-weight: 500;
  margin-top: 4px;
}

.metric-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1.1;
}

.metric-value.positive {
  color: #38a169; /* Green for positive changes */
}

.metric-value.negative {
  color: #e53e3e; /* Red for negative changes */
}

.positive-co2 {
  color: #38a169; /* Green for carbon removal */
  font-weight: 600;
}

.negative-co2 {
  color: #e53e3e; /* Red for carbon emissions */
  font-weight: 600;
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
  transform: translateY(-1px);
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

/* Graphs Section */
.graphs-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.graphs-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.graph-card {
  background: #f7fafc;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.graph-card h3 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  text-align: center;
}

.graph-card canvas {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.period-selector {
  display: flex;
  gap: 8px;
  background: #f7fafc;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.period-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #718096;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.period-btn:hover {
  background: #e2e8f0;
  color: #4a5568;
}

.period-btn.active {
  background: #3182ce;
  color: white;
  box-shadow: 0 2px 4px rgba(49, 130, 206, 0.3);
}

.chart-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.chart-period {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 500;
}

.chart-value {
  font-weight: 600;
  font-size: 1rem;
  color: #2d3748;
}

.chart-value.positive {
  color: #38a169;
}

.chart-value.negative {
  color: #e53e3e;
}

/* Motors Section */
.motors-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
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

.report-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.report-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
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

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90vw;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 0 32px;
}

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.close-x {
  background: none;
  border: none;
  font-size: 2rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-x:hover {
  background: #f7fafc;
  color: #4a5568;
}

.modal-body {
  padding: 24px 32px 32px 32px;
}

.modal-description {
  color: #718096;
  font-size: 1rem;
  margin-bottom: 24px;
}

.period-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-option {
  background: #f7fafc;
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 20px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  font-weight: 600;
  color: #4a5568;
}

.period-option:hover {
  background: #edf2f7;
  border-color: #667eea;
  transform: translateY(-2px);
}

.period-icon {
  font-size: 1.5rem;
}

.period-text {
  font-size: 1.1rem;
}
</style>