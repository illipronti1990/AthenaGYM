'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Button } from '../Button';

export function SignaturePad({
  label = 'Assine aqui',
  onSave,
}: {
  label?: ReactNode;
  onSave: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
  }, []);

  function pos(e: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || empty) return;
    onSave(canvas.toDataURL('image/png'));
  }

  return (
    <div className="athena-field" data-testid="signature-pad">
      {label ? <span className="athena-label">{label}</span> : null}
      <canvas
        ref={canvasRef}
        className="athena-signature-canvas"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = e.currentTarget.getContext('2d');
          const p = pos(e);
          ctx?.beginPath();
          ctx?.moveTo(p.x, p.y);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext('2d');
          const p = pos(e);
          ctx?.lineTo(p.x, p.y);
          ctx?.stroke();
          setEmpty(false);
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={clear}>
          Limpar
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={empty}>
          Salvar assinatura
        </Button>
      </div>
    </div>
  );
}
