import { CommandDefinition } from "../types";

const CANVAS_SIZE = 600;

// Helper to calculate distance
const dist = (x1: number, y1: number, x2: number, y2: number) => 
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

// Helper to check bounds and apply ghosting style
const applyGhosting = (ctx: CanvasRenderingContext2D, isOut: boolean) => {
  if (isOut) {
    ctx.globalAlpha = 0.4;
    return true;
  }
  ctx.globalAlpha = 1.0;
  return false;
};

const drawHandle = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string = '#0ea5e9') => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
};

const isRectOut = (x: number, y: number, w: number, h: number) => 
  x < 0 || y < 0 || x + w > CANVAS_SIZE || y + h > CANVAS_SIZE;

const isCircleOut = (x: number, y: number, r: number) => 
  x - r < 0 || y - r < 0 || x + r > CANVAS_SIZE || y + r > CANVAS_SIZE;

const isPointOut = (x: number, y: number) => 
  x < 0 || y < 0 || x > CANVAS_SIZE || y > CANVAS_SIZE;

export const COMMAND_REGISTRY: Record<string, CommandDefinition> = {
  circle: {
    id: 'circle',
    functionName: 'circle',
    signature: 'circle(x, y, radie, "färg");',
    params: [
      { name: 'x', label: 'X', type: 'number', index: 0, min: -100, max: 700, defaultValue: 300 },
      { name: 'y', label: 'Y', type: 'number', index: 1, min: -100, max: 700, defaultValue: 300 },
      { name: 'r', label: 'Radie', type: 'number', index: 2, min: 10, max: 300, defaultValue: 50 },
      { name: 'color', label: 'Färg', type: 'color', index: 3, defaultValue: '#3b82f6' }
    ],
    interaction: {
      position: { x: 'x', y: 'y' },
      resize: { radius: 'r' }
    },
    draw: (ctx, v) => {
      ctx.save();
      const isOut = isCircleOut(v.x, v.y, v.r);
      applyGhosting(ctx, isOut);
      
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.r, 0, 2 * Math.PI);
      ctx.fillStyle = v.color;
      ctx.fill();
      
      if (isOut) {
          ctx.strokeStyle = v.color;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
      }
      
      // Handle for radius
      drawHandle(ctx, v.x + v.r, v.y);
      ctx.restore();
    },
    hitTest: (mx, my, v) => {
      const d = dist(mx, my, v.x, v.y);
      if (dist(mx, my, v.x + v.r, v.y) < 15) return 'resize';
      if (d < v.r) return 'body';
      return null;
    }
  },
  rect: {
    id: 'rect',
    functionName: 'rectangle',
    signature: 'rectangle(x, y, bredd, höjd, "färg");',
    params: [
      { name: 'x', label: 'X', type: 'number', index: 0, min: -100, max: 700, defaultValue: 150 },
      { name: 'y', label: 'Y', type: 'number', index: 1, min: -100, max: 700, defaultValue: 150 },
      { name: 'w', label: 'Bredd', type: 'number', index: 2, min: 10, max: 500, defaultValue: 150 },
      { name: 'h', label: 'Höjd', type: 'number', index: 3, min: 10, max: 500, defaultValue: 100 },
      { name: 'color', label: 'Färg', type: 'color', index: 4, defaultValue: '#ef4444' }
    ],
    interaction: {
      position: { x: 'x', y: 'y' },
      resize: { width: 'w', height: 'h' }
    },
    draw: (ctx, v) => {
      ctx.save();
      const isOut = isRectOut(v.x, v.y, v.w, v.h);
      applyGhosting(ctx, isOut);

      ctx.fillStyle = v.color;
      ctx.fillRect(v.x, v.y, v.w, v.h);

      if (isOut) {
          ctx.strokeStyle = v.color;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(v.x, v.y, v.w, v.h);
      }

      // Handles
      drawHandle(ctx, v.x + v.w, v.y + v.h / 2); // Right (Width)
      drawHandle(ctx, v.x + v.w / 2, v.y + v.h); // Bottom (Height)
      drawHandle(ctx, v.x + v.w, v.y + v.h); // Corner (Both)
      ctx.restore();
    },
    hitTest: (mx, my, v) => {
      if (dist(mx, my, v.x + v.w, v.y + v.h) < 15) return 'resize:wh';
      if (dist(mx, my, v.x + v.w, v.y + v.h / 2) < 15) return 'resize:w';
      if (dist(mx, my, v.x + v.w / 2, v.y + v.h) < 15) return 'resize:h';
      
      if (mx >= v.x && mx <= v.x + v.w && my >= v.y && my <= v.y + v.h) return 'body';
      return null;
    }
  },
  triangle: {
    id: 'triangle',
    functionName: 'triangle',
    signature: 'triangle(x1, y1, x2, y2, x3, y3, "färg");',
    params: [
      { name: 'x1', label: 'X1', type: 'number', index: 0, min: -100, max: 700, defaultValue: 300 },
      { name: 'y1', label: 'Y1', type: 'number', index: 1, min: -100, max: 700, defaultValue: 100 },
      { name: 'x2', label: 'X2', type: 'number', index: 2, min: -100, max: 700, defaultValue: 200 },
      { name: 'y2', label: 'Y2', type: 'number', index: 3, min: -100, max: 700, defaultValue: 500 },
      { name: 'x3', label: 'X3', type: 'number', index: 4, min: -100, max: 700, defaultValue: 400 },
      { name: 'y3', label: 'Y3', type: 'number', index: 5, min: -100, max: 700, defaultValue: 500 },
      { name: 'color', label: 'Färg', type: 'color', index: 6, defaultValue: '#10b981' }
    ],
    interaction: {
      points: [
          { id: 'p1', x: 'x1', y: 'y1' },
          { id: 'p2', x: 'x2', y: 'y2' },
          { id: 'p3', x: 'x3', y: 'y3' }
      ]
    },
    draw: (ctx, v) => {
      ctx.save();
      const isOut = isPointOut(v.x1, v.y1) || isPointOut(v.x2, v.y2) || isPointOut(v.x3, v.y3);
      applyGhosting(ctx, isOut);

      ctx.beginPath();
      ctx.moveTo(v.x1, v.y1);
      ctx.lineTo(v.x2, v.y2);
      ctx.lineTo(v.x3, v.y3);
      ctx.closePath();
      ctx.fillStyle = v.color;
      ctx.fill();

      if (isOut) {
          ctx.strokeStyle = v.color;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
      }

      // Handles
      drawHandle(ctx, v.x1, v.y1, '#059669');
      drawHandle(ctx, v.x2, v.y2, '#059669');
      drawHandle(ctx, v.x3, v.y3, '#059669');
      ctx.restore();
    },
    hitTest: (mx, my, v) => {
      if (dist(mx, my, v.x1, v.y1) < 15) return 'point:p1';
      if (dist(mx, my, v.x2, v.y2) < 15) return 'point:p2';
      if (dist(mx, my, v.x3, v.y3) < 15) return 'point:p3';
      return null;
    }
  },
  ring: {
    id: 'ring',
    functionName: 'ring',
    signature: 'ring(x, y, radie, tjocklek, "färg");',
    params: [
      { name: 'x', label: 'X', type: 'number', index: 0, min: -100, max: 700, defaultValue: 300 },
      { name: 'y', label: 'Y', type: 'number', index: 1, min: -100, max: 700, defaultValue: 300 },
      { name: 'r', label: 'Radie', type: 'number', index: 2, min: 20, max: 300, defaultValue: 80 },
      { name: 'th', label: 'Tjocklek', type: 'number', index: 3, min: 2, max: 200, defaultValue: 40 },
      { name: 'color', label: 'Färg', type: 'color', index: 4, defaultValue: '#f59e0b' }
    ],
    interaction: {
      position: { x: 'x', y: 'y' },
      resize: { r: 'r', th: 'th' }
    },
    draw: (ctx, v) => {
      ctx.save();
      const isOut = isCircleOut(v.x, v.y, v.r);
      applyGhosting(ctx, isOut);

      const rout = v.r;
      const rin = Math.max(2, v.r - v.th);

      ctx.beginPath();
      ctx.arc(v.x, v.y, rout, 0, 2 * Math.PI, false);
      ctx.arc(v.x, v.y, rin, 0, 2 * Math.PI, true);
      ctx.closePath();
      ctx.fillStyle = v.color;
      ctx.fill('evenodd');

      if (isOut) {
        ctx.strokeStyle = v.color;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
      }

      // Handles
      drawHandle(ctx, v.x + v.r, v.y, '#d97706'); // outer radius
      drawHandle(ctx, v.x + (v.r - v.th), v.y, '#d97706'); // inner radius/thickness
      ctx.restore();
    },
    hitTest: (mx, my, v) => {
      const d = dist(mx, my, v.x, v.y);
      const rout = v.r;
      const rin = v.r - v.th;
      if (dist(mx, my, v.x + rout, v.y) < 15) return 'resize:r';
      if (dist(mx, my, v.x + rin, v.y) < 15) return 'resize:th';
      if (d < rout && d > rin) return 'body';
      return null;
    }
  },
  arc: {
    id: 'arc',
    functionName: 'arc',
    signature: 'arc(x, y, radie, vinkel, tjocklek, "färg");',
    params: [
      { name: 'x', label: 'X', type: 'number', index: 0, min: -100, max: 700, defaultValue: 300 },
      { name: 'y', label: 'Y', type: 'number', index: 1, min: -100, max: 700, defaultValue: 300 },
      { name: 'r', label: 'Radie', type: 'number', index: 2, min: 10, max: 300, defaultValue: 100 },
      { name: 'deg', label: 'Vinkel', type: 'number', index: 3, min: 1, max: 360, defaultValue: 180 },
      { name: 'th', label: 'Tjocklek', type: 'number', index: 4, min: 1, max: 100, defaultValue: 10 },
      { name: 'color', label: 'Färg', type: 'color', index: 5, defaultValue: '#8b5cf6' }
    ],
    interaction: {
      position: { x: 'x', y: 'y' },
      resize: { r: 'r', deg: 'deg' }
    },
    draw: (ctx, v) => {
      ctx.save();
      const isOut = isCircleOut(v.x, v.y, v.r);
      applyGhosting(ctx, isOut);

      const startRad = 0;
      const endRad = (v.deg * Math.PI) / 180;

      ctx.beginPath();
      // Implementation of flip: use anticlockwise=true to draw "up" from 3 o'clock
      ctx.arc(v.x, v.y, v.r, startRad, endRad, true);
      ctx.strokeStyle = v.color;
      ctx.lineWidth = v.th;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (isOut) {
         ctx.setLineDash([5, 5]);
         ctx.lineWidth = 1;
         ctx.stroke();
      }

      // Radius handle (mid-arc or at 0 degrees)
      drawHandle(ctx, v.x + v.r, v.y, '#7c3aed');
      // Angle handle (at the end of the arc)
      const ax = v.x + v.r * Math.cos(endRad);
      const ay = v.y - v.r * Math.sin(endRad); // flipped Y
      drawHandle(ctx, ax, ay, '#7c3aed');

      ctx.restore();
    },
    hitTest: (mx, my, v) => {
      const endRad = (v.deg * Math.PI) / 180;
      const ax = v.x + v.r * Math.cos(endRad);
      const ay = v.y - v.r * Math.sin(endRad);

      if (dist(mx, my, v.x + v.r, v.y) < 15) return 'resize:r';
      if (dist(mx, my, ax, ay) < 15) return 'resize:deg';

      const d = dist(mx, my, v.x, v.y);
      if (Math.abs(d - v.r) < v.th / 2 + 10) return 'body';
      return null;
    }
  },
  line: {
    id: 'line',
    functionName: 'line',
    signature: 'line(x1, y1, x2, y2, tjocklek, "färg");',
    params: [
      { name: 'x1', label: 'X1', type: 'number', index: 0, min: -100, max: 700, defaultValue: 50 },
      { name: 'y1', label: 'Y1', type: 'number', index: 1, min: -100, max: 700, defaultValue: 50 },
      { name: 'x2', label: 'X2', type: 'number', index: 2, min: -100, max: 700, defaultValue: 350 },
      { name: 'y2', label: 'Y2', type: 'number', index: 3, min: -100, max: 700, defaultValue: 350 },
      { name: 'th', label: 'Tjocklek', type: 'number', index: 4, min: 1, max: 100, defaultValue: 5 },
      { name: 'color', label: 'Färg', type: 'color', index: 5, defaultValue: '#000000' }
    ],
    interaction: {
      points: [
          { id: 'p1', x: 'x1', y: 'y1' },
          { id: 'p2', x: 'x2', y: 'y2' }
      ]
    },
    draw: (ctx, v) => {
      ctx.save();
      const isOut = isPointOut(v.x1, v.y1) || isPointOut(v.x2, v.y2);
      applyGhosting(ctx, isOut);
      
      ctx.beginPath();
      ctx.moveTo(v.x1, v.y1);
      ctx.lineTo(v.x2, v.y2);
      ctx.strokeStyle = v.color;
      ctx.lineWidth = v.th;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (isOut) {
        ctx.strokeStyle = v.color;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Midpoint handle for thickness
      const mx = (v.x1 + v.x2) / 2;
      const my = (v.y1 + v.y2) / 2;
      
      // Calculate normal vector for offset
      const dx = v.x2 - v.x1;
      const dy = v.y2 - v.y1;
      const len = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / len;
      const ny = dx / len;
      const offset = v.th / 2 + 10;
      
      drawHandle(ctx, mx + nx * offset, my + ny * offset, '#475569');
      drawHandle(ctx, v.x1, v.y1, '#475569');
      drawHandle(ctx, v.x2, v.y2, '#475569');

      ctx.restore();
    },
    hitTest: (mx, my, v) => {
      if (dist(mx, my, v.x1, v.y1) < 15) return 'point:p1';
      if (dist(mx, my, v.x2, v.y2) < 15) return 'point:p2';
      
      // Thickness handle hit test
      const midx = (v.x1 + v.x2) / 2;
      const midy = (v.y1 + v.y2) / 2;
      const dx = v.x2 - v.x1;
      const dy = v.y2 - v.y1;
      const len = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / len;
      const ny = dx / len;
      const offset = v.th / 2 + 10;
      if (dist(mx, my, midx + nx * offset, midy + ny * offset) < 15) return 'resize:th';

      return null;
    }
  },
  text: {
    id: 'text',
    functionName: 'text',
    signature: 'text(x, y, storlek, "textsträng", "färg");',
    params: [
      { name: 'x', label: 'X', type: 'number', index: 0, min: -100, max: 700, defaultValue: 300 },
      { name: 'y', label: 'Y', type: 'number', index: 1, min: -100, max: 700, defaultValue: 300 },
      { name: 'size', label: 'Storlek', type: 'number', index: 2, min: 8, max: 200, defaultValue: 40 },
      { name: 'msg', label: 'Text', type: 'string', index: 3, defaultValue: 'Kod är kul!' },
      { name: 'color', label: 'Färg', type: 'color', index: 4, defaultValue: '#000000' }
    ],
    interaction: {
      position: { x: 'x', y: 'y' },
      resize: { size: 'size' }
    },
    draw: (ctx, v) => {
      ctx.save();
      const isOut = isPointOut(v.x, v.y);
      applyGhosting(ctx, isOut);

      ctx.fillStyle = v.color;
      ctx.font = `bold ${v.size}px sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(v.msg, v.x, v.y);
      
      // Measure text for handles
      const metrics = ctx.measureText(v.msg);
      const w = metrics.width;
      
      // Size handle at bottom-right
      drawHandle(ctx, v.x + w, v.y);
      ctx.restore();
    },
    hitTest: (mx, my, v) => {
      // Need a context to measure text
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.font = `bold ${v.size}px sans-serif`;
      const w = ctx.measureText(v.msg).width;
      const h = v.size;

      if (dist(mx, my, v.x + w, v.y) < 15) return 'resize:sz';
      if (mx >= v.x && mx <= v.x + w && my >= v.y - h && my <= v.y) return 'body';
      return null;
    }
  }
};