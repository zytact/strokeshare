'use client';
import { Stage, Layer, Line } from 'react-konva';
import { useState, useRef, useEffect } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Hand, Eraser } from 'lucide-react';

export default function InfiniteCanvas() {
    const { resolvedTheme } = useTheme();
    const [lines, setLines] = useState<Line[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const stageRef = useRef<Konva.Stage>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragModeEnabled, setDragModeEnabled] = useState(false);
    const [eraserMode, setEraserMode] = useState(false);

    const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
    const [eraserColor, setEraserColor] = useState(() =>
        resolvedTheme === 'dark' ? '#000000' : '#ffffff',
    );
    const [currentColor, setCurrentColor] = useState(() =>
        resolvedTheme === 'dark' ? '#ffffff' : '#000000',
    );

    useEffect(() => {
        if (resolvedTheme) {
            setCurrentColor(resolvedTheme === 'dark' ? '#ffffff' : '#000000');
            setEraserColor(resolvedTheme === 'dark' ? '#000000' : '#ffffff');
        }
    }, [resolvedTheme]);

    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);
    const lastPointerPosition = useRef<Point>({ x: 0, y: 0 });

    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        const evt = e.evt;
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        if (dragModeEnabled && evt.button === 0) {
            setIsDragging(true);
            lastPointerPosition.current = point;
        }

        // Right click (button 2)
        if (evt.button === 2) {
            setIsDragging(true);
            // Set the initial position when starting to drag
            lastPointerPosition.current = point;
            return;
        }

        // Left click (button 0) for drawing
        if (evt.button === 0 && !dragModeEnabled) {
            setIsDrawing(true);
            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            setLines([
                ...lines,
                {
                    points: [stagePoint.x, stagePoint.y],
                    color: currentColor,
                    erase: eraserMode,
                },
            ]);
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        if (isDragging) {
            // Handle panning
            const dx = point.x - lastPointerPosition.current.x;
            const dy = point.y - lastPointerPosition.current.y;

            setStagePos({
                x: stagePos.x + dx,
                y: stagePos.y + dy,
            });

            lastPointerPosition.current = point;
            return;
        }

        if (!isDrawing) return;

        // Convert point from screen coordinates to stage coordinates
        const stagePoint = {
            x: (point.x - stagePos.x) / stageScale,
            y: (point.y - stagePos.y) / stageScale,
        };

        const lastLine = [...lines];
        const currentLine = lastLine[lastLine.length - 1];
        currentLine.points = currentLine.points.concat([
            stagePoint.x,
            stagePoint.y,
        ]);

        setLines(lastLine);
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        }
        if (isDrawing) {
            setIsDrawing(false);
        }
    };

    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stageScale;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stagePos.x) / oldScale,
            y: (pointer.y - stagePos.y) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
        setStageScale(newScale);

        setStagePos({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };

    const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
        e.evt.preventDefault();
    };

    const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
        const evt = e.evt;
        evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        if (dragModeEnabled) {
            setIsDragging(true);
            lastPointerPosition.current = point;
            return;
        }

        if (!dragModeEnabled) {
            setIsDrawing(true);
            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            setLines([
                ...lines,
                {
                    points: [stagePoint.x, stagePoint.y],
                    color: currentColor,
                    erase: eraserMode,
                },
            ]);
        }
    };

    const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        if (isDragging) {
            const dx = point.x - lastPointerPosition.current.x;
            const dy = point.y - lastPointerPosition.current.y;

            setStagePos({
                x: stagePos.x + dx,
                y: stagePos.y + dy,
            });

            lastPointerPosition.current = point;
            return;
        }

        if (!isDrawing) return;

        const stagePoint = {
            x: (point.x - stagePos.x) / stageScale,
            y: (point.y - stagePos.y) / stageScale,
        };

        const lastLine = [...lines];
        const currentLine = lastLine[lastLine.length - 1];
        currentLine.points = currentLine.points.concat([
            stagePoint.x,
            stagePoint.y,
        ]);

        setLines(lastLine);
    };

    const handleTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
        e.evt.preventDefault();
        setIsDragging(false);
        setIsDrawing(false);
    };

    return (
        <>
            <div className="fixed z-10 ml-2 mt-2 flex flex-col gap-2 sm:flex-row">
                <Button
                    variant={dragModeEnabled ? 'secondary' : 'default'}
                    onClick={() => setDragModeEnabled(!dragModeEnabled)}
                >
                    <Hand className="h-4 w-4" />
                </Button>
                <Button
                    variant={eraserMode ? 'secondary' : 'default'}
                    onClick={() => {
                        setEraserMode(!eraserMode);
                        setDragModeEnabled(false);
                    }}
                >
                    <Eraser className="h-4 w-4" />{' '}
                </Button>
                {!eraserMode && (
                    <Button className="p-2 backdrop-blur">
                        <input
                            type="color"
                            onChange={(e) => setCurrentColor(e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded-md bg-transparent"
                            value={currentColor}
                        />
                    </Button>
                )}
            </div>
            <Stage
                data-testid="stage"
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
                ref={stageRef}
                x={stagePos.x}
                y={stagePos.y}
                style={{ cursor: dragModeEnabled ? 'grab' : 'crosshair' }}
                scale={{ x: stageScale, y: stageScale }}
            >
                <Layer data-testid="layer">
                    {lines.map((line, i) => (
                        <Line
                            data-testid="line"
                            draggable
                            key={i}
                            points={line.points}
                            stroke={line.erase ? eraserColor : line.color}
                            strokeWidth={line.erase ? 50 : 5}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={
                                line.erase ? 'destination-out' : 'source-over'
                            }
                        />
                    ))}
                </Layer>
            </Stage>
        </>
    );
}
