"use client";
import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps {
  data: any;
  height?: string;
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({ data, height = "100%" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && Plotly && data) {
      // Use a short delay to ensure the browser has completed layout and container width is non-zero
      const timer = setTimeout(() => {
        try {
          if (!containerRef.current) return;
          
          const cleanLayout = {
            ...data.layout,
            paper_bgcolor: 'rgba(0, 0, 0, 0)', // fully transparent
            plot_bgcolor: 'rgba(0, 0, 0, 0)',  // fully transparent
            font: {
              color: '#94a3b8', // slate-400
              family: 'var(--font-geist-sans), system-ui, sans-serif',
            }
          };

          // Draw plot
          Plotly.newPlot(
            containerRef.current,
            data.data,
            cleanLayout,
            { 
              responsive: true, 
              displayModeBar: false,
              showTips: false
            }
          );
          
          // Force resize immediately to fit the container width
          Plotly.Plots.resize(containerRef.current);
        } catch (err) {
          console.error("Plotly rendering error:", err);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [data]);

  return (
    <div className="w-full overflow-hidden" style={{ height }}>
      <div 
        ref={containerRef} 
        className="w-full h-full bg-transparent border-none p-0"
      />
    </div>
  );
};

export default PlotlyChart;
