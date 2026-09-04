import { useId, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  showEndpoint?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function TerminalSparkline({
  data,
  color = "#10B981",
  height = 36,
  className = "",
  showEndpoint = true,
  valuePrefix = "",
  valueSuffix = "",
}: TerminalSparklineProps) {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return <div style={{ height }} className={`w-full ${className}`} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;
  const width = 100; // viewBox width 0..100

  // Calculate coordinates (normalized to 0..100 viewBox width, paddingY..height-paddingY)
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y, val };
  });

  // Build smooth bezier path
  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
  }

  const lastPoint = points[points.length - 1];
  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetIdx = Math.round(ratio * (points.length - 1));
    setHoverIndex(targetIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full overflow-visible cursor-crosshair select-none group/spark ${className}`}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient fill */}
        <motion.path
          d={areaD}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        />

        {/* Smooth Animated Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Interactive Hover Vertical Crosshair */}
        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={height}
              stroke="currentColor"
              className="text-foreground/40"
              strokeWidth="0.75"
              strokeDasharray="1.5 1.5"
            />
            {/* Focal Highlight Ring */}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="3.5"
              fill={color}
              stroke="#09090b"
              strokeWidth="1.5"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="6.5"
              fill={color}
              opacity="0.25"
            />
          </>
        )}

        {/* Terminal Live Endpoint Dot (when not hovering) */}
        {showEndpoint && !activePoint && (
          <>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="2.5"
              fill={color}
              className="pulse-dot"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="4.5"
              fill={color}
              opacity="0.3"
            />
          </>
        )}
      </svg>

      {/* Floating Micro Tooltip Tag when scrubbing */}
      <AnimatePresence>
        {activePoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 2 }}
            transition={{ duration: 0.12 }}
            className="absolute pointer-events-none z-30 -top-5 px-1.5 py-0.5 rounded-xs bg-popover/95 border border-border shadow-md backdrop-blur-xs text-[9px] font-mono font-semibold text-foreground whitespace-nowrap"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            {valuePrefix}
            {activePoint.val.toLocaleString()}
            {valueSuffix}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
