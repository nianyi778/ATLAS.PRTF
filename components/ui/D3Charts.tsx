
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// --- Types ---
interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface HierarchyData {
  name: string;
  value?: number;
  children?: HierarchyData[];
  color?: string;
}

interface D3BarChartProps {
  data: ChartData[];
  width?: number | string;
  height?: number;
  horizontal?: boolean; // True for horizontal bars, False for vertical columns
  barColor?: string;
  threshold?: number; // For highlighting bars above a certain value
  formatValue?: (val: number) => string;
}

interface D3PieChartProps {
  data: ChartData[];
  height?: number;
  innerRadius?: number; // 0 for Pie, >0 for Donut
  colors?: string[];
}

interface D3SunburstChartProps {
  data: HierarchyData;
  height?: number;
}

// --- Helper Hook for Responsive Dimensions ---
const useResizeObserver = (ref: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const observeTarget = ref.current;
    if (!observeTarget) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      });
    });
    
    resizeObserver.observe(observeTarget);
    return () => resizeObserver.unobserve(observeTarget);
  }, [ref]);
  return dimensions;
};

// --- D3 Bar Chart Component ---
export const D3BarChart: React.FC<D3BarChartProps> = ({ 
  data, 
  height = 300, 
  horizontal = false, 
  barColor = "#3b82f6",
  threshold,
  formatValue = (v) => v.toString()
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);

  useEffect(() => {
    if (!width || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = { top: 20, right: 30, bottom: 30, left: horizontal ? 80 : 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    let x, y;

    if (horizontal) {
      x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) || 0])
        .range([0, chartWidth]);
      
      y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, chartHeight])
        .padding(0.3);
    } else {
      x = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, chartWidth])
        .padding(0.3);

      y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) || 0])
        .range([chartHeight, 0]);
    }

    // Grid Lines (Subtle)
    if (horizontal) {
        g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickSize(-chartHeight)
            .tickFormat(() => "")
        )
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.05)"));
    } else {
        g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickSize(-chartWidth)
            .tickFormat(() => "")
        )
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.05)"));
    }

    // Axes
    if (horizontal) {
        // Y Axis (Categories)
        g.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "#a1a1aa")
            .style("font-size", "11px")
            .style("font-family", "Inter, sans-serif");
    } else {
        // X Axis (Categories)
        g.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).tickSize(0))
            .call(g => g.select(".domain").remove())
            .selectAll("text")
            .attr("fill", "#a1a1aa")
            .attr("dy", "10px")
            .style("font-size", "11px")
            .style("font-family", "Inter, sans-serif");
    }

    // Bars
    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => horizontal ? 0 : (x(d.name) || 0))
      .attr("y", d => horizontal ? (y(d.name) || 0) : y(d.value))
      .attr("width", d => horizontal ? x(d.value) : x.bandwidth())
      .attr("height", d => horizontal ? y.bandwidth() : chartHeight - y(d.value))
      .attr("fill", d => (threshold && d.value > threshold) ? "#ef4444" : (d.color || barColor))
      .attr("rx", 2) // Rounded corners
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.8);
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("opacity", 1)
               .html(`<div class="font-medium text-white">${d.name}</div><div class="text-atlas-accent">${formatValue(d.value)}</div>`);
      })
      .on("mousemove", function(event) {
         // Tooltip positioning
         const tooltip = d3.select(tooltipRef.current);
         const [mx, my] = d3.pointer(event, containerRef.current);
         tooltip.style("left", `${mx + 10}px`)
                .style("top", `${my - 10}px`);
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 1);
        d3.select(tooltipRef.current).style("opacity", 0);
      });

  }, [data, width, height, horizontal, barColor, threshold]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg ref={svgRef} width="100%" height={height} className="overflow-visible" />
      <div 
        ref={tooltipRef} 
        className="absolute pointer-events-none opacity-0 bg-[#18181b] border border-white/10 p-2 rounded shadow-xl text-xs z-50 transition-opacity duration-200 backdrop-blur-md"
      />
    </div>
  );
};

// --- D3 Pie/Donut Chart Component ---
export const D3PieChart: React.FC<D3PieChartProps> = ({ 
    data, 
    height = 300, 
    innerRadius = 0, 
    colors = d3.schemeTableau10 
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { width } = useResizeObserver(containerRef);

    useEffect(() => {
        if (!width || !data) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const radius = Math.min(width, height) / 2;
        const colorScale = d3.scaleOrdinal(colors).domain(data.map(d => d.name));

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const pie = d3.pie<ChartData>()
            .value(d => d.value)
            .sort(null)
            .padAngle(0.02);

        const arc = d3.arc<d3.PieArcDatum<ChartData>>()
            .innerRadius(innerRadius)
            .outerRadius(radius - 20)
            .cornerRadius(4);
        
        const arcHover = d3.arc<d3.PieArcDatum<ChartData>>()
            .innerRadius(innerRadius)
            .outerRadius(radius - 15)
            .cornerRadius(4);

        g.selectAll("path")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => colorScale(d.data.name) as string)
            .attr("stroke", "rgba(0,0,0,0.5)")
            .style("stroke-width", "1px")
            .on("mouseover", function(event, d) {
                d3.select(this)
                  .transition().duration(200)
                  .attr("d", arcHover);

                const tooltip = d3.select(tooltipRef.current);
                tooltip.style("opacity", 1)
                       .html(`
                         <div class="flex items-center space-x-2 mb-1">
                            <div class="w-2 h-2 rounded-full" style="background:${colorScale(d.data.name)}"></div>
                            <div class="font-medium text-white">${d.data.name}</div>
                         </div>
                         <div class="text-white font-mono font-bold">${d.data.value.toFixed(1)}%</div>
                       `);
            })
            .on("mousemove", function(event) {
                const tooltip = d3.select(tooltipRef.current);
                const [mx, my] = d3.pointer(event, containerRef.current);
                tooltip.style("left", `${mx + 15}px`)
                       .style("top", `${my - 15}px`);
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                  .transition().duration(200)
                  .attr("d", arc);
                d3.select(tooltipRef.current).style("opacity", 0);
            });

    }, [data, width, height, innerRadius, colors]);

    return (
        <div ref={containerRef} className="relative w-full flex items-center justify-center" style={{ height }}>
            <svg ref={svgRef} width="100%" height={height} className="overflow-visible" />
            <div 
                ref={tooltipRef} 
                className="absolute pointer-events-none opacity-0 bg-[#18181b] border border-white/10 p-2.5 rounded shadow-xl text-xs z-50 transition-opacity duration-200 backdrop-blur-md"
            />
        </div>
    );
};

// --- D3 Sunburst Chart Component ---
export const D3SunburstChart: React.FC<D3SunburstChartProps> = ({ data, height = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);

  useEffect(() => {
    if (!width || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2;
    
    // Create hierarchy
    const root = d3.hierarchy(data)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create partition layout
    d3.partition()
      .size([2 * Math.PI, radius])(root);

    const arc = d3.arc<d3.HierarchyRectangularNode<HierarchyData>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Colors: A curated set of neon/vibrant colors for dark mode
    const customColors = [
      "#3b82f6", // Blue 500
      "#10b981", // Emerald 500
      "#f59e0b", // Amber 500
      "#ef4444", // Red 500
      "#a855f7", // Purple 500
      "#06b6d4", // Cyan 500
      "#ec4899", // Pink 500
      "#8b5cf6", // Violet 500
    ];
    const colorScale = d3.scaleOrdinal(customColors);

    g.selectAll("path")
      .data(root.descendants().filter(d => d.depth)) // Filter out root
      .join("path")
      .attr("fill", d => {
        // Use custom color if provided
        if (d.data.color) return d.data.color;
        
        // Otherwise, inherit base color from the Level 1 ancestor (Currency/Market layer)
        let ancestor = d;
        while (ancestor.depth > 1 && ancestor.parent) {
            ancestor = ancestor.parent;
        }
        return colorScale(ancestor.data.name) as string;
      })
      .attr("fill-opacity", d => {
        // Vary opacity by depth to create a "glowing" layered effect
        // Depth 1 (Inner): 0.9 (Solid)
        // Depth 2 (Middle): 0.7 (Semi-transparent)
        // Depth 3 (Outer): 0.5 (Translucent)
        if (d.depth === 1) return 0.9;
        if (d.depth === 2) return 0.7;
        return 0.5;
      })
      .attr("d", arc)
      .attr("stroke", "#18181b") // Background color for separation
      .attr("stroke-width", "1px")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
         // On hover: Highlighting
         d3.select(this)
           .attr("fill-opacity", 1)
           .attr("stroke", "#fff")
           .attr("stroke-width", "2px");
         
         const tooltip = d3.select(tooltipRef.current);
         const percent = ((d.value || 0) / (root.value || 1) * 100).toFixed(1);
         
         tooltip.style("opacity", 1)
                .html(`
                  <div class="font-bold text-white mb-0.5 text-sm">${d.ancestors().map(d => d.data.name).reverse().join(" > ")}</div>
                  <div class="flex justify-between items-center space-x-6 mt-1">
                     <span class="text-atlas-text-secondary text-xs">Value</span>
                     <span class="text-white font-mono text-sm">${(d.value || 0).toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between items-center space-x-6">
                     <span class="text-atlas-text-secondary text-xs">Share</span>
                     <span class="text-atlas-accent font-mono text-sm">${percent}%</span>
                  </div>
                `);
      })
      .on("mousemove", function(event) {
         const tooltip = d3.select(tooltipRef.current);
         const [mx, my] = d3.pointer(event, containerRef.current);
         tooltip.style("left", `${mx + 15}px`)
                .style("top", `${my - 15}px`);
      })
      .on("mouseout", function(event, d) {
         // Reset style
         d3.select(this)
           .attr("fill-opacity", d.depth === 1 ? 0.9 : (d.depth === 2 ? 0.7 : 0.5))
           .attr("stroke", "#18181b")
           .attr("stroke-width", "1px");
         d3.select(tooltipRef.current).style("opacity", 0);
      });

    // Add labels for larger arcs
    g.selectAll("text")
      // Only label if arc is large enough (> 25px length)
      .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 25))
      .join("text")
      .attr("transform", function(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", "white")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.9)") // Strong shadow for contrast
      .attr("pointer-events", "none") // Let mouse events pass through to path
      .text(d => d.data.name.length > 10 ? d.data.name.substring(0, 8) + '..' : d.data.name);

  }, [data, width, height]);

  return (
    <div ref={containerRef} className="relative w-full flex items-center justify-center" style={{ height }}>
      <svg ref={svgRef} width="100%" height={height} className="overflow-visible" />
      <div 
        ref={tooltipRef} 
        className="absolute pointer-events-none opacity-0 bg-[#18181b] border border-white/10 p-3 rounded-lg shadow-2xl text-xs z-50 transition-opacity duration-200 backdrop-blur-md min-w-[140px]"
      />
    </div>
  );
};
