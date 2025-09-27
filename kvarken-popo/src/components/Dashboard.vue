<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div class="header-content">
        <div class="title-section">
          <h1>Sustainability Dashboard</h1>
          <p class="subtitle">Real-time energy production and environmental impact monitoring</p>
        </div>
      </div>
    </div>
    
    <!-- Region selector moved to sidebar - compliance metrics removed for cleaner interface -->

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
        <div class="header-controls">
          <div class="period-selector">
            <button 
              v-for="period in ['realtime', 'day', 'week', 'month']" 
              :key="period"
              @click="chartPeriod = period"
              :class="['period-btn', { active: chartPeriod === period }]"
            >
              {{ period === 'realtime' ? 'Live' : period.charAt(0).toUpperCase() + period.slice(1) }}
            </button>
          </div>
          <button class="report-btn" @click="showReportDialog = true">
            <span class="btn-icon">📄</span>
            Generate Report
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

      <!-- Energy Forecasting & Fuel Optimization Section -->
      <!-- 
        This section provides energy demand forecasting and fuel optimization capabilities.
        Features:
        - Adjustable fuel prices (Hydrogen, Methane) and carbon credit pricing
        - Demand control sliders for base demand and peak demand scenarios  
        - Two optimization scenarios: Balanced Production vs Clean Energy Focus
        - Static forecast charts that update only when Run Optimizer is clicked
        - Profit-based dispatch optimization with marginal cost calculations
        - Carbon credit calculations (Hydrogen gets credits vs Methane baseline)
        - Real-time KPI updates showing energy, costs, emissions, and net margins
      -->
      <div class="energy-forecast-section">
        <div class="section-header">
          <h2>Energy Forecast & Fuel Optimization</h2>
          <div class="forecast-controls">
            <select v-model="forecastHorizon" class="forecast-select">
              <option value="24">24 hours</option>
              <option value="168">7 days</option>
            </select>
          </div>
        </div>
        
        <!-- Price and Demand Control Sliders -->
        <div class="price-controls-section">
          <h3>Market & Fuel Controls</h3>
          <div class="sliders-grid">
            <div class="slider-control">
              <label for="hydrogenPrice">Hydrogen Price: €{{ hydrogenPrice.toFixed(1) }}/kg</label>
              <input type="range" id="hydrogenPrice" v-model.number="hydrogenPrice" 
                     min="2" max="15" step="0.5" class="price-slider hydrogen">
              <div class="slider-labels">
                <span>€2</span>
                <span>€15</span>
              </div>
            </div>
            
            <div class="slider-control">
              <label for="methanePrice">Methane Price: €{{ methanePrice.toFixed(1) }}/kg</label>
              <input type="range" id="methanePrice" v-model.number="methanePrice" 
                     min="0.3" max="2.5" step="0.1" class="price-slider methane">
              <div class="slider-labels">
                <span>€0.3</span>
                <span>€2.5</span>
              </div>
            </div>
            
            <div class="slider-control">
              <label for="carbonCreditPrice">Carbon Credit Price: €{{ carbonCreditPrice }}/tCO₂</label>
              <input type="range" id="carbonCreditPrice" v-model.number="carbonCreditPrice" 
                     min="10" max="150" step="5" class="price-slider carbon">
              <div class="slider-labels">
                <span>€10</span>
                <span>€150</span>
              </div>
            </div>
            
            <div class="slider-control">
              <label for="marketDemandMultiplier">Market Demand Level: {{ (marketDemandMultiplier * 100).toFixed(0) }}%</label>
              <input type="range" id="marketDemandMultiplier" v-model.number="marketDemandMultiplier" 
                     min="0.6" max="1.4" step="0.05" class="price-slider demand">
              <div class="slider-labels">
                <span>60% (Low)</span>
                <span>140% (High)</span>
              </div>
            </div>
          </div>
        </div>      <div class="forecast-scenarios">
        <div class="scenario-card" :class="{ active: activeScenario === 'balanced' }" 
             @click="switchScenario('balanced')">
          <div class="scenario-header">
            <span class="scenario-icon">⚖️</span>
            <div class="scenario-info">
              <h3>Balanced Production</h3>
              <p>Hydrogen + Methane optimal dispatch</p>
            </div>
          </div>
        </div>
        <div class="scenario-card" :class="{ active: activeScenario === 'clean' }" 
             @click="switchScenario('clean')">
          <div class="scenario-header">
            <span class="scenario-icon">🌿</span>
            <div class="scenario-info">
              <h3>Clean Energy Focus</h3>
              <p>Hydrogen priority + maximum credits</p>
            </div>
          </div>
        </div>
      </div>

      <div class="forecast-charts">
        <div class="forecast-chart-card">
          <div class="chart-header">
            <h3>Electricity Market & Demand</h3>
            <span class="chart-period">{{ forecastPeriodLabel }}</span>
          </div>
          <div class="chart-container">
            <canvas ref="demandForecastChart" width="400" height="200"></canvas>
          </div>
          <div class="chart-explanation">
            <p><strong>Blue Line:</strong> Energy demand (MW) - when customers need power</p>
            <p><strong>Orange Line:</strong> Electricity selling price (€/MWh) - market rates</p>
          </div>
        </div>
        <div class="forecast-chart-card">
          <div class="chart-header">
            <h3>Power Plant Fuel Strategy</h3>
            <span class="chart-period">{{ forecastPeriodLabel }}</span>
          </div>
          <div class="chart-container">
            <canvas ref="dispatchForecastChart" width="400" height="200"></canvas>
          </div>
          <div class="chart-explanation">
            <p><strong>Green Bars:</strong> Clean hydrogen power generation (MW)</p>
            <p><strong>Orange Bars:</strong> Methane backup power generation (MW)</p>
          </div>
        </div>
      </div>

      <div class="forecast-kpis">
        <div class="forecast-kpi-grid">
          <div class="forecast-kpi-card">
            <div class="forecast-kpi-header">
              <span class="kpi-icon">⚡</span>
              <h3>Energy & Revenue</h3>
            </div>
            <div class="kpi-values">
              <div class="kpi-item">
                <span class="kpi-label">Energy Generated</span>
                <span class="kpi-value">{{ forecastResults.energy }} MWh</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Power Revenue</span>
                <span class="kpi-value">€{{ forecastResults.revenue.toLocaleString() }}</span>
              </div>
            </div>
          </div>
          
          <div class="forecast-kpi-card">
            <div class="forecast-kpi-header">
              <span class="kpi-icon">💰</span>
              <h3>Costs & Credits</h3>
            </div>
            <div class="kpi-values">
              <div class="kpi-item">
                <span class="kpi-label">Fuel Cost</span>
                <span class="kpi-value">€{{ forecastResults.fuelCost.toLocaleString() }}</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Carbon Credits</span>
                <span class="kpi-value positive">€{{ forecastResults.credits.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <div class="forecast-kpi-card">
            <div class="forecast-kpi-header">
              <span class="kpi-icon">🏭</span>
              <h3>Emissions & Margin</h3>
            </div>
            <div class="kpi-values">
              <div class="kpi-item">
                <span class="kpi-label">CO₂ Emissions</span>
                <span class="kpi-value">{{ forecastResults.emissions }} tCO₂</span>
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Net Margin</span>
                <span class="kpi-value" :class="forecastResults.netMargin >= 0 ? 'positive' : 'negative'">
                  €{{ forecastResults.netMargin.toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Professional Report Modal -->
    <div v-if="showReportDialog" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">
            <div class="modal-icon">📊</div>
            <h3>Generate Sustainability Compliance Report</h3>
          </div>
          <button class="close-x" @click="showReportDialog = false">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-intro">
            <p class="modal-description">Generate a comprehensive sustainability and regulatory compliance report for the selected period.</p>
            <div class="compliance-badge" :class="complianceStatusClass">
              <span class="badge-icon">{{ complianceStatus.includes('Compliant') || complianceStatus.includes('Meeting') || complianceStatus.includes('Sufficient') ? '✅' : '⚠️' }}</span>
              <span class="badge-text">{{ complianceStatus }}</span>
            </div>
          </div>
          
          <div class="period-selection">
            <h4>Select Reporting Period:</h4>
            <div class="period-options">
              <button class="period-option weekly" @click="selectReportPeriod('weekly')">
                <div class="period-header">
                  <span class="period-icon">📅</span>
                  <span class="period-title">Weekly Report</span>
                </div>
                <div class="period-details">
                  <span class="period-scope">Last 7 days</span>
                  <span class="period-info">• Operational metrics<br>• Daily compliance tracking</span>
                </div>
              </button>
              
              <button class="period-option monthly" @click="selectReportPeriod('monthly')">
                <div class="period-header">
                  <span class="period-icon">📊</span>
                  <span class="period-title">Monthly Report</span>
                </div>
                <div class="period-details">
                  <span class="period-scope">Last 30 days</span>
                  <span class="period-info">• Regulatory filing<br>• Emissions summary</span>
                </div>
              </button>
              
              <button class="period-option yearly" @click="selectReportPeriod('yearly')">
                <div class="period-header">
                  <span class="period-icon">📈</span>
                  <span class="period-title">Annual Report</span>
                </div>
                <div class="period-details">
                  <span class="period-scope">Last 12 months</span>
                  <span class="period-info">• Full audit compliance<br>• ESG documentation</span>
                </div>
              </button>
            </div>
          </div>
          
          <div class="modal-footer-info">
            <div class="report-features">
              <span class="feature-item">🔒 Certified Data</span>
              <span class="feature-item">📋 Regulatory Compliance</span>
              <span class="feature-item">🌍 {{ getRegionFullName() }} Standards</span>
            </div>
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
import Chart from 'chart.js/auto';

const showReportDialog = ref(false);
const chartPeriod = ref('realtime');

// Watch for changes in chartPeriod and update plantState
watchEffect(() => {
  plantState.chartPeriod = chartPeriod.value;
});

// Enhanced computed properties for professional reporting
const complianceStatus = computed(() => {
  switch (plantState.region) {
    case 'EU':
      return plantState.regulatory.euAllowances.remaining > 50 ? 'Compliant' : 'Action Required';
    case 'China':
      return plantState.regulatory.efficiency.extraAllowancesRequired === 0 ? 'Compliant' : 'Below Benchmark';
    case 'US':
      return plantState.regulatory.carbonCredits.remaining > 100 ? 'Compliant' : 'Low Credits';
    default:
      return 'Unknown';
  }
});

const avgEfficiency = computed(() => {
  const activeMotors = plantState.motors.filter(m => m.status === 'On');
  if (activeMotors.length === 0) return 0;
  return activeMotors.reduce((sum, m) => sum + m.efficiency, 0) / activeMotors.length;
});

const hasCleanEnergyMajority = computed(() => {
  const totalPower = plantState.motors.reduce((sum, m) => sum + m.power, 0);
  const cleanPower = plantState.motors
    .filter(m => m.fuel === 'Hydrogen' || m.fuel === 'Ammonia')
    .reduce((sum, m) => sum + m.power, 0);
  return cleanPower > totalPower * 0.5;
});

const isCapAndTradeState = computed(() => {
  // Simulate cap-and-trade participation based on region
  return plantState.region === 'US' && Math.random() > 0.5;
});

// Helper functions for enhanced reporting
function getRegionFullName() {
  switch (plantState.region) {
    case 'EU': return 'European Union';
    case 'US': return 'United States';
    case 'China': return 'People\'s Republic of China';
    default: return plantState.region;
  }
}

function getApplicableStandards() {
  const standards = ['ISO 14064-1', 'GHG Protocol'];
  switch (plantState.region) {
    case 'EU': 
      standards.push('EU ETS Directive 2003/87/EC', 'MRR 2018/2066');
      break;
    case 'China': 
      standards.push('National ETS', 'GB/T 32150-2015');
      break;
    case 'US': 
      standards.push('EPA Part 98', 'TCFD Guidelines');
      break;
  }
  return standards.join(', ');
}

function selectReportPeriod(period) {
  showReportDialog.value = false;
  generateRegionalReport(period);
}

function generateRegionalReport(period) {
  const doc = new jsPDF();
  const data = fakeReportData[period];
  
  // Get region-specific title and requirements
  const regionInfo = getRegionReportInfo();
  
  // Add professional header with logo space and colors
  addReportHeader(doc, regionInfo, period);
  
  // Add executive summary
  const summaryEndY = addExecutiveSummary(doc, data, 70);
  
  // Add region-specific compliance sections
  let yPos = summaryEndY + 10;
  switch (plantState.region) {
    case 'EU':
      yPos = generateEUComplianceReport(doc, yPos);
      break;
    case 'China':
      yPos = generateChinaComplianceReport(doc, yPos);
      break;
    case 'US':
      yPos = generateUSComplianceReport(doc, yPos);
      break;
  }
  
  // Add detailed operational data
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  generateDetailedDataSection(doc, data, yPos);
  
  // Add compliance certification footer
  addComplianceCertification(doc);
  
  // Save with professional filename
  const timestamp = new Date().toISOString().split('T')[0];
  const facilityCode = `KVK-${plantState.region}-001`;
  const filename = `${facilityCode}_Sustainability_Report_${period}_${timestamp}.pdf`;
  
  doc.save(filename);
}

function addReportHeader(doc, regionInfo, period) {
  // Professional gradient header background
  doc.setFillColor(8, 47, 73); // Deep navy
  doc.rect(0, 0, 210, 35, 'F');
  
  // Accent stripe
  doc.setFillColor(28, 164, 94); // Professional green
  doc.rect(0, 35, 210, 3, 'F');
  
  // Company logo placeholder - professional circle
  doc.setFillColor(255, 255, 255);
  doc.circle(25, 18, 8, 'F');
  doc.setFillColor(28, 164, 94);
  doc.circle(25, 18, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('KVK', 21, 21);
  
  // Title with professional typography
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(regionInfo.title, 40, 16);
  
  // Subtitle with refined spacing
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(regionInfo.subtitle, 40, 24);
  
  // Professional metadata aligned right
  doc.setFontSize(9);
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  doc.text(`Report Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 40, 30);
  doc.text(`Generated: ${reportDate}`, 155, 16);
  doc.text(`Version: 2.1`, 155, 24);
  doc.text(`Status: FINAL`, 155, 30);
  
  // Reset text color
  doc.setTextColor(45, 55, 72);
  
  // Enhanced facility information card
  doc.setFillColor(247, 250, 252);
  doc.setDrawColor(203, 213, 224);
  doc.rect(14, 45, 182, 18, 'FD');
  
  // Facility details with icons
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(45, 55, 72);
  doc.text('[PLANT]', 18, 52);
  doc.text(`KVARKEN ENERGY SOLUTIONS - Installation ${plantState.region}-001`, 34, 52);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text('[PWR]', 18, 58);
  doc.text(`Capacity: ${plantState.plantCapacity} MW`, 34, 58);
  doc.text('[REGION]', 85, 58);
  doc.text(`Region: ${getRegionFullName()}`, 105, 58);
  doc.text('[STATUS]', 145, 58);
  doc.text(`Compliance: ${complianceStatus.value}`, 165, 58);
  
  // Add sustainability badge
  if (hasCleanEnergyMajority.value) {
    doc.setFillColor(34, 197, 94);
    doc.rect(170, 48, 22, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('CLEAN ENERGY', 171, 53);
  }
}

function addExecutiveSummary(doc, data, yPos) {
  // Executive Summary with professional design
  doc.setTextColor(45, 55, 72);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(16);
  doc.text('EXECUTIVE SUMMARY', 14, yPos);
  
  // Add summary section divider
  doc.setDrawColor(28, 164, 94);
  doc.setLineWidth(0.8);
  doc.line(14, yPos + 2, 60, yPos + 2);
  
  // Key metrics cards layout
  const cardWidth = 88;
  const cardHeight = 32;
  const cardSpacing = 6;
  
  // Card 1 - Energy Performance
  doc.setFillColor(247, 254, 231); // Light green
  doc.setDrawColor(132, 204, 22);
  doc.rect(14, yPos + 8, cardWidth, cardHeight, 'FD');
  
  doc.setFillColor(132, 204, 22);
  doc.circle(22, yPos + 16, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('PWR', 19, yPos + 19);
  
  doc.setTextColor(45, 55, 72);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('ENERGY PERFORMANCE', 28, yPos + 16);
  
  const totalPower = data.reduce((sum, d) => sum + parseFloat(d.power), 0);
  const avgPower = (totalPower / data.length).toFixed(2);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`Total Generated: ${totalPower.toFixed(1)} MWh`, 28, yPos + 23);
  doc.text(`Average Output: ${avgPower} MW`, 28, yPos + 29);
  doc.text(`Plant Efficiency: ${avgEfficiency.value.toFixed(1)}%`, 28, yPos + 35);
  
  // Card 2 - Emissions Impact
  const co2Impact = plantState.totalCO2Output * 3600 * 24 * data.length / 1000;
  const isPositiveImpact = co2Impact <= 0;
  
  doc.setFillColor(isPositiveImpact ? 236 : 254, isPositiveImpact ? 253 : 242, isPositiveImpact ? 245 : 242);
  doc.setDrawColor(isPositiveImpact ? 5 : 251, isPositiveImpact ? 150 : 146, isPositiveImpact ? 105 : 60);
  doc.rect(14 + cardWidth + cardSpacing, yPos + 8, cardWidth, cardHeight, 'FD');
  
  doc.setFillColor(isPositiveImpact ? 5 : 251, isPositiveImpact ? 150 : 146, isPositiveImpact ? 105 : 60);
  doc.circle(22 + cardWidth + cardSpacing, yPos + 16, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(isPositiveImpact ? 'ECO' : 'EMI', 19 + cardWidth + cardSpacing, yPos + 19);
  
  doc.setTextColor(45, 55, 72);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('EMISSIONS IMPACT', 28 + cardWidth + cardSpacing, yPos + 16);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`CO2 Impact: ${Math.abs(co2Impact).toFixed(2)} tonnes`, 28 + cardWidth + cardSpacing, yPos + 23);
  doc.text(`Status: ${isPositiveImpact ? 'Net Removal' : 'Net Emissions'}`, 28 + cardWidth + cardSpacing, yPos + 29);
  
  const co2Intensity = totalPower > 0 ? (Math.abs(co2Impact) / totalPower * 1000).toFixed(1) : '0';
  doc.text(`Intensity: ${co2Intensity} kg/MWh`, 28 + cardWidth + cardSpacing, yPos + 35);
  
  // Compliance status banner
  const complianceY = yPos + 50;
  const isCompliant = complianceStatus.value === 'Compliant';
  
  doc.setFillColor(isCompliant ? 220 : 255, isCompliant ? 252 : 237, isCompliant ? 231 : 213);
  doc.setDrawColor(isCompliant ? 34 : 234, isCompliant ? 197 : 179, isCompliant ? 94 : 22);
  doc.rect(14, complianceY, 182, 12, 'FD');
  
  doc.setTextColor(isCompliant ? 21 : 146, isCompliant ? 128 : 64, isCompliant ? 61 : 22);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text(`${isCompliant ? '[OK]' : '[!]'} REGULATORY COMPLIANCE STATUS: ${complianceStatus.value.toUpperCase()}`, 16, complianceY + 7);
  
  return complianceY + 20;
}

function generateEUComplianceReport(doc, yPos) {
  // EU ETS Compliance Section
  doc.setFillColor(0, 100, 0);
  doc.rect(14, yPos, 4, 60, 'F');
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('EU EMISSIONS TRADING SYSTEM (ETS) COMPLIANCE', 20, yPos + 8);
  
  // Regulation reference
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Reference: Directive 2003/87/EC (EU ETS Directive) & Commission Regulation (EU) 2018/2066', 20, yPos + 15);
  doc.setTextColor(0, 0, 0);
  
  // EUA Status Box
  doc.setFillColor(240, 255, 240);
  doc.rect(20, yPos + 20, 170, 35, 'F');
  doc.setDrawColor(0, 150, 0);
  doc.rect(20, yPos + 20, 170, 35);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('EUROPEAN UNION ALLOWANCES (EUA) STATUS', 22, yPos + 28);
  
  doc.setFont(undefined, 'normal');
  doc.text(`EUAs in Registry: ${plantState.regulatory.euAllowances.remaining.toFixed(0)} allowances`, 22, yPos + 36);
  doc.text(`EUAs Surrendered (Current Period): ${plantState.regulatory.euAllowances.surrendered.toFixed(1)} allowances`, 22, yPos + 43);
  doc.text(`Verified Emissions: ${(Math.abs(plantState.totalCO2Output * 3600 * 24 * 30 / 1000)).toFixed(2)} tonnes CO2/month`, 22, yPos + 50);
  
  // Compliance statement
  const isEUCompliant = plantState.regulatory.euAllowances.remaining > 50;
  doc.setFillColor(isEUCompliant ? 240 : 255, 255, isEUCompliant ? 240 : 240);
  doc.rect(20, yPos + 60, 170, 15, 'F');
  doc.setFont(undefined, 'bold');
  doc.text(isEUCompliant ? '[OK] COMPLIANT: Sufficient allowances for current emissions' : 
           '[!] ACTION REQUIRED: Additional allowances needed', 22, yPos + 68);
  
  // Installation details
  yPos += 80;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('INSTALLATION VERIFICATION DATA', 20, yPos);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  yPos += 8;
  
  plantState.motors.forEach((motor, index) => {
    if (motor.status === 'On') {
      doc.text(`Unit ${motor.id}: ${motor.fuel} - Power: ${motor.power.toFixed(2)} MW - Efficiency: ${motor.efficiency}%`, 20, yPos);
      doc.text(`Fuel Consumption: ${motor.fuelConsumption.toFixed(1)} kg/h - CO2 Rate: ${(motor.co2Output * 3600).toFixed(1)} kg/h`, 25, yPos + 5);
      yPos += 12;
    }
  });
  
  if (plantState.plantCapacity < 20) {
    doc.setFillColor(245, 245, 255);
    doc.rect(20, yPos, 170, 12, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('SMALL INSTALLATION NOTIFICATION: Voluntary Carbon Neutrality Report Included', 22, yPos + 7);
    yPos += 15;
  }
  
  return yPos;
}

function generateChinaComplianceReport(doc, yPos) {
  // China National ETS Section
  doc.setFillColor(220, 20, 60);
  doc.rect(14, yPos, 4, 70, 'F');
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('CHINA NATIONAL ETS COMPLIANCE', 20, yPos + 8);
  
  // Regulation reference
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Reference: National ETS Regulations (2021) & Provincial Implementation Guidelines', 20, yPos + 15);
  doc.setTextColor(0, 0, 0);
  
  // Intensity Benchmark Box
  const meetsBenchmark = plantState.regulatory.efficiency.extraAllowancesRequired === 0;
  doc.setFillColor(meetsBenchmark ? 240 : 255, 255, meetsBenchmark ? 240 : 240);
  doc.rect(20, yPos + 20, 170, 35, 'F');
  doc.setDrawColor(meetsBenchmark ? 0 : 200, meetsBenchmark ? 150 : 50, 0);
  doc.rect(20, yPos + 20, 170, 35);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('CARBON INTENSITY ASSESSMENT', 22, yPos + 28);
  
  doc.setFont(undefined, 'normal');
  doc.text(`Current CO2 Intensity: ${Math.abs(plantState.regulatory.co2EmissionsPerMWh).toFixed(1)} kg CO2/MWh`, 22, yPos + 36);
  doc.text(`National Benchmark: ${plantState.regulatory.efficiency.benchmark} kg CO2/MWh`, 22, yPos + 43);
  doc.text(`Performance Gap: ${(plantState.regulatory.efficiency.actual - plantState.regulatory.efficiency.benchmark).toFixed(1)} kg CO2/MWh`, 22, yPos + 50);
  
  // Compliance statement
  doc.setFont(undefined, 'bold');
  if (meetsBenchmark) {
    doc.text('[OK] BENCHMARK ACHIEVED: No additional allowances required', 22, yPos + 60);
  } else {
    doc.text(`[!] BELOW BENCHMARK: ${plantState.regulatory.efficiency.extraAllowancesRequired.toFixed(2)} tonnes/h additional allowances required`, 22, yPos + 60);
  }
  
  // CCER Offset Section
  yPos += 70;
  doc.setFillColor(245, 255, 245);
  doc.rect(20, yPos, 170, 20, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('CHINESE CERTIFIED EMISSION REDUCTIONS (CCER)', 22, yPos + 7);
  doc.setFont(undefined, 'normal');
  doc.text(`CCER Offsets Applied: ${plantState.regulatory.ccerOffsets} tonnes CO2 (Within 5% limit)`, 22, yPos + 14);
  
  // Provincial verification
  yPos += 25;
  doc.setFont(undefined, 'bold');
  doc.text('PROVINCIAL AUTHORITY VERIFICATION', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(`Verification Status: ${plantState.regulatory.verificationStatus}`, 20, yPos + 7);
  doc.text(`Last Audit Date: ${plantState.regulatory.lastAuditDate.toLocaleDateString('zh-CN')}`, 20, yPos + 14);
  
  return yPos + 20;
}

function generateUSComplianceReport(doc, yPos) {
  // US Carbon Reporting Section
  doc.setFillColor(0, 50, 150);
  doc.rect(14, yPos, 4, 70, 'F');
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text('UNITED STATES CARBON EMISSIONS COMPLIANCE', 20, yPos + 8);
  
  // Regulation reference
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Reference: EPA Clean Air Act, RGGI Model Rule & California Cap-and-Trade Regulation', 20, yPos + 15);
  doc.setTextColor(0, 0, 0);
  
  // Emissions Summary
  doc.setFillColor(240, 248, 255);
  doc.rect(20, yPos + 20, 170, 35, 'F');
  doc.setDrawColor(0, 100, 200);
  doc.rect(20, yPos + 20, 170, 35);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('FACILITY EMISSIONS SUMMARY', 22, yPos + 28);
  
  doc.setFont(undefined, 'normal');
  const dailyEmissions = (Math.abs(plantState.totalCO2Output * 3600 * 24) / 1000);
  const annualEmissions = dailyEmissions * 365;
  doc.text(`Daily CO2 Emissions: ${dailyEmissions.toFixed(2)} tonnes CO2/day`, 22, yPos + 36);
  doc.text(`Projected Annual Emissions: ${annualEmissions.toFixed(0)} tonnes CO2/year`, 22, yPos + 43);
  doc.text(`Power Generation Output: ${plantState.totalPower.toFixed(2)} MW (${(plantState.totalPower * 24).toFixed(1)} MWh/day)`, 22, yPos + 50);
  
  // Cap-and-trade vs voluntary
  yPos += 60;
  if (isCapAndTradeState.value) {
    // Cap-and-trade compliance
    doc.setFillColor(255, 248, 240);
    doc.rect(20, yPos, 170, 30, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('CAP-AND-TRADE PROGRAM COMPLIANCE', 22, yPos + 8);
    
    doc.setFont(undefined, 'normal');
    doc.text(`Carbon Credits in Account: ${plantState.regulatory.carbonCredits.remaining.toFixed(0)} credits`, 22, yPos + 16);
    doc.text(`Credits Surrendered (Current Period): ${plantState.regulatory.carbonCredits.surrendered.toFixed(1)} credits`, 22, yPos + 23);
    
    const creditSufficient = plantState.regulatory.carbonCredits.remaining > 100;
    doc.setFont(undefined, 'bold');
    doc.text(creditSufficient ? '[OK] COMPLIANT: Sufficient credits for current emissions' : 
             '[!] LOW CREDITS: Additional credits recommended', 22, yPos + 30);
    yPos += 35;
  } else {
    // Voluntary reporting
    doc.setFillColor(248, 255, 248);
    doc.rect(20, yPos, 170, 25, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('VOLUNTARY ESG SUSTAINABILITY REPORTING', 22, yPos + 8);
    
    doc.setFont(undefined, 'normal');
    doc.text('* Participating in voluntary carbon credit markets', 22, yPos + 16);
    doc.text('* Environmental, Social & Governance (ESG) metrics included', 22, yPos + 23);
    yPos += 30;
  }
  
  // EPA reporting requirements
  doc.setFont(undefined, 'bold');
  doc.text('EPA MANDATORY GHG REPORTING (40 CFR Part 98)', 20, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(`Facility qualifies for: ${annualEmissions > 25000 ? 'Mandatory reporting (>25,000 tonnes CO2e/year)' : 'Voluntary reporting'}`, 20, yPos + 7);
  
  return yPos + 15;
}

function generateDetailedDataSection(doc, data, yPos) {
  // Professional section header
  doc.setTextColor(45, 55, 72);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(16);
  doc.text('DETAILED OPERATIONAL DATA', 14, yPos);
  
  // Add section divider
  doc.setDrawColor(28, 164, 94);
  doc.setLineWidth(0.8);
  doc.line(14, yPos + 2, 70, yPos + 2);
  
  // Add data visualization summary
  yPos += 12;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 224);
  doc.rect(14, yPos, 182, 20, 'FD');
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('[METRICS] PERFORMANCE METRICS OVERVIEW', 16, yPos + 7);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const dataPoints = data.length;
  const maxPower = Math.max(...data.map(d => parseFloat(d.power)));
  const minPower = Math.min(...data.map(d => parseFloat(d.power)));
  
  doc.text(`Data Points: ${dataPoints} | Max Power: ${maxPower.toFixed(2)} MW | Min Power: ${minPower.toFixed(2)} MW`, 16, yPos + 14);
  
  yPos += 28;
  
  // Enhanced data table with professional formatting
  const tableStartY = yPos;
  
  // Table header with gradient effect
  doc.setFillColor(8, 47, 73);
  doc.rect(14, yPos, 182, 10, 'F');
  
  // Column headers
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  
  const columnHeaders = [
    { text: 'DATE', x: 18 },
    { text: 'POWER (MW)', x: 50 },
    { text: 'ENERGY (MWh)', x: 80 },
    { text: 'CO2 IMPACT (t)', x: 115 },
    { text: 'EFFICIENCY (%)', x: 150 },
    { text: 'STATUS', x: 175 }
  ];
  
  columnHeaders.forEach(col => {
    doc.text(col.text, col.x, yPos + 6);
  });
  
  yPos += 10;
  
  // Data rows with enhanced formatting
  doc.setTextColor(45, 55, 72);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  
  data.slice(0, 22).forEach((row, index) => {
    if (yPos > 270) return; // Prevent page overflow
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, yPos, 182, 7, 'F');
    }
    
    // Status indicator color
    const energyMWh = parseFloat(row.power) * 24;
    const powerValue = parseFloat(row.power);
    const dataAvg = data.reduce((sum, d) => sum + parseFloat(d.power), 0) / data.length;
    const isHighPerformance = powerValue > dataAvg;
    
    // Row data
    const rowData = [
      { text: String(row.date), x: 18 },
      { text: String(row.power), x: 50 },
      { text: energyMWh.toFixed(1), x: 80 },
      { text: String(Math.abs(parseFloat(row.co2)).toFixed(2)), x: 115 },
      { text: `${avgEfficiency.value.toFixed(1)}`, x: 150 },
      { text: isHighPerformance ? 'OPTIMAL' : 'NORMAL', x: 175, color: isHighPerformance ? [34, 197, 94] : [251, 191, 36] }
    ];
    
    rowData.forEach(cell => {
      if (cell.color) {
        doc.setTextColor(...cell.color);
        doc.text(cell.text, cell.x, yPos + 5);
        doc.setTextColor(45, 55, 72);
      } else {
        doc.text(cell.text, cell.x, yPos + 5);
      }
    });
    
    yPos += 7;
  });
  
  // Add mini chart visualization
  if (yPos < 220) {
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('POWER OUTPUT TREND', 14, yPos);
    
    // Simple ASCII-style chart representation
    yPos += 8;
    doc.setFillColor(240, 253, 244);
    doc.rect(14, yPos, 182, 25, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.rect(14, yPos, 182, 25);
    
    // Draw simple trend line
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(2);
    
    const chartWidth = 170;
    const chartHeight = 15;
    const dataSlice = data.slice(-10); // Last 10 points
    const maxVal = Math.max(...dataSlice.map(d => parseFloat(d.power)));
    const minVal = Math.min(...dataSlice.map(d => parseFloat(d.power)));
    
    dataSlice.forEach((point, i) => {
      const x = 18 + (i / (dataSlice.length - 1)) * chartWidth;
      const normalizedValue = (parseFloat(point.power) - minVal) / (maxVal - minVal || 1);
      const y = yPos + 20 - (normalizedValue * chartHeight);
      
      if (i > 0) {
        const prevX = 18 + ((i - 1) / (dataSlice.length - 1)) * chartWidth;
        const prevNormalizedValue = (parseFloat(dataSlice[i - 1].power) - minVal) / (maxVal - minVal || 1);
        const prevY = yPos + 20 - (prevNormalizedValue * chartHeight);
        doc.line(prevX, prevY, x, y);
      }
      
      // Data point marker
      doc.setFillColor(34, 197, 94);
      doc.circle(x, y, 1, 'F');
    });
    
    // Chart labels
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.text(`Min: ${minVal.toFixed(1)} MW`, 18, yPos + 30);
    doc.text(`Max: ${maxVal.toFixed(1)} MW`, 160, yPos + 30);
  }
  
  return yPos + 35;
}

function addComplianceCertification(doc) {
  const pageHeight = doc.internal.pageSize.height;
  let yPos = pageHeight - 50;
  
  // Professional certification section with enhanced design
  doc.setFillColor(8, 47, 73);
  doc.rect(0, yPos - 5, 210, 55, 'F');
  
  // Certification badge/logo
  doc.setFillColor(28, 164, 94);
  doc.circle(25, yPos + 15, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('V', 22, yPos + 19);
  
  // Main certification text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('VERIFIED SUSTAINABILITY REPORT', 40, yPos + 12);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text('This report complies with international environmental reporting standards', 40, yPos + 20);
  doc.text('including ISO 14064, GHG Protocol, and regional regulatory requirements.', 40, yPos + 27);
  
  // Certification details box
  doc.setFillColor(247, 250, 252);
  doc.setTextColor(45, 55, 72);
  doc.rect(14, yPos + 32, 182, 15, 'F');
  
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  const reportId = `KVK-${plantState.region}-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const verificationCode = `VER-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  
  doc.text(`Report ID: ${reportId}`, 16, yPos + 37);
  doc.text(`Verification Code: ${verificationCode}`, 16, yPos + 42);
  
  doc.text(`Generated: ${new Date().toLocaleString('en-US', { 
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })}`, 90, yPos + 37);
  
  doc.text(`Next Review: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US')}`, 90, yPos + 42);
  
  // Digital signature and QR code placeholder
  doc.setDrawColor(45, 55, 72);
  doc.setLineWidth(1);
  doc.rect(160, yPos + 34, 18, 12);
  
  doc.setFontSize(6);
  doc.setFont(undefined, 'normal');
  doc.text('DIGITAL', 163, yPos + 38);
  doc.text('VERIFICATION', 161, yPos + 41);
  doc.text('QR CODE', 164, yPos + 44);
  
  // Compliance standards footer
  yPos += 48;
  doc.setFillColor(203, 213, 224);
  doc.rect(0, yPos - 2, 210, 12, 'F');
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  
  const standards = getApplicableStandards();
  doc.text(`Compliance Standards: ${standards}`, 14, yPos + 4);
}

function getRegionReportInfo() {
  switch (plantState.region) {
    case 'EU':
      return {
        title: 'EU ETS COMPLIANCE REPORT',
        subtitle: 'European Union Emissions Trading System - Installation Monitoring Report'
      };
    case 'China':
      return {
        title: 'CHINA NATIONAL ETS REPORT',
        subtitle: 'National Emissions Trading System - Carbon Emissions Verification Report'
      };
    case 'US':
      return {
        title: 'US GHG EMISSIONS REPORT',
        subtitle: 'EPA Mandatory Greenhouse Gas Reporting & State Compliance Documentation'
      };
    default:
      return { title: 'ENERGY COMPLIANCE REPORT', subtitle: 'International Standards Compliance' };
  }
}

const totalPower = computed(() => plantState.totalPower);
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
  const timeLabels = getTimeLabels(timestamps, chartPeriod.value);
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
  switch (chartPeriod.value) {
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
  switch (chartPeriod.value) {
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

const getCO2Class = (co2Output) => {
  const hourlyOutput = co2Output * 3600; // Convert to kg/h
  if (Math.abs(hourlyOutput) < 0.1) return 'neutral-co2'; // Nearly zero
  return hourlyOutput <= 0 ? 'positive-co2' : 'negative-co2';
};

// Region-specific computed properties
const regionTitle = computed(() => {
  switch (plantState.region) {
    case 'EU': return 'European Union';
    case 'US': return 'United States';
    case 'China': return 'China';
    default: return 'Regional';
  }
});

// Removed duplicate complianceStatus - defined earlier in script

const complianceStatusClass = computed(() => {
  const status = complianceStatus.value;
  if (status.includes('Compliant') || status.includes('Meeting') || status.includes('Sufficient')) {
    return 'compliant';
  }
  return 'non-compliant';
});

// Removed duplicate isCapAndTradeState - defined earlier in script

// ========== Energy Forecasting & Fuel Optimization ==========
// Static forecasting tool with manual optimization runs
// Does not sync with real-time plant data to avoid constant updates
const forecastHorizon = ref(24);
const activeScenario = ref('balanced');
const demandForecastChart = ref(null);
const dispatchForecastChart = ref(null);
let demandChartInstance = null;
let dispatchChartInstance = null;

// Adjustable prices and demand parameters
const hydrogenPrice = ref(6.0);
const methanePrice = ref(0.8);
const carbonCreditPrice = ref(85);
const marketDemandMultiplier = ref(1.0); // Market demand level (0.6 to 1.4)

// Static seed for deterministic patterns (changes only on reroll)
let staticSeed = 12345;
function staticRand() {
  staticSeed = (staticSeed * 9301 + 49297) % 233280;
  return staticSeed / 233280;
}

const forecastResults = ref({
  energy: 0,
  revenue: 0,
  fuelCost: 0,
  credits: 0,
  emissions: 0,
  netMargin: 0,
  hydrogenEnergy: 0,
  methaneEnergy: 0,
  hydrogenFuel: 0,
  methaneFuel: 0,
  hydrogenIntensity: 0,
  methaneIntensity: 0,
  hydrogenMarginalCost: 0,
  methaneMarginalCost: 0
});

const forecastPeriodLabel = computed(() => {
  return forecastHorizon.value === 24 ? '24 Hours' : '7 Days';
});

// Fuel configurations with reactive prices
const fuelConfigs = computed(() => ({
  hydrogen: {
    name: 'Hydrogen',
    price: hydrogenPrice.value, // €/kg - adjustable
    lhv: 120, // MJ/kg
    efficiency: 45, // %
    co2Factor: 0, // kg CO2/MJ - clean fuel
    creditEligible: true
  },
  methane: {
    name: 'Methane', 
    price: methanePrice.value, // €/kg - adjustable
    lhv: 55, // MJ/kg
    efficiency: 52, // %
    co2Factor: 0.049, // kg CO2/MJ - fossil fuel
    creditEligible: false
  }
}));

// Use reactive carbon credit price instead of regional pricing
const carbonPrice = computed(() => carbonCreditPrice.value);

function generateForecastData(hours) {
  const demand = [], price = [], labels = [];
  
  // Reset static seed for consistent generation
  let localSeed = staticSeed;
  function localRand() {
    localSeed = (localSeed * 9301 + 49297) % 233280;
    return localSeed / 233280;
  }
  
  // Base demand from current plant capacity with market multiplier
  const baseDemandMW = (plantState.totalPower || 35) * marketDemandMultiplier.value;
  
  for (let t = 0; t < hours; t++) {
    const dayFrac = (t % 24) / 24;
    const weekFrac = (t % 168) / 168;
    
    // Dynamic demand based on time patterns and market conditions
    const peakVariation = baseDemandMW * 0.4; // 40% variation
    const demandVal = baseDemandMW + 
      peakVariation * Math.sin(2 * Math.PI * dayFrac) + 
      (baseDemandMW * 0.1) * Math.sin(2 * Math.PI * weekFrac) + 
      (localRand() - 0.5) * (baseDemandMW * 0.1);
    
    // Electricity selling price: €100-160 base with market dynamics
    const baseElectricityPrice = 100; // Minimum €100/MWh
    const maxElectricityPrice = 160;  // Maximum €160/MWh during peak
    const priceRange = maxElectricityPrice - baseElectricityPrice;
    
    const priceVal = baseElectricityPrice + 
      priceRange * 0.4 * Math.sin(2 * Math.PI * dayFrac + 0.7) + // Daily pattern
      priceRange * 0.2 * Math.sin(2 * Math.PI * weekFrac + 1.2) + // Weekly pattern  
      priceRange * 0.1 * (localRand() - 0.5) * 2; // Random variation
    
    demand.push(Math.max(0, demandVal));
    price.push(Math.max(baseElectricityPrice, Math.min(maxElectricityPrice, priceVal)));
    labels.push(hours === 24 ? `${t}:00` : `Day ${Math.floor(t/24)+1}`);
  }
  
  return { demand, price, labels };
}

function switchScenario(scenario) {
  activeScenario.value = scenario;
  // Optimization happens automatically via watchEffect
}

function calculateMarginalCost(fuel, pricePerMWh) {
  const kgPerMWh = (3600) / (fuel.lhv * (fuel.efficiency / 100)); // kg fuel per MWh
  const fuelCost = kgPerMWh * fuel.price; // €/MWh
  const directEmissionsKg = kgPerMWh * fuel.lhv * fuel.co2Factor; // kg CO2/MWh
  const carbonCost = (directEmissionsKg / 1000) * carbonPrice.value; // €/MWh
  
  let creditPerMWh = 0;
  if (fuel.creditEligible && fuel.co2Factor === 0) {
    // Hydrogen gets credits vs Methane baseline
    const methaneConfig = fuelConfigs.value.methane;
    const baselineEmissions = (3600 / (methaneConfig.lhv * (methaneConfig.efficiency / 100))) * methaneConfig.lhv * methaneConfig.co2Factor;
    const avoidedEmissions = Math.max(0, baselineEmissions - directEmissionsKg);
    creditPerMWh = (avoidedEmissions / 1000) * carbonPrice.value;
  }
  
  const marginalCost = fuelCost + carbonCost - creditPerMWh;
  return {
    marginalCost,
    fuelCost,
    carbonCost,
    creditPerMWh,
    directEmissionsKg,
    kgPerMWh
  };
}

function optimizeForecast() {
  const hours = forecastHorizon.value;
  const { demand, price, labels } = generateForecastData(hours);
  const capMW = plantState.plantCapacity || 48; // Total plant capacity
  
  const H2 = fuelConfigs.value.hydrogen;
  const CH4 = fuelConfigs.value.methane;
  
  const results = {
    labels, demand, price,
    dispatchH2: [], dispatchCH4: [],
    energy: 0, energyH2: 0, energyCH4: 0,
    fuelKgH2: 0, fuelKgCH4: 0,
    costFuel: 0, costFuelH2: 0, costFuelCH4: 0,
    rev: 0, credits: 0, creditsH2: 0, creditsCH4: 0,
    co2kg: 0, co2kgH2: 0, co2kgCH4: 0,
    h2Costs: calculateMarginalCost(H2, 0),
    ch4Costs: calculateMarginalCost(CH4, 0)
  };
  
  for (let t = 0; t < hours; t++) {
    const p = price[t];
    const demandMW = Math.min(demand[t], capMW);
    
    // Determine scenario and dispatch logic
    let dispatchH2 = 0, dispatchCH4 = 0;
    
    if (activeScenario.value === 'balanced') {
      // Balanced: use both fuels optimally based on marginal cost
      const h2Cost = calculateMarginalCost(H2, p);
      const ch4Cost = calculateMarginalCost(CH4, p);
      
      // Always try to meet demand with cheapest option first
      if (h2Cost.marginalCost <= ch4Cost.marginalCost) {
        dispatchH2 = Math.min(demandMW, capMW * 0.7); // Hydrogen preferred
        dispatchCH4 = Math.min(Math.max(0, demandMW - dispatchH2), capMW * 0.3);
      } else {
        dispatchCH4 = Math.min(demandMW, capMW * 0.5); // Methane backup
        dispatchH2 = Math.min(Math.max(0, demandMW - dispatchCH4), capMW * 0.5);
      }
    } else {
      // Clean focus: maximize hydrogen usage and carbon credits
      const h2Cost = calculateMarginalCost(H2, p);
      
      // Always prioritize hydrogen for clean energy scenario
      dispatchH2 = Math.min(demandMW, capMW * 0.8); // Use up to 80% capacity for hydrogen
      
      // Only use methane if hydrogen can't cover demand and it's profitable
      const remainingDemand = demandMW - dispatchH2;
      if (remainingDemand > 0) {
        const ch4Cost = calculateMarginalCost(CH4, p);
        // Only dispatch methane if absolutely necessary and profitable
        if (p >= ch4Cost.marginalCost) {
          dispatchCH4 = Math.min(remainingDemand, capMW * 0.2);
        }
      }
    }
    
    // Calculate costs and emissions for dispatched power
    if (dispatchH2 > 0) {
      const costs = calculateMarginalCost(H2, p);
      results.energyH2 += dispatchH2;
      results.fuelKgH2 += dispatchH2 * costs.kgPerMWh;
      results.costFuelH2 += dispatchH2 * costs.fuelCost;
      results.creditsH2 += dispatchH2 * costs.creditPerMWh;
      results.co2kgH2 += dispatchH2 * costs.directEmissionsKg;
    }
    
    if (dispatchCH4 > 0) {
      const costs = calculateMarginalCost(CH4, p);
      results.energyCH4 += dispatchCH4;
      results.fuelKgCH4 += dispatchCH4 * costs.kgPerMWh;
      results.costFuelCH4 += dispatchCH4 * costs.fuelCost;
      results.creditsCH4 += dispatchCH4 * costs.creditPerMWh;
      results.co2kgCH4 += dispatchCH4 * costs.directEmissionsKg;
    }
    
    results.dispatchH2.push(dispatchH2);
    results.dispatchCH4.push(dispatchCH4);
    results.energy += (dispatchH2 + dispatchCH4);
    results.rev += (dispatchH2 + dispatchCH4) * p;
  }
  
  // Aggregate results
  results.costFuel = results.costFuelH2 + results.costFuelCH4;
  results.credits = results.creditsH2 + results.creditsCH4;
  results.co2kg = results.co2kgH2 + results.co2kgCH4;
  
  // Update forecast results
  forecastResults.value = {
    energy: Math.round(results.energy),
    revenue: Math.round(results.rev),
    fuelCost: Math.round(results.costFuel),
    credits: Math.round(results.credits),
    emissions: (results.co2kg / 1000).toFixed(2),
    netMargin: Math.round(results.rev - results.costFuel + results.credits),
    hydrogenEnergy: Math.round(results.energyH2),
    methaneEnergy: Math.round(results.energyCH4),
    hydrogenFuel: Math.round(results.fuelKgH2),
    methaneFuel: Math.round(results.fuelKgCH4),
    hydrogenIntensity: results.energyH2 > 0 ? Math.round((results.co2kgH2 / results.energyH2) * 1000) : 0,
    methaneIntensity: results.energyCH4 > 0 ? Math.round((results.co2kgCH4 / results.energyCH4) * 1000) : Math.round((results.ch4Costs.directEmissionsKg) * 1000),
    hydrogenMarginalCost: results.h2Costs.marginalCost.toFixed(2),
    methaneMarginalCost: results.ch4Costs.marginalCost.toFixed(2)
  };
  
  return results;
}

function updateForecastCharts(results) {
  // Destroy existing charts
  if (demandChartInstance) {
    demandChartInstance.destroy();
    demandChartInstance = null;
  }
  if (dispatchChartInstance) {
    dispatchChartInstance.destroy();
    dispatchChartInstance = null;
  }
  
  if (!demandForecastChart.value || !dispatchForecastChart.value) return;
  
  // Create demand forecast chart
  demandChartInstance = new Chart(demandForecastChart.value, {
    type: 'line',
    data: {
      labels: results.labels,
      datasets: [
        {
          label: 'Demand (MW)',
          data: results.demand,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Power Price (€/MWh)',
          data: results.price,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          labels: { color: '#e5e7eb' }
        }
      },
      scales: {
        y: {
          title: { display: true, text: 'MW', color: '#e5e7eb' },
          ticks: { color: '#9ca3af' },
          grid: { color: '#374151' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: '€/MWh', color: '#e5e7eb' },
          ticks: { color: '#9ca3af' },
          grid: { drawOnChartArea: false }
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { color: '#374151' }
        }
      }
    }
  });
  
  // Create dispatch chart
  dispatchChartInstance = new Chart(dispatchForecastChart.value, {
    type: 'bar',
    data: {
      labels: results.labels,
      datasets: [
        {
          label: 'Hydrogen (MW)',
          data: results.dispatchH2,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        },
        {
          label: 'Methane (MW)',
          data: results.dispatchCH4,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          labels: { color: '#e5e7eb' }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: '#9ca3af' },
          grid: { color: '#374151' }
        },
        y: {
          stacked: true,
          title: { display: true, text: 'MW', color: '#e5e7eb' },
          ticks: { color: '#9ca3af' },
          grid: { color: '#374151' }
        }
      }
    }
  });
}

function runOptimization() {
  const results = optimizeForecast();
  updateForecastCharts(results);
}

// Initialize forecasting when component mounts
onMounted(() => {
  setTimeout(() => {
    runOptimization();
  }, 100);
});

// Fully automatic updates when any parameter changes
watchEffect(() => {
  // Watch all control changes for instant automatic updates
  const watchedValues = [
    hydrogenPrice.value,
    methanePrice.value, 
    carbonCreditPrice.value,
    marketDemandMultiplier.value,
    forecastHorizon.value,
    activeScenario.value
  ];
  
  if (demandForecastChart.value && dispatchForecastChart.value) {
    // Immediate update without delay for smooth interaction
    runOptimization();
  }
});

// Sync with dashboard time periods and plant state changes
watchEffect(() => {
  if (chartPeriod.value === 'day' || chartPeriod.value === 'month') {
    forecastHorizon.value = chartPeriod.value === 'day' ? 24 : 168;
  }
  
  // Also update when plant state changes to keep demand realistic
  if (plantState.totalPower && demandForecastChart.value) {
    clearTimeout(window.plantSyncTimeout);
    window.plantSyncTimeout = setTimeout(() => {
      runOptimization();
    }, 500);
  }
});

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
}

/* Dashboard Header */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.title-section h1 {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.region-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.region-selector label {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.region-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.region-select:hover {
  border-color: #cbd5e0;
}

.region-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Regulatory Section */
.regulatory-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.compliance-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.compliance-status.compliant {
  background: linear-gradient(135deg, #68d391 0%, #38a169 100%);
  color: white;
}

.compliance-status.non-compliant {
  background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%);
  color: white;
}

.regulatory-grid {
  margin-top: 24px;
}

.regulatory-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.regulatory-card {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.regulatory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.reg-icon {
  font-size: 1.8rem;
  opacity: 0.8;
}

.reg-content {
  flex: 1;
}

.reg-label {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.reg-value {
  font-size: 1.2rem;
  color: #2d3748;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}

.reg-detail {
  font-size: 0.8rem;
  color: #a0aec0;
  font-weight: 500;
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

.neutral-co2 {
  color: #a0aec0; /* Gray for zero emissions */
  font-weight: 500;
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

.header-controls {
  display: flex;
  gap: 16px;
  align-items: center;
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

/* Enhanced Professional Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  max-width: 650px;
  width: 90vw;
  overflow: hidden;
  transform: scale(0.95);
  animation: modalSlideIn 0.3s ease forwards;
}

@keyframes modalSlideIn {
  to {
    transform: scale(1);
  }
}

.modal-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 32px 32px 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-icon {
  background: #10b981;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.modal-title h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.3;
}

.close-x {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-x:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.modal-body {
  padding: 32px;
}

.modal-intro {
  margin-bottom: 32px;
}

.modal-description {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 20px;
  line-height: 1.6;
}

.compliance-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.compliance-badge.compliant {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.compliance-badge.non-compliant {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.period-selection h4 {
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.period-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.period-option {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.period-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.period-option:hover {
  background: white;
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  transform: translateY(-2px);
}

.period-option:hover::before {
  transform: translateX(0);
}

.period-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.period-icon {
  font-size: 1.5rem;
}

.period-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.period-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.period-scope {
  font-size: 0.9rem;
  color: #10b981;
  font-weight: 600;
}

.period-info {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.modal-footer-info {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.report-features {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.feature-item {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ========== Energy Forecasting & Fuel Optimization Styles ========== */

.energy-forecast-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  margin-top: 24px;
}

.energy-forecast-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.energy-forecast-section .section-header h2 {
  color: #f8fafc;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.forecast-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.forecast-select {
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 10px;
  padding: 8px 12px;
  color: #f1f5f9;
  font-size: 0.9rem;
  cursor: pointer;
}

.forecast-select option {
  background: rgba(15, 23, 42, 0.95);
  color: #f1f5f9;
  padding: 8px;
}

.forecast-select:focus {
  outline: none;
  border-color: rgba(79, 70, 229, 0.6);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.forecast-btn {
  background: rgba(79, 70, 229, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 10px;
  padding: 8px 16px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.forecast-btn:hover {
  background: rgba(79, 70, 229, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.forecast-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.forecast-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

/* Price Control Sliders */
.price-controls-section {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.price-controls-section h3 {
  color: #f1f5f9;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.sliders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.slider-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-control label {
  color: #cbd5e1;
  font-size: 0.9rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.price-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.price-slider.hydrogen {
  background: linear-gradient(to right, #10b981, #059669);
}

.price-slider.methane {
  background: linear-gradient(to right, #f59e0b, #d97706);
}

.price-slider.carbon {
  background: linear-gradient(to right, #6366f1, #4f46e5);
}

.price-slider.electricity {
  background: linear-gradient(to right, #06b6d4, #0891b2);
}

.price-slider.demand {
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
}

.price-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.price-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.price-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.price-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 0.75rem;
  margin-top: 4px;
}

.forecast-scenarios {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.scenario-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.scenario-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  opacity: 1;
}

.scenario-card.active {
  opacity: 1;
  border-color: rgba(79, 70, 229, 0.6);
  background: rgba(79, 70, 229, 0.2);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.scenario-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scenario-icon {
  font-size: 1.5rem;
}

.scenario-info h3 {
  color: #e2e8f0;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.scenario-info p {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.forecast-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.forecast-chart-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 16px;
  min-height: 280px;
}

.forecast-chart-card .chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.forecast-chart-card .chart-header h3 {
  color: #f1f5f9;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.forecast-chart-card .chart-period {
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.chart-container {
  position: relative;
  height: 200px;
  width: 100%;
}

.chart-explanation {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.chart-explanation p {
  margin: 4px 0;
  font-size: 0.8rem;
  color: #94a3b8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.chart-explanation strong {
  color: #cbd5e1;
}

.forecast-kpis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.forecast-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.forecast-kpi-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.forecast-kpi-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.kpi-icon {
  font-size: 1.2rem;
}

.forecast-kpi-header h3 {
  color: #f1f5f9;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.kpi-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-label {
  color: #94a3b8;
  font-size: 0.85rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.kpi-value {
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.kpi-value.positive {
  color: #10b981;
}

.kpi-value.negative {
  color: #ef4444;
}

.fuel-breakdown-table {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.fuel-breakdown-table h3 {
  color: #f1f5f9;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.forecast-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.forecast-table th {
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}

.forecast-table th:first-child {
  border-top-left-radius: 8px;
}

.forecast-table th:last-child {
  border-top-right-radius: 8px;
}

.forecast-table td {
  color: #cbd5e1;
  font-size: 0.85rem;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.forecast-table td.good {
  color: #10b981;
  font-weight: 600;
}

.forecast-table td.warn {
  color: #f59e0b;
  font-weight: 600;
}

.forecast-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

.forecast-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

.forecast-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .forecast-kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .forecast-charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .forecast-scenarios {
    grid-template-columns: 1fr;
  }
  
  .forecast-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .energy-forecast-section .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>