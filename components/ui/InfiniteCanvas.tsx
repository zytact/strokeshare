'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type Point = {
    x: number;
    y: number;
};

type Line = {
    points: Point[];
    color: string;
};

export default function InfiniteCanvas() {
    const [isPanning, setIsPanning] = useState(false);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const [lines, setLines] = useState<Line[]>([]);
    const [currentLine, setCurrentLine] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState('#ffffff'); // Add color state
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Handle panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDrawingMode) {
            // Start drawing
            setIsDrawing(true);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left - position.x;
                const y = e.clientY - rect.top - position.y;
                setCurrentLine([{ x, y }]);
            }
        } else {
            // Start panning
            setIsPanning(true);
            setStartPan({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && !isDrawingMode) {
            setPosition({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y,
            });
        } else if (isDrawing && isDrawingMode) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left - position.x;
                const y = e.clientY - rect.top - position.y;
                setCurrentLine((prev) => [...prev, { x, y }]);
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setLines((prev) => [
                ...prev,
                { points: currentLine, color: currentColor }, // Use currentColor
            ]);
            setCurrentLine([]);
            setIsDrawing(false);
        }
        setIsPanning(false);
    };

    const toggleMode = () => {
        setIsDrawingMode(!isDrawingMode);
    };

    // Draw all lines
    const drawLines = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw completed lines
        lines.forEach((line) => {
            if (line.points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = line.color;
            ctx.lineWidth = 2;
            ctx.moveTo(line.points[0].x, line.points[0].y);

            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
            }
            ctx.stroke();
        });

        // Draw current line with currentColor
        if (currentLine.length >= 2) {
            ctx.beginPath();
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 2;
            ctx.moveTo(currentLine[0].x, currentLine[0].y);

            for (let i = 1; i < currentLine.length; i++) {
                ctx.lineTo(currentLine[i].x, currentLine[i].y);
            }
            ctx.stroke();
        }
    };

    // Update canvas when lines change
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            drawLines(ctx);
        }
    }, [lines, currentLine, drawLines]);

    return (
        <div className="relative h-full w-full">
            <div className="absolute left-4 top-4 z-10 flex gap-2">
                <Button
                    onClick={toggleMode}
                    className="rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm"
                >
                    {isDrawingMode ? 'Draw Mode' : 'Pan Mode'}
                </Button>
                {isDrawingMode && (
                    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                        <label htmlFor="colorPicker">Color:</label>
                        <input
                            id="colorPicker"
                            type="color"
                            value={currentColor}
                            onChange={(e) => setCurrentColor(e.target.value)}
                            className="h-6 w-6 cursor-pointer bg-transparent"
                        />
                    </div>
                )}
            </div>
            <div
                ref={containerRef}
                className={`h-full w-full overflow-hidden ${
                    isDrawingMode
                        ? 'cursor-crosshair'
                        : 'cursor-grab active:cursor-grabbing'
                }`}
                data-testid="infinite-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    className="relative h-[4000px] w-[4000px]"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        willChange: 'transform',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={4000}
                        height={4000}
                        className="absolute left-0 top-0"
                    />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                        <h2 className="text-xl">Infinite Canvas</h2>
                        <p>
                            Click and drag to {isDrawingMode ? 'draw' : 'pan'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
