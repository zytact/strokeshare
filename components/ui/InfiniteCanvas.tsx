'use client';

import { useEffect, useRef, useState } from 'react';
import { useLineStore, useEraserStore } from '@/store/useCanvasStore';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import Clear from '@/components/ui/Clear';
import { Undo, Hand, Redo } from 'lucide-react';
import Eraser from '@/components/ui/Eraser';

export default function InfiniteCanvas() {
    const { theme } = useTheme();
    const [eraserPath, setEraserPath] = useState<Point[]>([]);
    const [isPanning, setIsPanning] = useState(false);
    const [isDrawingMode, setIsDrawingMode] = useState(true);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const {
        lines,
        addLine,
        updateLines,
        undo: handleUndo,
        redo: handleRedo,
        history,
        historyIndex,
    } = useLineStore();
    const { isEraserMode } = useEraserStore();
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
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                } else if (e.key === 'y') {
                    e.preventDefault();
                    handleRedo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

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

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        if (isDrawingMode) {
            setIsDrawing(true);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const touch = e.touches[0];
                const x = touch.clientX - rect.left + position.x;
                const y = touch.clientY - rect.top + position.y;
                setCurrentLine([{ x, y }]);
            }
        } else {
            setIsPanning(true);
            const touch = e.touches[0];
            setStartPan({ x: touch.clientX, y: touch.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning && !isDrawingMode) {
            const deltaX = e.clientX - startPan.x;
            const deltaY = e.clientY - startPan.y;
            setPosition((prev) => ({
                x: prev.x - deltaX,
                y: prev.y - deltaY,
            }));
            setStartPan({ x: e.clientX, y: e.clientY });
        } else if (isDrawing && isDrawingMode) {
            if (isEraserMode) {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const mouseX = e.clientX - rect.left + position.x;
                    const mouseY = e.clientY - rect.top + position.y;
                    setEraserPath((prev) => [
                        ...prev,
                        { x: mouseX, y: mouseY },
                    ]);
                }
            } else {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const x = e.clientX - rect.left + position.x;
                    const y = e.clientY - rect.top + position.y;
                    setCurrentLine((prev) => [...prev, { x, y }]);
                }
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        if (isPanning && !isDrawingMode) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - startPan.x;
            const deltaY = touch.clientY - startPan.y;
            setPosition((prev) => ({
                x: prev.x - deltaX,
                y: prev.y - deltaY,
            }));
            setStartPan({ x: touch.clientX, y: touch.clientY });
        } else if (isDrawing && isDrawingMode) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const touch = e.touches[0];
                if (isEraserMode) {
                    const mouseX = touch.clientX - rect.left + position.x;
                    const mouseY = touch.clientY - rect.top + position.y;
                    setEraserPath((prev) => [
                        ...prev,
                        { x: mouseX, y: mouseY },
                    ]);
                } else {
                    const x = touch.clientX - rect.left + position.x;
                    const y = touch.clientY - rect.top + position.y;
                    setCurrentLine((prev) => [...prev, { x, y }]);
                }
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            if (isEraserMode && eraserPath.length > 0) {
                const updatedLines = lines
                    .map((line) => {
                        const filteredPoints = line.points.filter((point) => {
                            // Check if point is near any point in the eraser path
                            return !eraserPath.some((eraserPoint) => {
                                const distance = Math.sqrt(
                                    Math.pow(point.x - eraserPoint.x, 2) +
                                        Math.pow(point.y - eraserPoint.y, 2),
                                );
                                return distance <= 40; // eraser radius
                            });
                        });
                        return { ...line, points: filteredPoints };
                    })
                    .filter((line) => line.points.length > 1);

                updateLines(updatedLines);
                setEraserPath([]); // Reset eraser path
            } else {
                addLine({ points: currentLine, color: currentColor });
            }
            setCurrentLine([]);
            setIsDrawing(false);
        }
        setIsPanning(false);
    };

    const toggleMode = () => {
        setIsDrawingMode(!isDrawingMode);
    };

    const handleTouchEnd = () => {
        if (isDrawing) {
            if (isEraserMode && eraserPath.length > 0) {
                const updatedLines = lines
                    .map((line) => {
                        const filteredPoints = line.points.filter((point) => {
                            return !eraserPath.some((eraserPoint) => {
                                const distance = Math.sqrt(
                                    Math.pow(point.x - eraserPoint.x, 2) +
                                        Math.pow(point.y - eraserPoint.y, 2),
                                );
                                return distance <= 40;
                            });
                        });
                        return { ...line, points: filteredPoints };
                    })
                    .filter((line) => line.points.length > 1);

                updateLines(updatedLines);
                setEraserPath([]);
            } else {
                addLine({ points: currentLine, color: currentColor });
            }
            setCurrentLine([]);
            setIsDrawing(false);
        }
        setIsPanning(false);
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
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 sm:flex-row">
                <Button onClick={toggleMode} data-testid="pan-button">
                    <Hand className="h-4 w-4" aria-label="pan-mode" />
                </Button>
                <Button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    data-testid="undo"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    data-testid="redo"
                >
                    <Redo className="h-4 w-4" />
                </Button>
                <Clear />
                <Eraser />
                {!isEraserMode && (
                    <Button className="backdrop-blur">
                        <input
                            id="colorPicker"
                            type="color"
                            data-testid="color-picker"
                            value={currentColor}
                            onChange={(e) => setCurrentColor(e.target.value)}
                            className="h-6 w-6 cursor-pointer rounded-md bg-transparent"
                        />
                    </Button>
                )}
            </div>
            <div
                ref={containerRef}
                className={`h-full w-full touch-none overflow-hidden ${
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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <canvas ref={canvasRef} className="h-full w-full" />
            </div>
        </div>
    );
}
