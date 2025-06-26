'use client';

import { useRef, useState, useEffect } from 'react';

export default function Poster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const colorFamilies = [
    ['rgb(87,43,2)', 'rgb(228,234,97)', 'rgb(214,220,221)'], // Bodem en voedsel 1
    ['rgb(173,252,247)', 'rgb(255,102,49)', 'rgb(87,43,2)'], // Bodem en voedsel 2
    ['rgb(255,255,55)', 'rgb(207,246,98)', 'rgb(1,95,81)'], // Ontwerpende aanpak / social design
    ['rgb(31,46,255)', 'rgb(255,0,0)', 'rgb(151,207,239)'], // Water en klimaat
    ['rgb(255,0,0)', 'rgb(1,95,81)', 'rgb(227,191,238)'], // Geven
    ['rgb(71,8,20)', 'rgb(173,252,247)', 'rgb(172,62,46)'], // Overig
  ];

  const [selectedFamilyIndex, setSelectedFamilyIndex] = useState(0);
  const [brushColor, setBrushColor] = useState(colorFamilies[0][0]);
  const [brushSize, setBrushSize] = useState(10);
  const [brushShape, setBrushShape] = useState<'round' | 'square'>('round');
  const [brushType, setBrushType] = useState<'default' | 'fine-liner' | 'charcoal' | 'watermark'>('default');
  const [charcoalPattern, setCharcoalPattern] = useState<CanvasPattern | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/charcoal-texture.png';
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
  
    switch (brushType) {
      case 'fine-liner':
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        break;
  
      case 'charcoal':
        if (charcoalPattern) {
          const img = new Image();
          img.src = '/charcoal-texture.png';
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
  
            // Draw the charcoal image
            tempCtx.drawImage(img, 0, 0);
  
            // Set the composite mode and fill with brush color
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = brushColor;
            tempCtx.fillRect(0, 0, img.width, img.height);
  
            const tintedPattern = ctx.createPattern(tempCanvas, 'repeat');
            if (tintedPattern) {
              ctx.strokeStyle = tintedPattern;
            } else {
              ctx.strokeStyle = brushColor;
            }
  
            ctx.lineWidth = brushSize;
            ctx.globalAlpha = 1;
          };
        } else {
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize;
          ctx.globalAlpha = 1;
        }
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

  const resizeCanvasToFrame = () => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (canvas && frame) {
      canvas.width = frame.clientWidth;
      canvas.height = frame.clientHeight;
    }
  };

  useEffect(() => {
    resizeCanvasToFrame();
    window.addEventListener('resize', resizeCanvasToFrame);
    return () => window.removeEventListener('resize', resizeCanvasToFrame);
  }, []);

  return (
    <div className="poster-wrapper p-4 space-y-4">
      <div className="options space-y-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} />

        {/* Palette Dropdown */}
        <div className="color-families">
          <label className="font-bold mr-2">Color Palette:</label>
          <select
            value={selectedFamilyIndex}
            onChange={(e) => {
              const newIndex = parseInt(e.target.value);
              setSelectedFamilyIndex(newIndex);
              setBrushColor(colorFamilies[newIndex][0]); // Update to first color
            }}
            className="ml-2"
          >
            {colorFamilies.map((_, index) => (
              <option key={index} value={index}>
                Palette {index + 1}
              </option>
            ))}
          </select>

          {/* Color Swatches */}
          <div className="color-family mt-2 flex gap-2">
            {colorFamilies[selectedFamilyIndex].map((color) => (
              <button
                key={color}
                className={`color-swatch ${brushColor === color ? 'ring-2 ring-black' : ''}`}
                style={{
                  backgroundColor: color,
                  width: '30px',
                  height: '30px',
                  borderRadius: '9999px',
                  border: '1px solid #ccc',
                }}
                onClick={() => setBrushColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Brush Settings */}
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

      <div ref={frameRef} className="frame relative overflow-hidden border border-gray-300">
        {imageURL && (
          <img
            src={imageURL}
            alt="Uploaded"
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            style={{ pointerEvents: 'none' }}
          />
        )}

        <div className="title-wrapper t1">
          <h1 className="title1" contentEditable>Project titel</h1>
          <div className="line"></div>
          <h1 className="title1" contentEditable>Project titel</h1>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />

        <div className="title-wrapper t2">
          <h1 className="title2">Fides</h1>
          <div className="line"></div>
          <h1 className="title2">Lapidaire</h1>
        </div>
      </div>
    </div>
  );
}
