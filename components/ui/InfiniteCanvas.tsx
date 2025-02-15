'use client';

import { useEffect, useRef, useState } from 'react';
import { useLineStore, useEraserStore } from '@/store/useCanvasStore';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import Clear from '@/components/ui/Clear';
import { ZoomIn, ZoomOut, Undo, Hand, Redo } from 'lucide-react';
import Eraser from '@/components/ui/Eraser';

export default function InfiniteCanvas() {
    const { resolvedTheme } = useTheme();
    const [eraserPath, setEraserPath] = useState<Point[]>([]);
    const [isPanning, setIsPanning] = useState(false);
    const [isDrawingMode, setIsDrawingMode] = useState(true);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const previousDrawingMode = useRef(true);
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
        resolvedTheme === 'dark' ? '#ffffff' : '#000000',
    );
    const [hoveredLines, setHoveredLines] = useState<Set<number>>(new Set());
    const [scale, setScale] = useState(1);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        setCurrentColor(resolvedTheme === 'dark' ? '#ffffff' : '#000000');
    }, [resolvedTheme]);

    // Handle canvas resizing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        updateCanvasSize();

        const resizeObserver = new ResizeObserver(updateCanvasSize);
        resizeObserver.observe(canvas);

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

            if (e.code === 'Space') {
                e.preventDefault();
                setIsDrawingMode(false);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsDrawingMode(previousDrawingMode.current);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleUndo, handleRedo]);

    useEffect(() => {
        const preventDefault = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        };

        window.addEventListener('wheel', preventDefault, { passive: false });

        return () => {
            window.removeEventListener('wheel', preventDefault);
        };
    });

    const pointToLineDistance = (
        point: Point,
        lineStart: Point,
        lineEnd: Point,
    ) => {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    };

    const updateHoveredLines = (mouseX: number, mouseY: number) => {
        lines.forEach((line, lineIndex) => {
            const isLineHovered = line.points.some((point) => {
                const distance = Math.sqrt(
                    Math.pow(point.x - mouseX, 2) +
                        Math.pow(point.y - mouseY, 2),
                );
                return distance <= 100;
            });

            if (isLineHovered) {
                setHoveredLines((prev) => new Set([...prev, lineIndex]));
            }
        });
    };

    // Handle panning and drawing
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDrawingMode) {
            setIsDrawing(true);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const x = (e.clientX - rect.left + position.x) / scale;
                const y = (e.clientY - rect.top + position.y) / scale;
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
                    const mouseX = (e.clientX - rect.left + position.x) / scale;
                    const mouseY = (e.clientY - rect.top + position.y) / scale;
                    setEraserPath((prev) => [
                        ...prev,
                        { x: mouseX, y: mouseY },
                    ]);
                    updateHoveredLines(mouseX, mouseY);
                }
            } else {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const x = (e.clientX - rect.left + position.x) / scale;
                    const y = (e.clientY - rect.top + position.y) / scale;
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
                    const mouseX =
                        (touch.clientX - rect.left + position.x) / scale;
                    const mouseY =
                        (touch.clientY - rect.top + position.y) / scale;
                    setEraserPath((prev) => [
                        ...prev,
                        { x: mouseX, y: mouseY },
                    ]);
                    updateHoveredLines(mouseX, mouseY);
                } else {
                    const x = (touch.clientX - rect.left + position.x) / scale;
                    const y = (touch.clientY - rect.top + position.y) / scale;
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
                        // Split the line into segments and check each segment
                        const segments: Point[][] = [];
                        let currentSegment: Point[] = [line.points[0]];

                        for (let i = 1; i < line.points.length; i++) {
                            const point = line.points[i];

                            // Check if this point intersects with any eraser segment
                            let intersects = false;
                            for (let j = 1; j < eraserPath.length; j++) {
                                const eraserStart = eraserPath[j - 1];
                                const eraserEnd = eraserPath[j];

                                // Calculate distance from point to eraser line segment
                                const distance = pointToLineDistance(
                                    point,
                                    eraserStart,
                                    eraserEnd,
                                );

                                if (distance < 100) {
                                    // Adjust this threshold as needed
                                    intersects = true;
                                    break;
                                }
                            }

                            if (intersects) {
                                if (currentSegment.length > 1) {
                                    segments.push([...currentSegment]);
                                }
                                currentSegment = [];
                            } else {
                                currentSegment.push(point);
                            }
                        }

                        if (currentSegment.length > 1) {
                            segments.push(currentSegment);
                        }

                        // Combine all remaining segments
                        return segments.map((segment) => ({
                            points: segment,
                            color: line.color,
                        }));
                    })
                    .flat()
                    .filter((line) => line.points.length > 1);

                updateLines(updatedLines);
                setEraserPath([]);
            } else {
                addLine({ points: currentLine, color: currentColor });
            }
            setCurrentLine([]);
            setIsDrawing(false);
            setHoveredLines(new Set());
        }
        setIsPanning(false);
    };

    const handleTouchEnd = handleMouseUp;

    const toggleMode = () => {
        setIsDrawingMode(!isDrawingMode);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(Math.max(scale * delta, 0.1), 5);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newPosition = {
                x: position.x + (mouseX / scale - mouseX / newScale) * newScale,
                y: position.y + (mouseY / scale - mouseY / newScale) * newScale,
            };

            setScale(newScale);
            setPosition(newPosition);
        }
    };

    const zoomIn = () => {
        setScale((prev) => prev + 0.05);
    };
    const zoomOut = () => {
        setScale((prev) => prev - 0.05);
    };

    const formatScalePercentage = (scale: number) => {
        return `${Math.round(scale * 100)}%`;
    };

    // Draw all lines with pan offset
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const drawLines = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        // Keep the negative sign so the canvas moves as expected
        ctx.translate(-position.x, -position.y);
        ctx.scale(scale, scale);

        lines.forEach((line, lineIndex) => {
            if (line.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = line.color;
            ctx.lineWidth = 2 / scale;
            ctx.globalAlpha =
                isEraserMode && hoveredLines.has(lineIndex) ? 0.3 : 1;
            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
            }
            ctx.stroke();
        });

        if (currentLine.length >= 2) {
            ctx.beginPath();
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 2 / scale;
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

    useEffect(() => {
        if (!isEraserMode) {
            setHoveredLines(new Set());
        }
    }, [isEraserMode]);

    return (
        <div className="relative h-full w-full">
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 sm:flex-row">
                <Button
                    onClick={toggleMode}
                    data-testid="pan-button"
                    variant={!isDrawingMode ? 'secondary' : 'default'}
                >
                    <Hand className="h-4 w-4" aria-label="pan-mode" />
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
            <div className="fixed bottom-4 left-4 z-10 flex gap-2">
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
                <div className="mx-2 h-8 w-px bg-border" /> {/* Separator */}
                <Button
                    onClick={zoomOut}
                    data-testid="zoom-out"
                    disabled={scale <= 0.1}
                    variant="outline"
                    size="icon"
                >
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <div
                    className="flex min-w-[4rem] select-none flex-row items-center justify-center text-center text-sm"
                    data-testid="zoom-percentage"
                >
                    {formatScalePercentage(scale)}
                </div>
                <Button
                    onClick={zoomIn}
                    disabled={scale >= 5}
                    data-testid="zoom-in"
                    variant="outline"
                    size="icon"
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>
            </div>
            <canvas
                ref={canvasRef}
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
                onWheel={handleWheel}
            />
        </div>
    );
}
