import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const CHART_DEFAULTS = {
  font: { family: "'Inter', sans-serif", size: 12 },
  color: '#6b7280',
};

Chart.defaults.font = CHART_DEFAULTS.font;
Chart.defaults.color = CHART_DEFAULTS.color;

// ─── Line Chart ────────────────────────────────────────────────────────────────
export function LineChart({ labels, datasets, title, height = 220 }) {
  const canvasRef = useRef();
  const chartRef  = useRef();

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels, datasets: datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color || '#2d6a4f',
        backgroundColor: ds.bg || 'rgba(45,106,79,0.08)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        ...ds.extra,
      }))},
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: datasets.length > 1, position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
          title: title ? { display: true, text: title, font: { size: 13, weight: '600' }, color: '#374151', padding: { bottom: 12 } } : { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#f9fafb',
            bodyColor: '#d1fae5',
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { maxRotation: 0 } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: false },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, datasets, title]);

  return <div style={{ height }}><canvas ref={canvasRef} /></div>;
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
export function BarChart({ labels, datasets, title, height = 220, stacked = false }) {
  const canvasRef = useRef();
  const chartRef  = useRef();

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels, datasets: datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.colors || ds.color || 'rgba(45,106,79,0.75)',
        borderColor: ds.borderColors || ds.borderColor || 'rgba(45,106,79,1)',
        borderWidth: 1.5,
        borderRadius: 6,
        ...ds.extra,
      }))},
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: datasets.length > 1, position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
          title: title ? { display: true, text: title, font: { size: 13, weight: '600' }, color: '#374151', padding: { bottom: 12 } } : { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#f9fafb',
            bodyColor: '#d1fae5',
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: { stacked, grid: { display: false } },
          y: { stacked, grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: true },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, datasets, title, stacked]);

  return <div style={{ height }}><canvas ref={canvasRef} /></div>;
}

// ─── Doughnut Chart ─────────────────────────────────────────────────────────────
export function DoughnutChart({ labels, data, colors, title, height = 200 }) {
  const canvasRef = useRef();
  const chartRef  = useRef();

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, padding: 14 } },
          title: title ? { display: true, text: title, font: { size: 13, weight: '600' }, color: '#374151', padding: { bottom: 8 } } : { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#f9fafb',
            bodyColor: '#d1fae5',
            padding: 10,
            cornerRadius: 8,
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, data, colors, title]);

  return <div style={{ height }}><canvas ref={canvasRef} /></div>;
}

// ─── Horizontal Bar Chart ───────────────────────────────────────────────────────
export function HBarChart({ labels, data, color = '#2d6a4f', title, height = 220 }) {
  const canvasRef = useRef();
  const chartRef  = useRef();

  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data, backgroundColor: color, borderRadius: 5, borderSkipped: false }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: title ? { display: true, text: title, font: { size: 13, weight: '600' }, color: '#374151', padding: { bottom: 10 } } : { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#f9fafb',
            bodyColor: '#d1fae5',
            callbacks: { label: ctx => ` ₹${ctx.parsed.x.toLocaleString('en-IN')}/Qtl` },
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => `₹${v}` } },
          y: { grid: { display: false } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [labels, data, color, title]);

  return <div style={{ height }}><canvas ref={canvasRef} /></div>;
}
