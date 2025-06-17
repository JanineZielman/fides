'use client';

import { useRef, useState, useEffect } from 'react';

export default function Poster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(10);
  const [brushShape, setBrushShape] = useState<'round' | 'square'>('round');
  const [brushType, setBrushType] = useState<'default' | 'fine-liner' | 'charcoal' | 'watermark'>('default');

  const [charcoalPattern, setCharcoalPattern] = useState<CanvasPattern | null>(null);

  // Load charcoal texture
  useEffect(() => {
    const img = new Image();
    img.src = '/charcoal-texture.png'; // must be in /public
    img.onload = () => {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = img.width;
      patternCanvas.height = img.height;
      const patternCtx = patternCanvas.getContext('2d');
      patternCtx?.drawImage(img, 0, 0);
      const ctx = canvasRef.current?.getContext('2d');
      const pattern = ctx?.createPattern(patternCanvas, 'repeat');
      if (pattern) {
        setCharcoalPattern(pattern);
      }
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageURL(url);
    }
  };

  const applyBrushSettings = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = brushShape;
    ctx.lineJoin = 'round';

    // Choose settings based on brush type
    switch (brushType) {
      case 'fine-liner':
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        break;
      case 'charcoal':
        if (charcoalPattern) {
          ctx.strokeStyle = charcoalPattern;
        } else {
          ctx.strokeStyle = brushColor;
        }
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = 1;
        break;
      case 'watermark':
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = 0.1;
        break;
      default:
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = 1;
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    applyBrushSettings(ctx);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    if (imageURL && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = imageURL;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
    }
  }, [imageURL]);

  return (
    <div className="p-4 space-y-4">
      <input type="file" accept="image/*" onChange={handleImageUpload} />

      <div className="flex flex-wrap gap-4 items-center">
        <label>
          Brush Color:
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            disabled={brushType === 'charcoal'}
            className="ml-2"
          />
        </label>

        <label>
          Brush Size:
          <input
            type="range"
            min={1}
            max={50}
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="ml-2"
          />
          <span className="ml-2">{brushSize}px</span>
        </label>

        <label>
          Brush Shape:
          <select
            value={brushShape}
            onChange={(e) => setBrushShape(e.target.value as 'round' | 'square')}
            className="ml-2"
          >
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
        </label>

        <label>
          Brush Type:
          <select
            value={brushType}
            onChange={(e) =>
              setBrushType(e.target.value as 'default' | 'fine-liner' | 'charcoal' | 'watermark')
            }
            className="ml-2"
          >
            <option value="default">Default</option>
            <option value="fine-liner">Fine Liner</option>
            <option value="charcoal">Charcoal</option>
            <option value="watermark">Watermark</option>
          </select>
        </label>
      </div>

      <canvas
        ref={canvasRef}
        className="border rounded shadow"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
