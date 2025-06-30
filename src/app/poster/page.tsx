'use client';

import { useRef, useState, useEffect } from 'react';

export default function Poster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [title1Top, setTitle1Top] = useState('Project titel');
  const [title1Bottom, setTitle1Bottom] = useState('Project titel');

  const [toolMode, setToolMode] = useState<'draw' | 'move'>('draw');

  const [aspectRatio, setAspectRatio] = useState('1:1');

  const aspectRatioMap: { [key: string]: number } = {
    '1:1': 1,
    '4:5': 4 / 5,
    '9:16': 9 / 16,
    '1,91:1': 1.91,
    '16:9': 16 / 9,
    '1:1.414': 1 / 1.414,
  };

  const colorFamilies = [
    ['rgb(87,43,2)', 'rgb(228,234,97)', 'rgb(214,220,221)'],
    ['rgb(173,252,247)', 'rgb(255,102,49)', 'rgb(87,43,2)'],
    ['rgb(255,255,55)', 'rgb(207,246,98)', 'rgb(1,95,81)'],
    ['rgb(31,46,255)', 'rgb(255,0,0)', 'rgb(151,207,239)'],
    ['rgb(255,0,0)', 'rgb(1,95,81)', 'rgb(227,191,238)'],
    ['rgb(71,8,20)', 'rgb(173,252,247)', 'rgb(172,62,46)'],
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
      setImageOffset({ x: 0, y: 0 });
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
            tempCtx.drawImage(img, 0, 0);
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = brushColor;
            tempCtx.fillRect(0, 0, img.width, img.height);
            const tintedPattern = ctx.createPattern(tempCanvas, 'repeat');
            ctx.strokeStyle = tintedPattern || brushColor;
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
    if (toolMode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    applyBrushSettings(ctx);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || toolMode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== 'move') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
  };

  const onDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || toolMode !== 'move' || !dragStart) return;
    setImageOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const resizeCanvasToFrame = () => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (canvas && frame) {
      const ratio = aspectRatioMap[aspectRatio];
      const width = frame.clientWidth;
      const height = width / ratio;
  
      const dpr = window.devicePixelRatio || 1;
  
      // ✅ Backup existing canvas content
      const prevImage = canvas.toDataURL();
  
      canvas.width = width * dpr;
      canvas.height = height * dpr;
  
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
  
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.scale(dpr, dpr);
  
        // ✅ Restore previous drawing
        const img = new Image();
        img.src = prevImage;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
      }
  
      frame.style.height = `${height}px`;
    }
  };
  

  useEffect(() => {
    resizeCanvasToFrame();
    window.addEventListener('resize', resizeCanvasToFrame);
    return () => window.removeEventListener('resize', resizeCanvasToFrame);
  }, [aspectRatio]);

  const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (toolMode !== 'draw') return;
  
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const rect = canvas.getBoundingClientRect(); // ✅ Safe now
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
  
    applyBrushSettings(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };
  
  
  const touchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || toolMode !== 'draw') return;
  
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const rect = canvas.getBoundingClientRect(); // ✅ Safe now
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
  
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  
  const stopTouchDrawing = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isDrawing) e.preventDefault();
    };
  
    document.addEventListener('touchmove', preventDefault, { passive: false });
  
    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [isDrawing]);
  
  


  return (
    <div className="poster-wrapper p-4 space-y-4">
      <div className="options space-y-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} />

        <label>
          Tool Mode:
          <select value={toolMode} onChange={(e) => setToolMode(e.target.value as 'draw' | 'move')} className="ml-2">
            <option value="draw">Draw</option>
            <option value="move">Move Image</option>
          </select>
        </label>


        <label>
          Canvas Ratio:
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="ml-2">
            {Object.keys(aspectRatioMap).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </label>

        <div className="color-families">
          <label className="font-bold mr-2">Color Palette:</label>
          <select
            value={selectedFamilyIndex}
            onChange={(e) => {
              const newIndex = parseInt(e.target.value);
              setSelectedFamilyIndex(newIndex);
              setBrushColor(colorFamilies[newIndex][0]);
            }}
            className="ml-2"
          >
            {colorFamilies.map((_, index) => (
              <option key={index} value={index}>Palette {index + 1}</option>
            ))}
          </select>

          <div className="color-family mt-2 flex gap-2">
            {colorFamilies[selectedFamilyIndex].map((color) => (
              <button
                key={color}
                className={`color-swatch ${brushColor === color ? 'ring-2 ring-black' : ''}`}
                style={{ backgroundColor: color, width: '30px', height: '30px', borderRadius: '9999px', border: '1px solid #ccc' }}
                onClick={() => setBrushColor(color)}
              />
            ))}
          </div>
        </div>

        <label>
          Brush Size:
          <input type="range" min={1} max={50} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="ml-2" />
          <span className="ml-2">{brushSize}px</span>
        </label>

        <label>
          Brush Shape:
          <select value={brushShape} onChange={(e) => setBrushShape(e.target.value as 'round' | 'square')} className="ml-2">
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
        </label>

        <label>
          Brush Type:
          <select
            value={brushType}
            onChange={(e) => setBrushType(e.target.value as 'default' | 'fine-liner' | 'charcoal' | 'watermark')}
            className="ml-2"
          >
            <option value="default">Default</option>
            <option value="fine-liner">Fine Liner</option>
            <option value="charcoal">Charcoal</option>
            <option value="watermark">Watermark</option>
          </select>
        </label>
        <div className="space-y-2">
          <label>
            1:
            <input
              type="text"
              value={title1Top}
              onChange={(e) => setTitle1Top(e.target.value)}
              className="ml-2 border px-2 py-1"
            />
          </label>
            <br/>
          <label>
            2:
            <input
              type="text"
              value={title1Bottom}
              onChange={(e) => setTitle1Bottom(e.target.value)}
              className="ml-2 border px-2 py-1"
            />
          </label>
        </div>
      </div>

      <div
        ref={frameRef}
        className="frame relative overflow-hidden border border-gray-300"
        onMouseDown={startDrag}
        onMouseMove={onDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {imageURL && (
          <img
            ref={imageRef}
            src={imageURL}
            alt="Uploaded"
            className="absolute top-0 left-0 z-0"
            style={{ pointerEvents: 'none', transform: `translate(${imageOffset.x}px, ${imageOffset.y}px)` }}
          />
        )}

        <div className="title-wrapper t1">
          <div className='wrapper'>
            <h1 className="title1">{title1Top}</h1>
            <div className="line"></div>
          </div>
          <div className='wrapper'>
            <div className="line"></div>
            <h1 className="title1">{title1Bottom}</h1>
          </div>
        </div>


        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startTouchDrawing}
          onTouchMove={touchDraw}
          onTouchEnd={stopTouchDrawing}
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
