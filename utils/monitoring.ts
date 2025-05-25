// utils/monitoring.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);

    // Garder seulement les 100 dernières mesures
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Log si la performance est dégradée
    if (duration > 1000) {
      // Plus d'1 seconde
      console.warn(
        `⚠️ Performance dégradée pour ${operation}: ${duration.toFixed(2)}ms`
      );
    }
  }

  getAverageTime(operation: string): number {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return 0;

    return metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    for (const [operation, times] of this.metrics.entries()) {
      result[operation] = {
        average: this.getAverageTime(operation),
        count: times.length,
      };
    }

    return result;
  }
}

// Utilisation dans les services
export async function monitoredFetch(url: string, options?: RequestInit) {
  const monitor = PerformanceMonitor.getInstance();
  const endTimer = monitor.startTimer(`fetch-${url}`);

  try {
    const response = await fetch(url, options);
    return response;
  } finally {
    endTimer();
  }
}
