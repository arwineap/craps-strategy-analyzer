import React, { useRef, useEffect } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Legend, Tooltip,
} from 'chart.js';
import type { SerializedAccumulator } from '../../types.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

const SAMPLE_EVERY = 5;

interface Props {
  accumulators: SerializedAccumulator[];
  showIndividual?: boolean;
}

export default function BankrollChart({ accumulators, showIndividual = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const datasets: Chart['data']['datasets'] = [];
    const maxLen = Math.max(...accumulators.map(a => a.avgBankrollCurve.length), 0);
    const labels = Array.from({ length: maxLen }, (_, i) => String(i * SAMPLE_EVERY));

    for (const acc of accumulators) {
      // Individual game curves (faint)
      if (showIndividual) {
        const count = Math.min(acc.perGameSamples.length, 20);
        for (let i = 0; i < count; i++) {
          datasets.push({
            label: '',
            data: acc.perGameSamples[i],
            borderColor: acc.color + '25',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
            showLine: true,
          });
        }
      }

      // Average curve (bold)
      datasets.push({
        label: acc.name,
        data: acc.avgBankrollCurve,
        borderColor: acc.color,
        backgroundColor: acc.color + '20',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.2,
        fill: false,
      });
    }

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              // Only show datasets with labels (i.e. average curves)
              filter: item => !!item.text,
              boxWidth: 12,
              font: { size: 11 },
            },
          },
          tooltip: {
            filter: item => !!item.dataset.label,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: $${(ctx.raw as number).toFixed(0)}`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Rolls', font: { size: 11 } },
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

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [accumulators, showIndividual]);

  return (
    <div style={{ height: 380, position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
