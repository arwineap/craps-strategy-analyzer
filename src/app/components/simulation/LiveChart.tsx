import React, { useRef, useEffect } from 'react';
import {
  Chart,
  LineController, LineElement, PointElement,
  LinearScale, CategoryScale,
  Legend, Tooltip, Filler,
} from 'chart.js';
import type { SerializedAccumulator } from '../../types.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler);

const SAMPLE_EVERY = 5; // must match simulator.ts

interface Props {
  accumulators: SerializedAccumulator[];
}

export default function LiveChart({ accumulators }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!chartRef.current) {
      chartRef.current = new Chart(canvas, {
        type: 'line',
        data: { datasets: [] },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: $${(ctx.raw as number).toFixed(0)}`,
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: 'Rolls (avg)', font: { size: 11 } },
              ticks: { maxTicksLimit: 8, font: { size: 10 } },
            },
            y: {
              title: { display: true, text: 'Bankroll ($)', font: { size: 11 } },
              ticks: {
                font: { size: 10 },
                callback: v => `$${Number(v).toLocaleString()}`,
              },
            },
          },
        },
      });
    }

    const chart = chartRef.current;
    const maxLen = Math.max(...accumulators.map(a => a.avgBankrollCurve.length), 0);
    const labels = Array.from({ length: maxLen }, (_, i) => String(i * SAMPLE_EVERY));

    chart.data.labels = labels;
    chart.data.datasets = accumulators.map(acc => ({
      label: acc.name,
      data: acc.avgBankrollCurve,
      borderColor: acc.color,
      backgroundColor: acc.color + '18',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.2,
      fill: false,
    }));

    chart.update('none');
  }, [accumulators]);

  useEffect(() => {
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-3">Average Bankroll Curve</h3>
      <div style={{ height: 320, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
