import React, { useEffect, useRef, useState, useCallback, useLayoutEffect, useMemo } from 'react';
import { CommandLabBlock, ParameterDefinition, Language } from '../types';
import { executeCode, parseCommandParams, updateCodeParams } from '../services/sandbox';
import { COMMAND_REGISTRY } from '../services/commandRegistry';
import { UI_TRANSLATIONS } from '../constants';
import { Copy, Code2, Sliders, Bug, ChevronDown, Minus, Plus, Check, Palette } from 'lucide-react';

interface Props {
  block: CommandLabBlock;
  readOnly?: boolean;
  lang?: Language;
}

const CONTENT_SIZE = 600;
const MARGIN = 40;
const TOTAL_LOGICAL_SIZE = CONTENT_SIZE + (MARGIN * 2);

// --- UI Helpers ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-xl border overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: any; title: string; action?: React.ReactNode }> = ({ icon: Icon, title, action }) => (
  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-slate-400" />
      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
    </div>
    {action}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">
    {children}
  </label>
);

// --- Color Utils ---

interface HSV { h: number; s: number; v: number; }
interface RGB { r: number; g: number; b: number; }

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToHsv = ({ r, g, b }: RGB): HSV => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
};

const hsvToRgb = (h: number, s: number, v: number): RGB => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0, g1 = 0, b1 = 0;

  if (h >= 0 && h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h >= 60 && h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h >= 120 && h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h >= 180 && h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h >= 240 && h < 300) { r1 = x; g1 = 0; b1 = c; }
  else if (h >= 300 && h <= 360) { r1 = c; g1 = 0; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
};

const getContrastYIQ = (hexcolor: string) => {
  const { r, g, b } = hexToRgb(hexcolor);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

// --- Custom Color Picker (Embedded) ---

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  lang: Language;
}

const CustomColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, lang }) => {
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(hexToRgb(value)));
  const [isDraggingSV, setIsDraggingSV] = useState(false);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = UI_TRANSLATIONS[lang];

  // Sync state with prop if it changes externally (and not currently dragging)
  useEffect(() => {
    if (!isDraggingSV && !isDraggingH) {
      setHsv(rgbToHsv(hexToRgb(value)));
    }
  }, [value, isDraggingSV, isDraggingH]);

  const svCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

  useEffect(() => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const hueRgb = hsvToRgb(hsv.h, 1, 1);
    ctx.fillStyle = `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})`;
    ctx.fillRect(0, 0, width, height);
    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0, 'white'); whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = whiteGrad; ctx.fillRect(0, 0, width, height);
    const blackGrad = ctx.createLinearGradient(0, 0, 0, height);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)'); blackGrad.addColorStop(1, 'black');
    ctx.fillStyle = blackGrad; ctx.fillRect(0, 0, width, height);
    const x = hsv.s * (width - 1);
    const y = (1 - hsv.v) * (height - 1);
    ctx.strokeStyle = hsv.v > 0.5 ? 'black' : 'white';
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = hsv.v > 0.5 ? 'white' : 'black'; ctx.lineWidth = 1; ctx.stroke();
  }, [hsv]);

  useEffect(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 30) {
      const { r, g, b } = hsvToRgb(i, 1, 1);
      grad.addColorStop(i / 360, `rgb(${r},${g},${b})`);
    }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
    const x = (hsv.h / 360) * (width - 1);
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.strokeRect(x - 2, 0, 4, height);
  }, [hsv.h]);

  const updateSV = (e: React.PointerEvent) => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s = clamp((e.clientX - rect.left) / (rect.width - 1), 0, 1);
    const v = clamp(1 - (e.clientY - rect.top) / (rect.height - 1), 0, 1);
    const nextHsv = { ...hsv, s, v }; setHsv(nextHsv);
    const nextRgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
    onChange(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  const updateH = (e: React.PointerEvent) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let h = clamp(((e.clientX - rect.left) / (rect.width - 1)) * 360, 0, 360);
    if (h === 360) h = 359.99;
    const nextHsv = { ...hsv, h }; setHsv(nextHsv);
    const nextRgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
    onChange(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 select-none pointer-events-auto bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-brand-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.colorPalette}</span>
        </div>
        <div className="text-[7px] font-mono text-slate-400 uppercase text-right leading-tight">
          H:{hsv.h.toFixed(0)} S:{(hsv.s*100).toFixed(0)}% V:{(hsv.v*100).toFixed(0)}%<br/>
          RGB({rgb.r},{rgb.g},{rgb.b})
        </div>
      </div>
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 shadow-inner">
        <canvas
            ref={svCanvasRef} width={300} height={225}
            className="w-full h-full cursor-crosshair block touch-none"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setIsDraggingSV(true); updateSV(e); }}
            onPointerMove={(e) => isDraggingSV && updateSV(e)}
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); setIsDraggingSV(false); }}
        />
      </div>
      <div className="relative h-5 rounded-full overflow-hidden border border-slate-200 shadow-sm">
        <canvas
            ref={hueCanvasRef} width={300} height={20}
            className="w-full h-full cursor-ew-resize block touch-none"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setIsDraggingH(true); updateH(e); }}
            onPointerMove={(e) => isDraggingH && updateH(e)}
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); setIsDraggingH(false); }}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-9 rounded-md shadow-inner border border-slate-200 flex items-center justify-center text-[10px] font-mono font-bold" style={{ backgroundColor: hex, color: getContrastYIQ(hex) }}>
            {hex}
        </div>
        <button onClick={handleCopy} className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-500 hover:text-brand-600 transition flex items-center gap-1 shadow-sm">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            <span className="text-[10px] font-bold uppercase">{copied ? t.copied : t.copy}</span>
        </button>
      </div>
    </div>
  );
};

// --- Lab Implementation ---

const getParamLocations = (code: string, params: ParameterDefinition[], lang: string) => {
  const locations: { label: string, start: number, end: number }[] = [];
  
  // Find start of args
  const openParenIndex = code.indexOf('(');
  if (openParenIndex === -1) return [];
  
  let currentIndex = openParenIndex + 1;
  
  for (let i = 0; i < params.length; i++) {
    // 1. Skip leading whitespace
    while (code[currentIndex] === ' ' && currentIndex < code.length) currentIndex++;
    
    const start = currentIndex;
    
    // 2. Find end of this arg
    let inQuote = false;
    let quoteChar = '';
    let end = start;
    
    while (end < code.length) {
      const char = code[end];
      
      if (inQuote) {
        if (char === quoteChar) inQuote = false;
      } else {
        if (char === '"' || char === "'") {
          inQuote = true;
          quoteChar = char;
        } else if (char === ',' || char === ')') {
          break; // Found delimiter
        }
      }
      end++;
    }
    
    // Trim trailing whitespace from the token range
    let actualEnd = end;
    while (actualEnd > start && code[actualEnd - 1] === ' ') {
      actualEnd--;
    }

    if (actualEnd > start) {
      const paramName = params[i].name;
      const tKey = `param_${paramName}`;
      // @ts-ignore
      const translatedLabel = UI_TRANSLATIONS[lang]?.[tKey] || params[i].label;

      locations.push({
        label: translatedLabel,
        start: start,
        end: actualEnd
      });
    }
    
    // Setup for next
    currentIndex = end;
    if (code[currentIndex] === ',') currentIndex++;
  }
  
  return locations;
};

const CommandLab: React.FC<Props> = ({ block, readOnly = false, lang = 'sv' }) => {
  const [selectedCommandId, setSelectedCommandId] = useState(block.targetCommandId || 'circle');
  const [code, setCode] = useState(block.initialCode);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [parsedParams, setParsedParams] = useState<(string | number)[]>([]);

  const drawCountRef = useRef(0);
  const latestStateRef = useRef({ code, previewCode, def: COMMAND_REGISTRY[selectedCommandId] });

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [paramSnapshot, setParamSnapshot] = useState<(string | number)[]>([]);

  const [showDebug, setShowDebug] = useState(false);
  const [sigFontSize, setSigFontSize] = useState(() => parseInt(localStorage.getItem('kodlab_sig_font') || '12'));

  // Label Overlay Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  // Measurement ref for char width
  const measureRef = useRef<HTMLSpanElement>(null);
  const [charWidth, setCharWidth] = useState(0);

  const t = UI_TRANSLATIONS[lang];

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.style.transform = `translateX(-${e.currentTarget.scrollLeft}px)`;
    }
  };

  const def = COMMAND_REGISTRY[selectedCommandId];

  // Compute parameter locations and layout for visual enhancement
  const labelLayout = useMemo(() => {
    if (code.includes('\n') || charWidth === 0) return [];
    
    const locations = getParamLocations(code, def.params, lang);
    if (locations.length === 0) return [];

    // Measure label widths with a canvas to match font-medium sans-serif
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    
    // Approximate the font stack used by Tailwind's font-sans at font-medium weight
    ctx.font = `500 ${sigFontSize}px ui-sans-serif, system-ui, sans-serif`;

    const items = locations.map(loc => {
        const textMetrics = ctx.measureText(loc.label);
        const labelWidth = textMetrics.width;
        
        // Calculate center position based on token location and monospace char width
        // centerPixel = Left Padding (16px) + (Start Index * Char Width) + (Token Length * Char Width / 2)
        const tokenCenter = 16 + (loc.start * charWidth) + ((loc.end - loc.start) * charWidth / 2);
        let left = tokenCenter - (labelWidth / 2);
        
        return {
            ...loc,
            width: labelWidth,
            left: left
        };
    });

    // Collision avoidance: Enforce minimum gap
    const MIN_GAP = 8; // pixels
    
    for (let i = 1; i < items.length; i++) {
        const prev = items[i-1];
        const curr = items[i];
        
        const prevRight = prev.left + prev.width;
        if (curr.left < prevRight + MIN_GAP) {
            // Shift current label to the right
            curr.left = prevRight + MIN_GAP;
        }
    }

    return items;
  }, [code, def.params, charWidth, sigFontSize, lang]);

  useEffect(() => {
    latestStateRef.current = { code, previewCode, def: COMMAND_REGISTRY[selectedCommandId] };
  }, [code, previewCode, selectedCommandId]);

  // Measure char width whenever font size changes
  useLayoutEffect(() => {
    if (measureRef.current) {
       const width = measureRef.current.getBoundingClientRect().width;
       setCharWidth(width / 10);
    }
  }, [sigFontSize]);

  // Continuous deterministic redraw loop
  useLayoutEffect(() => {
    let frameId: number;
    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const { code: currentCode, previewCode: currentPreview, def: currentDef } = latestStateRef.current;
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== TOTAL_LOGICAL_SIZE * dpr || canvas.height !== TOTAL_LOGICAL_SIZE * dpr) {
          canvas.width = TOTAL_LOGICAL_SIZE * dpr;
          canvas.height = TOTAL_LOGICAL_SIZE * dpr;
          canvas.style.width = `${TOTAL_LOGICAL_SIZE}px`;
          canvas.style.height = `${TOTAL_LOGICAL_SIZE}px`;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.resetTransform();
          ctx.scale(dpr, dpr);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, TOTAL_LOGICAL_SIZE, TOTAL_LOGICAL_SIZE);
          ctx.translate(MARGIN, MARGIN);

          // Draw Grid
          const step = 100;
          ctx.lineWidth = 1; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          for (let i = 0; i <= CONTENT_SIZE; i += step) {
            ctx.strokeStyle = i === 0 || i === CONTENT_SIZE ? '#cbd5e1' : '#f1f5f9';
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CONTENT_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CONTENT_SIZE, i); ctx.stroke();
          }
          ctx.fillStyle = '#64748b';
          for (let i = step; i <= CONTENT_SIZE; i += step) {
            ctx.fillText(i.toString(), i, -15);
            ctx.fillText(i.toString(), -20, i);
          }
          ctx.fillText("0", -10, -10);

          try {
            executeCode(currentPreview || currentCode, ctx, CONTENT_SIZE, CONTENT_SIZE);
            drawCountRef.current++;
          } catch (err: any) {
             // Loop continues
          }
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const params = parseCommandParams(previewCode || code, def.functionName);
    if (params) setParsedParams(params);
  }, [code, previewCode, def.functionName]);

  useEffect(() => {
    localStorage.setItem('kodlab_sig_font', sigFontSize.toString());
  }, [sigFontSize]);

  const handleCommandSwitch = (newId: string) => {
    const newDef = COMMAND_REGISTRY[newId];
    if (!newDef) return;
    const args = newDef.params.map(p => typeof p.defaultValue === 'string' ? `"${p.defaultValue}"` : p.defaultValue).join(', ');
    setSelectedCommandId(newId);
    setCode(`${newDef.functionName}(${args});`);
    setPreviewCode(null);
  };

  const getContentCoordinates = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const scale = TOTAL_LOGICAL_SIZE / rect.width;
    return { x: ((e.clientX - rect.left) * scale) - MARGIN, y: ((e.clientY - rect.top) * scale) - MARGIN };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const { x, y } = getContentCoordinates(e);
    const values: Record<string, any> = {};
    def.params.forEach((p, i) => values[p.name] = parsedParams[i] ?? p.defaultValue);
    const hitId = def.hitTest(x, y, values);
    if (hitId) { setDragId(hitId); setDragStart({ x, y }); setParamSnapshot([...parsedParams]); }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getContentCoordinates(e);
    if (!dragId || !dragStart) {
      if (def && canvasRef.current) {
        const values: Record<string, any> = {};
        def.params.forEach((p, i) => values[p.name] = parsedParams[i] ?? p.defaultValue);
        canvasRef.current.style.cursor = def.hitTest(x, y, values) ? 'crosshair' : 'default';
      }
      return;
    }
    const dx = x - dragStart.x; const dy = y - dragStart.y;
    const currentParams = [...paramSnapshot];
    const updateP = (name: string | undefined, delta: number) => {
      const pDef = def.params.find(p => p.name === name);
      if (pDef) currentParams[pDef.index] = Math.round(((paramSnapshot[pDef.index] as number) || 0) + delta);
    };
    if (dragId === 'body' && def.interaction.position) { updateP(def.interaction.position.x, dx); updateP(def.interaction.position.y, dy); }
    else if (dragId === 'resize' && selectedCommandId === 'circle') updateP('r', dx);
    else if (dragId.startsWith('resize')) {
      if (dragId.includes('w')) updateP('w', dx);
      if (dragId.includes('h')) updateP('h', dy);
      if (dragId.includes('r')) updateP('r', dx);
      if (dragId.includes('th')) updateP('th', -dy);
    }
    setCode(updateCodeParams(code, def.functionName, currentParams));
  };

  const handleParamChange = (index: number, value: string | number) => {
    const currentParams = [...parsedParams];
    currentParams[index] = value;
    const nextCode = updateCodeParams(code, def.functionName, currentParams);
    setCode(nextCode);
    setPreviewCode(null);
  };

  // Calculate dynamic padding to ensure labels fit comfortably
  const textareaPadding = Math.max(32, sigFontSize + 16);
  // Calculate label top position relative to container
  const labelTop = textareaPadding - sigFontSize - 2;

  return (
    <div className="w-full my-8 font-sans">
      <div data-draw-count={drawCountRef.current} className="hidden" aria-hidden="true" />
      <div className="flex flex-col lg:grid lg:grid-cols-[520px_minmax(0,1fr)] gap-6 items-start">
        <div className="flex flex-col gap-6 w-full lg:h-[682px]">
          <Card className="flex-none shadow-sm border-slate-200">
            <SectionHeader icon={Code2} title={t.jsCode} action={
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden mr-2">
                    <button onClick={() => setSigFontSize(Math.max(8, sigFontSize - 2))} className="p-1.5 hover:bg-slate-50 border-r border-slate-200" title={t.decreaseText}>
                        <Minus size={12} />
                    </button>
                    <span className="px-2 text-[10px] font-bold text-slate-500 w-10 text-center">{sigFontSize}px</span>
                    <button onClick={() => setSigFontSize(Math.min(32, sigFontSize + 2))} className="p-1.5 hover:bg-slate-50 border-l border-slate-200" title={t.increaseText}>
                        <Plus size={12} />
                    </button>
                </div>
                <select value={selectedCommandId} onChange={(e) => handleCommandSwitch(e.target.value)} className="appearance-none bg-brand-50 text-brand-700 text-xs font-bold pl-3 pr-8 py-1.5 rounded-md border border-brand-100 focus:outline-none cursor-pointer">
                  {Object.values(COMMAND_REGISTRY).map(c => (<option key={c.id} value={c.id}>{c.functionName.toUpperCase()}</option>))}
                </select>
              </div>
            } />
            <div className="relative bg-slate-900 group" dir="ltr">
              {/* Measurement Span */}
              <span ref={measureRef} className="font-mono absolute opacity-0 pointer-events-none -z-10" style={{ fontSize: `${sigFontSize}px` }}>0000000000</span>

              {/* Parameter Label Overlay */}
              <div 
                className="absolute top-0 left-0 right-0 h-full pointer-events-none select-none overflow-hidden z-10" 
                aria-hidden="true"
              >
                 <div 
                    ref={overlayRef}
                    className="absolute top-0 left-0 w-full h-full"
                 >
                    {labelLayout.map((item, i) => (
                         <div key={i} style={{ 
                            position: 'absolute', 
                            left: `${item.left}px`,
                            top: `${labelTop}px`,
                            fontSize: `${sigFontSize}px`,
                            width: `${item.width}px`,
                            textAlign: 'center'
                         }}
                         className="text-white/90 font-medium leading-none"
                         >
                            {item.label}
                         </div>
                    ))}
                 </div>
              </div>

              <textarea 
                className="w-full h-40 p-4 font-mono bg-transparent text-emerald-400 focus:outline-none resize-none code-scroll relative z-0" 
                style={{ 
                    fontSize: `${sigFontSize}px`, 
                    paddingTop: `${textareaPadding}px`, 
                    lineHeight: '1.5'
                }} 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                onScroll={handleScroll}
                spellCheck={false} 
              />
              {error && <div className="absolute bottom-0 inset-x-0 bg-red-500/90 text-white text-xs px-3 py-2 z-20">Line 1: {error}</div>}
            </div>
          </Card>
          <Card className="flex-1 min-h-[400px] lg:min-h-0 shadow-sm border-slate-200 flex flex-col">
            <SectionHeader icon={Sliders} title={t.parameters} />
            <div className="p-5 space-y-6 overflow-y-auto flex-1 code-scroll">
              {def.params.map((param) => {
                const currentVal = parsedParams[param.index];
                if (currentVal === undefined) return null;
                const tKey = `param_${param.name}`;
                // @ts-ignore
                const label = UI_TRANSLATIONS[lang]?.[tKey] || param.label;
                return (
                  <div key={param.name}>
                    <div className="flex justify-between items-end mb-2"><Label>{label}</Label></div>
                    {param.type === 'number' && <input type="range" min={param.min ?? -100} max={param.max ?? 700} step={param.step || 1} value={currentVal as number} onChange={(e) => handleParamChange(param.index, parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />}
                    {param.type === 'color' && <CustomColorPicker value={currentVal as string} onChange={(hex) => handleParamChange(param.index, hex)} lang={lang} />}
                    {param.type === 'string' && <input type="text" value={currentVal} onChange={(e) => handleParamChange(param.index, e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div className="flex justify-center lg:justify-start items-start w-full h-full overflow-visible p-1">
          <div className="relative flex-shrink-0 rounded-xl shadow-2xl border border-slate-200 bg-white">
            <canvas ref={canvasRef} style={{ width: `${TOTAL_LOGICAL_SIZE}px`, height: `${TOTAL_LOGICAL_SIZE}px` }} className="block touch-none bg-white rounded-xl" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setDragId(null)} onMouseLeave={() => setDragId(null)} />
            <div className="absolute top-4 right-4 flex gap-2 pointer-events-none">
              <div className="bg-slate-900/5 backdrop-blur text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/20">600 x 600 {t.canvasLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandLab;