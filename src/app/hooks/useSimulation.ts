import { useCallback, useEffect, useRef, useState } from 'react';
import type { SerializedAccumulator, SimResultData, RunConfig } from '../types.js';
import type { WorkerOutMessage } from '../../worker/simulation.worker.js';

// Vite worker import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import SimWorker from '../../worker/simulation.worker?worker';

export function useSimulation() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [accumulators, setAccumulators] = useState<SerializedAccumulator[]>([]);
  const [result, setResult] = useState<SimResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const run = useCallback((config: RunConfig) => {
    // Terminate any existing run
    workerRef.current?.terminate();

    const worker: Worker = new SimWorker();
    workerRef.current = worker;

    setRunning(true);
    setProgress(0);
    setAccumulators([]);
    setError(null);

    worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      const msg = e.data;
      if (msg.type === 'update') {
        setProgress(msg.gameNum / msg.total);
        setAccumulators(msg.accumulators);
      } else if (msg.type === 'done') {
        setRunning(false);
        setProgress(1);
        setAccumulators(msg.accumulators);
        setResult({ totalGames: msg.totalGames, accumulators: msg.accumulators, seed: msg.seed, runConfig: config });
      } else if (msg.type === 'error') {
        setRunning(false);
        setError(msg.message);
      }
    };

    worker.onerror = (e) => {
      setRunning(false);
      setError(e.message);
    };

    worker.postMessage({ type: 'run', config });
  }, []);

  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
  }, []);

  return { run, cancel, running, progress, accumulators, result, error };
}
