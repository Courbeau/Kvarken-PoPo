// src/fakeReportData.js
// Fake historical data for reports (weekly, monthly, yearly)

export const fakeReportData = {
  weekly: [
    { date: '2025-09-20', power: 21.2, co2: 3.8 },
    { date: '2025-09-21', power: 21.5, co2: 3.7 },
    { date: '2025-09-22', power: 21.1, co2: 3.9 },
    { date: '2025-09-23', power: 21.7, co2: 3.6 },
    { date: '2025-09-24', power: 21.3, co2: 3.8 },
    { date: '2025-09-25', power: 21.6, co2: 3.7 },
    { date: '2025-09-26', power: 21.4, co2: 3.8 },
  ],
  monthly: Array.from({ length: 30 }, (_, i) => ({
    date: `2025-08-${String(i + 1).padStart(2, '0')}`,
    power: (21 + Math.random() * 1).toFixed(2),
    co2: (3.7 + Math.random() * 0.3).toFixed(2),
  })),
  yearly: Array.from({ length: 12 }, (_, i) => ({
    date: `2025-${String(i + 1).padStart(2, '0')}`,
    power: (21 + Math.random() * 1).toFixed(2),
    co2: (3.7 + Math.random() * 0.3).toFixed(2),
  })),
};
