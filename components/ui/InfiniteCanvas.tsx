'use client';

import { useEffect, useRef, useState } from 'react';
import { useLineStore } from '@/store/useLineStore';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import Clear from '@/components/ui/Clear';
import { Undo, Hand, SquarePen } from 'lucide-react';

export default function InfiniteCanvas() {
    const { theme } = useTheme();
    const [isPanning, setIsPanning] = useState(false);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const { lines, addLine, removeLine } = useLineStore();
    const [currentLine, setCurrentLine] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState(() =>
        theme === 'dark' ? '#ffffff' : '#000000',
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        setCurrentColor(theme === 'dark' ? '#ffffff' : '#000000');
    }, [theme]);

    // Handle canvas resizing
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const updateCanvasSize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        updateCanvasSize();

        const resizeObserver = new ResizeObserver(updateCanvasSize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const handleUndo = () => {
        removeLine(lines.length - 1);
    };

    // Handle panning and drawing
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDrawingMode) {
            setIsDrawing(true);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left + position.x;
                const y = e.clientY - rect.top + position.y;
                setCurrentLine([{ x, y }]);
            }
        } else {
            setIsPanning(true);
            setStartPan({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && !isDrawingMode) {
            const deltaX = e.clientX - startPan.x;
            const deltaY = e.clientY - startPan.y;
            // Invert the deltas here to move in the intuitive direction
            setPosition((prev) => ({
                x: prev.x - deltaX,
                y: prev.y - deltaY,
            }));
            setStartPan({ x: e.clientX, y: e.clientY });
        } else if (isDrawing && isDrawingMode) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left + position.x;
                const y = e.clientY - rect.top + position.y;
                setCurrentLine((prev) => [...prev, { x, y }]);
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            addLine({ points: currentLine, color: currentColor });
            setCurrentLine([]);
            setIsDrawing(false);
        }
        setIsPanning(false);
    };

    const toggleMode = () => {
        setIsDrawingMode(!isDrawingMode);
    };

    // Draw all lines with pan offset
    const drawLines = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        // Keep the negative sign so the canvas moves as expected
        ctx.translate(-position.x, -position.y);

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

        ctx.restore();
    };

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) drawLines(ctx);
    }, [lines, currentLine, position, drawLines]);

    return (
        <div className="relative h-full w-full">
            <div className="absolute left-4 top-4 z-10 flex gap-2">
                <Button onClick={toggleMode} data-testid="toggle-button">
                    {isDrawingMode ? (
                        <SquarePen className="h-4 w-4" aria-label="draw-mode" />
                    ) : (
                        <Hand className="h-4 w-4" aria-label="pan-mode" />
                    )}
                </Button>
                {isDrawingMode && (
                    <>
                        <Button
                            onClick={handleUndo}
                            disabled={lines.length === 0}
                            data-testid="undo"
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                        <Clear />
                        <Button className="backdrop-blur">
                            <input
                                id="colorPicker"
                                type="color"
                                data-testid="color-picker"
                                value={currentColor}
                                onChange={(e) =>
                                    setCurrentColor(e.target.value)
                                }
                                className="h-6 w-6 cursor-pointer rounded-md bg-transparent"
                            />
                        </Button>
                    </>
                )}
            </div>
            <div
                ref={containerRef}
                className={`h-full w-full overflow-hidden ${
                    isDrawingMode
                        ? 'cursor-crosshair'
                        : isPanning
                          ? 'cursor-grabbing'
                          : 'cursor-grab'
                }`}
                data-testid="infinite-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas ref={canvasRef} className="h-full w-full" />
            </div>
        </div>
    );
}
