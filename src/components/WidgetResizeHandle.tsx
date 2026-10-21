import { useRef } from 'react';

export function WidgetResizeHandle({ label, onResize }: { label: string; onResize: (width: number, height: number) => void }) {
  const origin = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  return <button type="button" className="daily-overlay-resize" aria-label={label} title={label}
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      origin.current = { x: event.screenX, y: event.screenY, width: window.outerWidth, height: window.outerHeight };
    }}
    onPointerMove={event => { const start = origin.current; if (start) onResize(start.width + event.screenX - start.x, start.height + event.screenY - start.y); }}
    onPointerUp={() => { origin.current = null; }} onLostPointerCapture={() => { origin.current = null; }}
    onKeyDown={event => {
      const delta = { ArrowRight: [20, 0], ArrowLeft: [-20, 0], ArrowDown: [0, 20], ArrowUp: [0, -20] }[event.key];
      if (delta) { event.preventDefault(); onResize(window.outerWidth + delta[0]!, window.outerHeight + delta[1]!); }
    }} />;
}
