'use client';
import { Stage, Layer, Line, Transformer } from 'react-konva';
import { useState, useRef, useEffect } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
    Hand,
    Eraser,
    MoveUpLeft,
    Redo2,
    Undo2,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { getDistanceToLineSegment } from '@/lib/utils';
import { useCanvasStore } from '@/store/useCanvasStore';
import { StrokeWidth } from '@/components/ui/StrokeWidth';
import { DownloadPop } from '@/components/ui/DownloadPop';

export default function InfiniteCanvas() {
    const { resolvedTheme } = useTheme();
    const [isDrawing, setIsDrawing] = useState(false);
    const stageRef = useRef<Konva.Stage>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragModeEnabled, setDragModeEnabled] = useState(false);
    const [eraserMode, setEraserMode] = useState(false);
    const [isErasing, setIsErasing] = useState(false);

    const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
    const [currentColor, setCurrentColor] = useState(() =>
        resolvedTheme === 'dark' ? '#ffffff' : '#000000',
    );

    const { lines, setLines, addToHistory, undo, redo, canUndo, canRedo } =
        useCanvasStore();

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [moveMode, setMoveMode] = useState(false);
    const [strokeWidth, setStrokeWidth] = useState(5);
    const [exportWithBackground, setExportWithBackground] = useState(true);

    const transformerRef = useRef<Konva.Transformer>(null);

    const resetTransformer = () => {
        const transformer = transformerRef.current;
        if (transformer) {
            transformer.nodes([]);
            transformer.getLayer()?.batchDraw();
        }
        setSelectedId(null);
    };

    // Update the moveMode effect
    useEffect(() => {
        if (!moveMode) {
            resetTransformer();
        }
    }, [moveMode]);

    useEffect(() => {
        if (moveMode) {
            if (selectedId === null) {
                return;
            }
            const transformer = transformerRef.current;
            const stage = stageRef.current;
            if (!transformer || !stage) return;

            const shape = stage.findOne('#line-' + selectedId);
            if (shape) {
                transformer.nodes([shape]);
                transformer.getLayer()?.batchDraw();
            } else {
                transformer.nodes([]);
            }
        }
    }, [selectedId, moveMode]);

    useEffect(() => {
        if (resolvedTheme) {
            setCurrentColor(resolvedTheme === 'dark' ? '#ffffff' : '#000000');
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'z') {
                    undo();
                } else if (e.key === 'y') {
                    redo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);
    const lastPointerPosition = useRef<Point>({ x: 0, y: 0 });

    const handleZoom = (zoomIn: boolean) => {
        const oldScale = stageScale;
        const newScale = zoomIn ? oldScale + 0.05 : oldScale - 0.05;

        // Get stage center point
        const stage = stageRef.current;
        if (!stage) return;

        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;

        const mousePointTo = {
            x: (centerX - stagePos.x) / oldScale,
            y: (centerY - stagePos.y) / oldScale,
        };

        setStageScale(newScale);

        setStagePos({
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        });
    };

    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        const evt = e.evt;
        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        if (dragModeEnabled && evt.button === 0) {
            setIsDragging(true);
            lastPointerPosition.current = point;
            return;
        }

        if (evt.button === 2) {
            setIsDragging(true);
            lastPointerPosition.current = point;
            return;
        }

        // Add this condition for eraser
        if (evt.button === 0 && eraserMode) {
            setIsErasing(true);
            return;
        }

        if (evt.button === 0 && !dragModeEnabled && !moveMode && !eraserMode) {
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
                    strokeWidth: strokeWidth,
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
            const dx = point.x - lastPointerPosition.current.x;
            const dy = point.y - lastPointerPosition.current.y;

            setStagePos({
                x: stagePos.x + dx,
                y: stagePos.y + dy,
            });

            lastPointerPosition.current = point;
            return;
        }

        const stagePoint = {
            x: (point.x - stagePos.x) / stageScale,
            y: (point.y - stagePos.y) / stageScale,
        };

        // Only erase when actively erasing
        if (eraserMode && isErasing) {
            const eraserRadius = 40;
            const updatedLines = lines.filter((line) => {
                let shouldKeepLine = true;
                for (let i = 0; i < line.points.length - 2; i += 2) {
                    const distance = getDistanceToLineSegment(
                        stagePoint.x,
                        stagePoint.y,
                        line.points[i],
                        line.points[i + 1],
                        line.points[i + 2],
                        line.points[i + 3],
                    );
                    if (distance < eraserRadius) {
                        shouldKeepLine = false;
                        break;
                    }
                }
                return shouldKeepLine;
            });
            setLines(updatedLines);
            return;
        }

        if (!isDrawing) return;

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
            addToHistory(lines);
        }
        if (isErasing) {
            setIsErasing(false);
            addToHistory(lines);
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

    const handleTransformEnd = (
        e: KonvaEventObject<Event>,
        lineIndex: number,
    ) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation();
        const x = node.x();
        const y = node.y();

        // Reset scale and apply the transformation to the points
        node.scaleX(1);
        node.scaleY(1);

        // Create a new array to avoid mutating state directly
        const newLines = [...lines];
        const line = newLines[lineIndex];

        // Transform all points
        const newPoints: number[] = [];
        for (let i = 0; i < line.points.length; i += 2) {
            const point = {
                x: line.points[i],
                y: line.points[i + 1],
            };

            // Apply transformations in the correct order
            // 1. Scale
            point.x *= scaleX;
            point.y *= scaleY;

            // 2. Rotate
            if (rotation !== 0) {
                const rad = (rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const newX = point.x * cos - point.y * sin;
                const newY = point.x * sin + point.y * cos;
                point.x = newX;
                point.y = newY;
            }

            // 3. Translate
            point.x += x;
            point.y += y;

            newPoints.push(point.x, point.y);
        }

        // Update the line with new points
        newLines[lineIndex] = {
            ...line,
            points: newPoints,
        };

        setLines(newLines);

        // Reset the position as the points now include the transformation
        node.x(0);
        node.y(0);
        node.rotation(0);
        node.scaleX(1);
        node.scaleY(1);

        // Force update the layer
        const layer = node.getLayer();
        if (layer) {
            layer.batchDraw();
        }
    };

    const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
        e.evt.preventDefault();
    };

    const handlePNG = () => {
        if (!stageRef.current) return;

        // If we want to export with background, temporarily add a background rect
        if (exportWithBackground) {
            const backgroundColor =
                resolvedTheme === 'dark' ? '#000000' : '#ffffff';
            const background = new Konva.Rect({
                x: -stagePos.x / stageScale,
                y: -stagePos.y / stageScale,
                width: stageRef.current.width() / stageScale,
                height: stageRef.current.height() / stageScale,
                fill: backgroundColor,
            });

            // Add background as the first node
            const layer = stageRef.current.findOne('Layer') as Konva.Layer;
            if (layer) {
                layer.add(background);
                background.moveToBottom();
            }
            background.moveToBottom();

            // Get the data URL
            const dataURL = stageRef.current.toDataURL({
                pixelRatio: 2,
            });

            // Remove the temporary background
            background.destroy();

            // Create download link
            const link = document.createElement('a');
            link.download = 'strokeshare-export.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Export without background
            const dataURL = stageRef.current.toDataURL({
                pixelRatio: 2,
            });

            const link = document.createElement('a');
            link.download = 'strokeshare-export.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleSVG = () => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg width="${stageWidth}" height="${stageHeight}" xmlns="http://www.w3.org/2000/svg">`;

        if (exportWithBackground) {
            const backgroundColor =
                resolvedTheme === 'dark' ? '#000000' : '#ffffff';
            svg += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;
        }

        svg += `<g transform="translate(${stagePos.x},${stagePos.y}) scale(${stageScale})">`;

        lines.forEach((line) => {
            const points = line.points;
            if (points.length >= 4) {
                let pathData = `M ${points[0]},${points[1]}`;
                for (let i = 2; i < points.length; i += 2) {
                    pathData += ` L ${points[i]},${points[i + 1]}`;
                }
                svg += `<path d="${pathData}" stroke="${line.color}" stroke-width="${line.strokeWidth || strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
            }
        });

        svg += '</g></svg>';

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'strokeshare-export.svg';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyImg = async () => {
        if (!stageRef.current) return;

        let background;
        // If we want to export with background, temporarily add a background rect
        if (exportWithBackground) {
            const backgroundColor =
                resolvedTheme === 'dark' ? '#000000' : '#ffffff';
            background = new Konva.Rect({
                x: -stagePos.x / stageScale,
                y: -stagePos.y / stageScale,
                width: stageRef.current.width() / stageScale,
                height: stageRef.current.height() / stageScale,
                fill: backgroundColor,
            });

            // Add background as the first node
            const layer = stageRef.current.findOne('Layer') as Konva.Layer;
            if (layer) {
                layer.add(background);
                background.moveToBottom();
            }
            background.moveToBottom();
        }
        const dataURL = stageRef.current.toDataURL({
            pixelRatio: 2,
        });

        // Remove the temporary background
        if (background) {
            background.destroy();
        }

        const blob = await fetch(dataURL).then((res) => res.blob());

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);
        } catch (err) {
            console.log('Copying failed: ', err);
        }
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

        if (!dragModeEnabled && !moveMode) {
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
                    strokeWidth: strokeWidth,
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

        const stagePoint = {
            x: (point.x - stagePos.x) / stageScale,
            y: (point.y - stagePos.y) / stageScale,
        };

        if (eraserMode) {
            const eraserRadius = 40;
            const updatedLines = lines.filter((line) => {
                let shouldKeepLine = true;
                for (let i = 0; i < line.points.length - 2; i += 2) {
                    const distance = getDistanceToLineSegment(
                        stagePoint.x,
                        stagePoint.y,
                        line.points[i],
                        line.points[i + 1],
                        line.points[i + 2],
                        line.points[i + 3],
                    );
                    if (distance < eraserRadius) {
                        shouldKeepLine = false;
                        break;
                    }
                }
                return shouldKeepLine;
            });
            setLines(updatedLines);
            return;
        }

        if (!isDrawing) return;

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
        if (isDragging) {
            setIsDragging(false);
        }
        if (isDrawing) {
            setIsDrawing(false);
            addToHistory(lines); // Add this line to update history
        }
        if (isErasing) {
            setIsErasing(false);
            addToHistory(lines); // Add this line to update history
        }
    };

    return (
        <>
            <div className="fixed z-10 ml-2 mt-2 flex flex-col gap-2 sm:flex-row">
                <div>
                    <Button
                        aria-label="hand"
                        variant={dragModeEnabled ? 'secondary' : 'default'}
                        onClick={() => setDragModeEnabled(!dragModeEnabled)}
                    >
                        <Hand className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="move"
                        variant={moveMode ? 'secondary' : 'default'}
                        onClick={() => setMoveMode(!moveMode)}
                    >
                        <MoveUpLeft className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="eraser"
                        variant={eraserMode ? 'secondary' : 'default'}
                        onClick={() => {
                            setEraserMode(!eraserMode);
                            setDragModeEnabled(false);
                        }}
                    >
                        <Eraser className="h-4 w-4" />{' '}
                    </Button>
                </div>
                {!eraserMode && (
                    <>
                        <div>
                            <Button className="p-2 backdrop-blur">
                                <input
                                    type="color"
                                    onChange={(e) =>
                                        setCurrentColor(e.target.value)
                                    }
                                    className="h-8 w-8 cursor-pointer rounded-md bg-transparent"
                                    value={currentColor}
                                />
                            </Button>
                        </div>
                        <div>
                            <StrokeWidth
                                strokeWidth={strokeWidth}
                                onStrokeWidthChange={setStrokeWidth}
                            />
                        </div>
                    </>
                )}
                <div className="block sm:hidden">
                    <DownloadPop
                        handleSVG={handleSVG}
                        handlePNG={handlePNG}
                        copyImg={copyImg}
                        exportWithBackground={exportWithBackground}
                        setExportWithBackground={setExportWithBackground}
                    />
                </div>
            </div>
            <div className="fixed bottom-4 left-4 z-10 flex gap-2">
                <Button
                    aria-label="undo"
                    variant="default"
                    onClick={undo}
                    disabled={!canUndo()}
                >
                    <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                    aria-label="redo"
                    variant="default"
                    onClick={redo}
                    disabled={!canRedo()}
                >
                    <Redo2 className="h-4 w-4" />
                </Button>
                <div className="mx-2 h-8 w-px bg-border" />
                <Button
                    aria-label="zoom-in"
                    variant="default"
                    onClick={() => handleZoom(true)}
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="flex h-10 min-w-[4rem] items-center justify-center rounded-md bg-secondary px-2 text-sm">
                    {Math.round(stageScale * 100)}%
                </div>
                <Button
                    aria-label="zoom-out"
                    variant="default"
                    onClick={() => handleZoom(false)}
                >
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="mx-2 hidden h-8 w-px bg-border sm:block" />
                <DownloadPop
                    handleSVG={handleSVG}
                    handlePNG={handlePNG}
                    copyImg={copyImg}
                    setExportWithBackground={setExportWithBackground}
                    exportWithBackground={exportWithBackground}
                    className="hidden sm:block"
                />
            </div>
            <div
                data-testid="canvas-container"
                style={{ cursor: dragModeEnabled ? 'grab' : 'crosshair' }}
            >
                <Stage
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
                    onClick={(e) => {
                        if (moveMode) {
                            const clickedOnEmpty =
                                e.target === e.target.getStage();
                            if (clickedOnEmpty) {
                                setSelectedId(null);
                            }
                        }
                    }}
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
                                id={`line-${i}`}
                                draggable={moveMode}
                                key={i}
                                points={line.points}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth || strokeWidth}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation="source-over"
                                onClick={(e) => {
                                    if (moveMode) {
                                        e.cancelBubble = true;
                                        const transformer =
                                            transformerRef.current;
                                        if (transformer) {
                                            transformer.nodes([e.target]);
                                            transformer.getLayer()?.batchDraw();
                                        }
                                        setSelectedId(i);
                                    }
                                }}
                                onTouchStart={(e) => {
                                    if (moveMode) {
                                        e.cancelBubble = true;
                                        const transformer =
                                            transformerRef.current;
                                        if (transformer) {
                                            transformer.nodes([e.target]);
                                            transformer.getLayer()?.batchDraw();
                                        }
                                        setSelectedId(i);
                                    }
                                }}
                                onTransformEnd={(e) => handleTransformEnd(e, i)}
                            />
                        ))}
                        {moveMode && (
                            <Transformer
                                data-testid="transformer"
                                ref={transformerRef}
                                borderStroke={
                                    resolvedTheme === 'dark'
                                        ? '#ffffff'
                                        : '#000000'
                                }
                                anchorFill={
                                    resolvedTheme === 'dark'
                                        ? '#ffffff'
                                        : '#000000'
                                }
                                anchorStroke={
                                    resolvedTheme === 'dark'
                                        ? '#ffffff'
                                        : '#000000'
                                }
                                boundBoxFunc={(oldBox, newBox) => {
                                    // Limit resize
                                    const maxWidth = 800;
                                    const maxHeight = 800;
                                    if (
                                        newBox.width > maxWidth ||
                                        newBox.height > maxHeight
                                    ) {
                                        return oldBox;
                                    }
                                    return newBox;
                                }}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>
        </>
    );
}
