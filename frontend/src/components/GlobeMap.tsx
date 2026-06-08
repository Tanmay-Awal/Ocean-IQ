"use client"

import React, { useState, useEffect, useRef } from "react"
import Plotly from "plotly.js-dist-min"

const FLOAT_COLORS: Record<string, string> = {
  "1902677": "#22d3ee",
  "2900230": "#0ea5e9",
  "2900765": "#10b981",
  "2901092": "#eab308",
  "2902210": "#ec4899",
  "2902217": "#8b5cf6",
}

const getFloatColor = (wmo: string) => FLOAT_COLORS[wmo] ?? "#38bdf8"

export function GlobeMap({ floats }: { floats: any[] }) {
  const [selectedFloat, setSelectedFloat] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  
  // Track current rotation and scale in refs so we can preserve them without causing React re-renders
  const rotationRef = useRef({ lon: 75, lat: 15, roll: 0 })
  const scaleRef = useRef<number>(1)

  useEffect(() => {
    if (!chartRef.current || !floats || floats.length === 0) return;

    // Filter valid floats
    const validFloats = floats.filter(f => f.avg_latitude != null && f.avg_longitude != null);
    if (validFloats.length === 0) return;

    const lat = validFloats.map(f => f.avg_latitude);
    const lon = validFloats.map(f => f.avg_longitude);
    const text = validFloats.map(f => `WMO ${f.wmo}<br>${f.region}`);
    const colors = validFloats.map(f => getFloatColor(f.wmo));
    
    // Make the selected float larger
    const sizes = validFloats.map(f => f.wmo === selectedFloat ? 16 : 8);

    const data: any[] = [
      {
        type: 'scattergeo',
        lat: lat,
        lon: lon,
        text: text,
        mode: 'markers+text',
        textposition: 'top center',
        hoverinfo: 'text',
        marker: {
          size: sizes,
          color: colors,
          line: {
            color: '#0f172a',
            width: 1
          },
          opacity: 0.9
        },
        textfont: {
          family: 'Inter, sans-serif',
          size: 11,
          color: 'rgba(255,255,255,0.7)'
        }
      }
    ];

    const layout: any = {
      geo: {
        projection: {
          type: 'orthographic',
          rotation: rotationRef.current,
          scale: scaleRef.current
        },
        showcoastlines: true,
        coastlinecolor: 'rgba(255,255,255,0.1)',
        showland: true,
        landcolor: '#d4d4d8', // The light grey land color from the screenshot
        showocean: true,
        oceancolor: 'transparent',
        showlakes: true,
        lakecolor: 'transparent',
        showcountries: true,
        countrycolor: 'rgba(255,255,255,0.2)',
        bgcolor: 'transparent',
        lataxis: { range: [-90, 90] },
        lonaxis: { range: [-180, 180] },
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { t: 10, b: 10, l: 10, r: 10 },
      dragmode: 'pan', // allows rotating the globe
      hovermode: 'closest'
    };

    const config = {
      displayModeBar: false,
      responsive: true,
      topojsonURL: '/topojson/'
    };

    Plotly.react(chartRef.current, data, layout, config);

    // Capture rotation and scale changes silently to keep state synced without re-rendering
    const handleRelayout = (eventData: any) => {
      if (eventData['geo.projection.rotation.lon'] !== undefined) {
        rotationRef.current = {
          lon: eventData['geo.projection.rotation.lon'],
          lat: eventData['geo.projection.rotation.lat'] || rotationRef.current.lat,
          roll: eventData['geo.projection.rotation.roll'] || rotationRef.current.roll
        };
      }
      if (eventData['geo.projection.scale'] !== undefined) {
        scaleRef.current = eventData['geo.projection.scale'];
      }
    };

    (chartRef.current as any).on('plotly_relayout', handleRelayout);

    return () => {
      if (chartRef.current) {
        (chartRef.current as any).removeListener('plotly_relayout', handleRelayout);
      }
    };
  }, [floats, selectedFloat]); // Do not depend on rotation/scale to prevent render loops

  const handleFloatClick = (float: any) => {
    if (float.avg_latitude != null && float.avg_longitude != null) {
      setSelectedFloat(float.wmo)
      // Update rotation to center on clicked float
      rotationRef.current = {
        lon: float.avg_longitude,
        lat: float.avg_latitude,
        roll: 0
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-[400px] w-full items-center justify-center bg-ocean-dark/20 rounded-xl border border-border overflow-hidden relative">
        <div ref={chartRef} className="w-full h-full" />
        <span className="absolute bottom-4 left-4 text-xs font-medium text-slate-500 bg-ocean-dark/50 px-2 py-1 rounded backdrop-blur-md border border-slate-800 pointer-events-none">
          Drag to rotate 3D view
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {floats.map((float) => {
          const color = getFloatColor(float.wmo)
          const isSelected = selectedFloat === float.wmo
          return (
            <div
              key={float.wmo}
              onClick={() => handleFloatClick(float)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all border ${
                isSelected 
                  ? 'border-ocean-cyan bg-ocean-cyan/10 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/40'
              }`}
            >
              <span className="h-2 w-2 rounded-full mb-1.5" style={{ backgroundColor: color }} />
              <p className={`text-xs font-semibold ${isSelected ? 'text-ocean-cyan' : 'text-slate-300'}`}>
                WMO {float.wmo}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 max-w-full truncate px-1 text-center" title={float.region}>
                {float.region}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
