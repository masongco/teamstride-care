import { useRef, useState, useEffect } from 'react';
import { Eraser, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

interface SignaturePadProps {
  onSignatureChange: (data: string, type: 'drawn' | 'typed') => void;
  signerName: string;
}

export function SignaturePad({ onSignatureChange, signerName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing styles
    ctx.strokeStyle = 'hsl(var(--foreground))';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill background
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl, 'drawn');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, rect.width, rect.height);
    onSignatureChange('', 'drawn');
  };

  const handleTypedSignatureChange = (value: string) => {
    setTypedSignature(value);
    if (value) {
      // Create a typed signature as data URL
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'hsl(var(--background))';
        ctx.fillRect(0, 0, 400, 100);
        ctx.font = 'italic 32px "Brush Script MT", cursive, serif';
        ctx.fillStyle = 'hsl(var(--foreground))';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, 200, 50);
        onSignatureChange(canvas.toDataURL('image/png'), 'typed');
      }
    } else {
      onSignatureChange('', 'typed');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'draw' | 'type')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Draw Signature
          </TabsTrigger>
          <TabsTrigger value="type">Type Signature</TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-3">
          <div className="relative border border-border rounded-lg overflow-hidden bg-background">
            <canvas
              ref={canvasRef}
              className="w-full h-32 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-2 left-2 right-2 border-t border-dashed border-muted-foreground/30" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Sign above the line using your mouse or finger
            </p>
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Eraser className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="type" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="typed-signature">Type your full legal name</Label>
            <Input
              id="typed-signature"
              value={typedSignature}
              onChange={(e) => handleTypedSignatureChange(e.target.value)}
              placeholder={signerName}
              className="text-xl italic"
              style={{ fontFamily: '"Brush Script MT", cursive, serif' }}
            />
          </div>
          {typedSignature && (
            <div className="p-4 border border-border rounded-lg bg-background">
              <p 
                className="text-3xl italic text-center"
                style={{ fontFamily: '"Brush Script MT", cursive, serif' }}
              >
                {typedSignature}
              </p>
              <div className="mt-2 border-t border-dashed border-muted-foreground/30" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
