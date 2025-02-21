'use client';
import { Stage, Layer, Line, Transformer, Text, Rect } from 'react-konva';
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
    Type,
    Minus as LineIcon,
    ArrowRight,
    SquareDashed,
    Square,
} from 'lucide-react';
import { getDistanceToLineSegment } from '@/lib/utils';
import { useCanvasStore } from '@/store/useCanvasStore';
import { StrokeWidth } from '@/components/ui/StrokeWidth';
import { DownloadPop } from '@/components/ui/DownloadPop';

const getTextRotation = (textNode: Konva.Text) => {
    // Get absolute rotation including all parent rotations
    let rotation = textNode.rotation();
    let parent = textNode.parent;
    while (parent) {
        rotation += parent.rotation();
        parent = parent.parent;
    }
    return rotation;
};

const getTextPosition = (textNode: Konva.Text, stage: Konva.Stage) => {
    // Get absolute position
    const absPos = textNode.absolutePosition();

    // Convert to relative position considering stage transform
    return {
        x: (absPos.x - stage.x()) / stage.scaleX(),
        y: (absPos.y - stage.y()) / stage.scaleY(),
    };
};

const isPointNearText = (
    px: number,
    py: number,
    text: TextElement,
    stage: Konva.Stage,
    eraserRadius: number,
) => {
    const textNode = stage.findOne('#' + text.id) as Konva.Text;
    if (!textNode) return false;

    // Get the absolute transformed bounding box
    const box = textNode.getClientRect();

    // Convert the eraser point to the same coordinate space as the bounding box
    const scale = stage.scaleX();
    const point = {
        x: px * scale + stage.x(),
        y: py * scale + stage.y(),
    };

    // Adjust eraserRadius for stage scale
    const scaledRadius = eraserRadius * scale;

    // Check if point is near the bounding box edges
    const nearLeft = Math.abs(point.x - box.x) <= scaledRadius;
    const nearRight = Math.abs(point.x - (box.x + box.width)) <= scaledRadius;
    const nearTop = Math.abs(point.y - box.y) <= scaledRadius;
    const nearBottom = Math.abs(point.y - (box.y + box.height)) <= scaledRadius;

    // Check if point is inside or near the box
    const insideX =
        point.x >= box.x - scaledRadius &&
        point.x <= box.x + box.width + scaledRadius;
    const insideY =
        point.y >= box.y - scaledRadius &&
        point.y <= box.y + box.height + scaledRadius;

    return (
        (insideX && (nearTop || nearBottom)) ||
        (insideY && (nearLeft || nearRight))
    );
};

const isPointNearRectangle = (
    px: number,
    py: number,
    rect: Rectangle,
    stage: Konva.Stage,
    eraserRadius: number,
) => {
    // Convert the rectangle's position to the same coordinate space as the eraser point
    const scale = stage.scaleX();
    const box = {
        x: rect.x * scale + stage.x(),
        y: rect.y * scale + stage.y(),
        width: rect.width * scale,
        height: rect.height * scale,
    };

    // Convert the point to the same coordinate space
    const point = {
        x: px * scale + stage.x(),
        y: py * scale + stage.y(),
    };

    // Adjust eraserRadius for stage scale
    const scaledRadius = eraserRadius * scale;

    // Check if point is near the rectangle edges
    const nearLeft = Math.abs(point.x - box.x) <= scaledRadius;
    const nearRight = Math.abs(point.x - (box.x + box.width)) <= scaledRadius;
    const nearTop = Math.abs(point.y - box.y) <= scaledRadius;
    const nearBottom = Math.abs(point.y - (box.y + box.height)) <= scaledRadius;

    // Check if point is inside or near the rectangle
    const insideX =
        point.x >= box.x - scaledRadius &&
        point.x <= box.x + box.width + scaledRadius;
    const insideY =
        point.y >= box.y - scaledRadius &&
        point.y <= box.y + box.height + scaledRadius;

    return (
        (insideX && (nearTop || nearBottom)) ||
        (insideY && (nearLeft || nearRight))
    );
};

export default function InfiniteCanvas() {
    const { resolvedTheme } = useTheme();
    const [isDrawing, setIsDrawing] = useState(false);
    const stageRef = useRef<Konva.Stage>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragModeEnabled, setDragModeEnabled] = useState(false);
    const [eraserMode, setEraserMode] = useState(false);
    const [isErasing, setIsErasing] = useState(false);
    const [textMode, setTextMode] = useState(false);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
    const [currentColor, setCurrentColor] = useState(() =>
        resolvedTheme === 'dark' ? '#ffffff' : '#000000',
    );

    const {
        lines,
        setLines,
        textElements,
        setTextElements,
        addToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        rectangles,
        setRectangles,
    } = useCanvasStore();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedShape, setSelectedShape] = useState<
        'line' | 'text' | 'rectangle' | null
    >(null);
    const [moveMode, setMoveMode] = useState(false);
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [lineSegmentMode, setLineSegmentMode] = useState(false);
    const [lineStart, setLineStart] = useState<Point | null>(null);
    const [arrowMode, setArrowMode] = useState(false);
    const [dashedMode, setDashedMode] = useState(false);
    const [rectangleMode, setRectangleMode] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);

    const transformerRef = useRef<Konva.Transformer>(null);

    const resetTransformer = () => {
        const transformer = transformerRef.current;
        if (transformer) {
            transformer.nodes([]);
            transformer.getLayer()?.batchDraw();
        }
        setSelectedId(null);
        setSelectedShape(null);
    };

    const disableAllModes = () => {
        setDragModeEnabled(false);
        setMoveMode(false);
        setEraserMode(false);
        setTextMode(false);
        setLineSegmentMode(false);
        setArrowMode(false);
        setRectangleMode(false);
        resetTransformer();
    };

    // Update the moveMode effect
    useEffect(() => {
        if (!moveMode) {
            resetTransformer();
        }
    }, [moveMode]);

    useEffect(() => {
        if (moveMode && selectedId && selectedShape) {
            const transformer = transformerRef.current;
            const stage = stageRef.current;
            if (!transformer || !stage) return;

            let shape;
            if (selectedShape === 'line') {
                shape = stage.findOne('#line-' + selectedId);
            } else if (selectedShape === 'text') {
                shape = stage.findOne('#' + selectedId);
            } else if (selectedShape === 'rectangle') {
                shape = stage.findOne('#rect-' + selectedId);
            }

            if (shape) {
                transformer.nodes([shape]);
                transformer.getLayer()?.batchDraw();
            } else {
                transformer.nodes([]);
            }
        }
    }, [selectedId, selectedShape, moveMode]);

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

        if (evt.button === 0 && eraserMode) {
            setIsErasing(true);
            return;
        }

        const stagePoint = {
            x: (point.x - stagePos.x) / stageScale,
            y: (point.y - stagePos.y) / stageScale,
        };

        if (evt.button === 0 && lineSegmentMode) {
            if (!lineStart) {
                setLineStart(stagePoint);
                const newLine = {
                    points: [
                        stagePoint.x,
                        stagePoint.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                    color: currentColor,
                    strokeWidth: strokeWidth,
                    isDashed: dashedMode,
                };
                setLines([...lines, newLine]);
            } else {
                const lastLine = [...lines];
                const lineIndex = lastLine.length - 1;
                lastLine[lineIndex] = {
                    ...lastLine[lineIndex],
                    points: [
                        lineStart.x,
                        lineStart.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                };
                setLines(lastLine);
                setLineStart(null);

                // Add to history after completing the line
                addToHistory(lastLine);

                // Select the line for transformation if in move mode
                if (moveMode) {
                    const stage = e.target.getStage();
                    if (stage) {
                        const line = stage.findOne('#line-' + lineIndex);
                        if (line && transformerRef.current) {
                            transformerRef.current.nodes([line]);
                            transformerRef.current.getLayer()?.batchDraw();
                            setSelectedId(String(lineIndex));
                            setSelectedShape('line');
                        }
                    }
                }
            }
            return;
        }

        if (evt.button === 0 && arrowMode) {
            if (!lineStart) {
                setLineStart(stagePoint);
                const newLine = {
                    points: [
                        stagePoint.x,
                        stagePoint.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                    color: currentColor,
                    strokeWidth: strokeWidth,
                    isArrow: true,
                    isDashed: dashedMode,
                };
                setLines([...lines, newLine]);
            } else {
                const lastLine = [...lines];
                const lineIndex = lastLine.length - 1;
                lastLine[lineIndex] = {
                    ...lastLine[lineIndex],
                    points: [
                        lineStart.x,
                        lineStart.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                };
                setLines(lastLine);
                setLineStart(null);
                addToHistory(lastLine);
            }
            return;
        }

        if (evt.button === 0 && rectangleMode) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            setStartPoint(stagePoint);
            const newRect = {
                x: stagePoint.x,
                y: stagePoint.y,
                width: 0,
                height: 0,
                color: currentColor,
                strokeWidth: strokeWidth,
                isDashed: dashedMode,
                cornerRadius: 8, // Add this line
            };
            setRectangles([...rectangles, newRect]);
            return;
        }

        if (
            evt.button === 0 &&
            !dragModeEnabled &&
            !moveMode &&
            !eraserMode &&
            !lineSegmentMode &&
            !arrowMode &&
            !rectangleMode
        ) {
            setIsDrawing(true);
            setLines([
                ...lines,
                {
                    points: [stagePoint.x, stagePoint.y],
                    color: currentColor,
                    strokeWidth: strokeWidth,
                    isDashed: dashedMode,
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

        if (eraserMode && isErasing) {
            const eraserRadius = 40;

            // Handle text erasing with transformed coordinates
            const updatedTextElements = textElements.filter((text) => {
                return !isPointNearText(
                    stagePoint.x,
                    stagePoint.y,
                    text,
                    stage,
                    eraserRadius,
                );
            });

            if (updatedTextElements.length !== textElements.length) {
                setTextElements(updatedTextElements);
            }

            // Handle line erasing (existing code)
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

            // Handle rectangle erasing
            const updatedRectangles = rectangles.filter((rect) => {
                return !isPointNearRectangle(
                    stagePoint.x,
                    stagePoint.y,
                    rect,
                    stage,
                    eraserRadius,
                );
            });

            setLines(updatedLines);
            setTextElements(updatedTextElements);
            setRectangles(updatedRectangles);
            return;
        }

        if ((lineSegmentMode || arrowMode) && lineStart) {
            const lastLine = [...lines];
            lastLine[lastLine.length - 1].points = [
                lineStart.x,
                lineStart.y,
                stagePoint.x,
                stagePoint.y,
            ];
            setLines(lastLine);
            return;
        }

        if (rectangleMode && startPoint) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            const lastRect = [...rectangles];
            const index = lastRect.length - 1;
            lastRect[index] = {
                ...lastRect[index],
                width: stagePoint.x - startPoint.x,
                height: stagePoint.y - startPoint.y,
            };
            setRectangles(lastRect);
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
            // Add history update for text elements
            addToHistory(textElements);
            addToHistory(rectangles);
        }
        if (rectangleMode && startPoint) {
            setStartPoint(null);
            addToHistory(rectangles);
            return;
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

        // For line segments, we only have 2 points (start and end)
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
        addToHistory(newLines);

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

        const stagePoint = {
            x: (point.x - stagePos.x) / stageScale,
            y: (point.y - stagePos.y) / stageScale,
        };

        if (lineSegmentMode) {
            if (!lineStart) {
                setLineStart(stagePoint);
                const newLine = {
                    points: [
                        stagePoint.x,
                        stagePoint.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                    color: currentColor,
                    strokeWidth: strokeWidth,
                    isDashed: dashedMode,
                };
                setLines([...lines, newLine]);
            } else {
                const lastLine = [...lines];
                const lineIndex = lastLine.length - 1;
                lastLine[lineIndex] = {
                    ...lastLine[lineIndex],
                    points: [
                        lineStart.x,
                        lineStart.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                };
                setLines(lastLine);
                setLineStart(null);
                addToHistory(lastLine);

                // Select the line for transformation if in move mode
                if (moveMode) {
                    if (stage) {
                        const line = stage.findOne('#line-' + lineIndex);
                        if (line && transformerRef.current) {
                            transformerRef.current.nodes([line]);
                            transformerRef.current.getLayer()?.batchDraw();
                            setSelectedId(String(lineIndex));
                            setSelectedShape('line');
                        }
                    }
                }
            }
            return;
        }

        if (arrowMode) {
            if (!lineStart) {
                setLineStart(stagePoint);
                const newLine = {
                    points: [
                        stagePoint.x,
                        stagePoint.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                    color: currentColor,
                    strokeWidth: strokeWidth,
                    isArrow: true,
                    isDashed: dashedMode,
                };
                setLines([...lines, newLine]);
            } else {
                const lastLine = [...lines];
                const lineIndex = lastLine.length - 1;
                lastLine[lineIndex] = {
                    ...lastLine[lineIndex],
                    points: [
                        lineStart.x,
                        lineStart.y,
                        stagePoint.x,
                        stagePoint.y,
                    ],
                };
                setLines(lastLine);
                setLineStart(null);
                addToHistory(lastLine);
            }
            return;
        }

        if (rectangleMode) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            setStartPoint(stagePoint);
            const newRect = {
                x: stagePoint.x,
                y: stagePoint.y,
                width: 0,
                height: 0,
                color: currentColor,
                strokeWidth: strokeWidth,
                isDashed: dashedMode,
                cornerRadius: 8, // Add this line
            };
            setRectangles([...rectangles, newRect]);
            return;
        }

        if (!dragModeEnabled && !moveMode && !lineSegmentMode) {
            setIsDrawing(true);
            setLines([
                ...lines,
                {
                    points: [stagePoint.x, stagePoint.y],
                    color: currentColor,
                    strokeWidth: strokeWidth,
                    isDashed: dashedMode,
                },
            ]);
        }

        if (textMode) {
            const stage = e.target.getStage();
            if (!stage) return;

            const point = stage.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            const newId = `text-${Date.now()}`;
            const newText: TextElement = {
                x: stagePoint.x,
                y: stagePoint.y,
                text: '',
                fontSize: 30,
                fill: currentColor,
                id: newId,
            };

            setTextElements([...textElements, newText]);
            setSelectedTextId(newId);
            setEditingText('');

            const textarea = textareaRef.current;
            if (!textarea) return;

            textarea.style.position = 'fixed';
            textarea.style.top = `${point.y}px`;
            textarea.style.left = `${point.x}px`;
            textarea.style.display = 'block';
            textarea.style.width = '80%';
            textarea.style.height = 'auto';
            textarea.focus();
        }
    };

    const handleTextTap = (e: KonvaEventObject<TouchEvent>, textId: string) => {
        const text = textElements.find((t) => t.id === textId);
        if (!text) return;

        setEditingText(text.text);
        setSelectedTextId(textId);

        const textarea = textareaRef.current;
        const stage = e.target.getStage();
        if (!textarea || !stage) return;

        const textNode = stage.findOne(`#${textId}`) as Konva.Text;
        const position = getTextPosition(textNode, stage);

        // Position textarea for touch input
        textarea.style.position = 'fixed';
        textarea.style.top = `${position.y}px`;
        textarea.style.left = `${position.x}px`;
        textarea.style.display = 'block';
        textarea.style.fontSize = `${text.fontSize}px`;
        textarea.style.width = '80%'; // Use percentage for better mobile experience
        textarea.style.height = 'auto';
        textarea.focus();
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

            // Handle text erasing
            const updatedTextElements = textElements.filter((text) => {
                return !isPointNearText(
                    stagePoint.x,
                    stagePoint.y,
                    text,
                    stage,
                    eraserRadius,
                );
            });

            if (updatedTextElements.length !== textElements.length) {
                setTextElements(updatedTextElements);
            }

            // Handle line erasing
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

            // Handle rectangle erasing
            const updatedRectangles = rectangles.filter((rect) => {
                return !isPointNearRectangle(
                    stagePoint.x,
                    stagePoint.y,
                    rect,
                    stage,
                    eraserRadius,
                );
            });

            setLines(updatedLines);
            setTextElements(updatedTextElements);
            setRectangles(updatedRectangles);
            return;
        }

        if ((lineSegmentMode || arrowMode) && lineStart) {
            const lastLine = [...lines];
            lastLine[lastLine.length - 1].points = [
                lineStart.x,
                lineStart.y,
                stagePoint.x,
                stagePoint.y,
            ];
            setLines(lastLine);
            return;
        }

        if (rectangleMode && startPoint) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            const lastRect = [...rectangles];
            const index = lastRect.length - 1;
            lastRect[index] = {
                ...lastRect[index],
                width: stagePoint.x - startPoint.x,
                height: stagePoint.y - startPoint.y,
            };
            setRectangles(lastRect);
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
            addToHistory(lines);
        }
        if (isErasing) {
            setIsErasing(false);
            addToHistory(lines);
            addToHistory(textElements);
            addToHistory(rectangles);
        }
        if (rectangleMode && startPoint) {
            setStartPoint(null);
            addToHistory(rectangles);
            return;
        }
    };

    const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
        if (!textMode) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const point = stage.getPointerPosition();
        if (!point) return;

        const stagePoint = {
            x: (point.x - stagePos.x) / stageScale,
            y: (point.y - stagePos.y) / stageScale,
        };

        const newId = `text-${Date.now()}`;
        const newText: TextElement = {
            x: stagePoint.x,
            y: stagePoint.y,
            text: '',
            fontSize: 30,
            fill: currentColor,
            id: newId,
        };

        setTextElements([...textElements, newText]);
        setSelectedTextId(newId);
        setEditingText('');

        // Position and show the textarea
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.position = 'fixed';
        textarea.style.top = `${point.y}px`;
        textarea.style.left = `${point.x}px`;
        textarea.style.display = 'block';
        textarea.style.width = `${window.innerWidth - point.x}px`; // Set exact width
        textarea.style.height = `${window.innerHeight - point.y}px`; // Set exact height
        textarea.focus();
    };

    // Handle text editing
    const handleTextDblClick = (
        e: KonvaEventObject<MouseEvent>,
        textId: string,
    ) => {
        const text = textElements.find((t) => t.id === textId);
        if (!text) return;

        setEditingText(text.text);
        setSelectedTextId(textId);

        const textarea = textareaRef.current;
        const stage = e.target.getStage();
        if (!textarea || !stage) return;

        const textNode = stage.findOne(`#${textId}`) as Konva.Text;
        const position = getTextPosition(textNode, stage);
        const rotation = getTextRotation(textNode);

        // Apply the same transformations to textarea
        textarea.style.position = 'fixed';
        textarea.style.top = `${position.y}px`;
        textarea.style.left = `${position.x}px`;
        textarea.style.display = 'block';
        textarea.style.fontSize = `${text.fontSize}px`;
        textarea.style.transform = `rotate(${rotation}deg)`;
        textarea.style.transformOrigin = 'left top';
        textarea.style.width = `${window.innerWidth - position.x}px`; // Set exact width
        textarea.style.height = `${window.innerHeight - position.y}px`; // Set exact height
        textarea.focus();
    };

    useEffect(() => {
        if (eraserMode) {
            setTextMode(false);
        }
    }, [eraserMode]);

    const drawArrowhead = (
        context: Konva.Context,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
    ) => {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const length = 20; // Length of the arrow head

        const arrowAngle = Math.PI / 6; // 30 degrees

        // Calculate arrow head points
        const x3 = x2 - length * Math.cos(angle - arrowAngle);
        const y3 = y2 - length * Math.sin(angle - arrowAngle);
        const x4 = x2 - length * Math.cos(angle + arrowAngle);
        const y4 = y2 - length * Math.sin(angle + arrowAngle);

        // Draw arrow head
        context.beginPath();
        context.moveTo(x2, y2);
        context.lineTo(x3, y3);
        context.moveTo(x2, y2);
        context.lineTo(x4, y4);
        context.stroke();
    };

    const getSelectedLine = () => {
        if (selectedId && selectedShape === 'line') {
            return lines[parseInt(selectedId)];
        }
        return null;
    };

    const getSelectedRect = () => {
        if (selectedId && selectedShape === 'rectangle') {
            return rectangles[parseInt(selectedId)];
        }
        return null;
    };

    return (
        <>
            <div className="fixed z-20 ml-2 mt-2 flex flex-col gap-2 sm:flex-row">
                <div>
                    <Button
                        aria-label="hand"
                        variant={dragModeEnabled ? 'secondary' : 'default'}
                        onClick={() => {
                            if (dragModeEnabled) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setDragModeEnabled(true);
                            }
                        }}
                    >
                        <Hand className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="move"
                        variant={moveMode ? 'secondary' : 'default'}
                        onClick={() => {
                            if (moveMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setMoveMode(true);
                            }
                        }}
                    >
                        <MoveUpLeft className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="eraser"
                        variant={eraserMode ? 'secondary' : 'default'}
                        onClick={() => {
                            if (eraserMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setEraserMode(true);
                            }
                        }}
                    >
                        <Eraser className="h-4 w-4" />{' '}
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="text"
                        variant={textMode ? 'secondary' : 'default'}
                        onClick={() => {
                            if (textMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setTextMode(true);
                            }
                        }}
                    >
                        <Type className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="line-segment"
                        variant={lineSegmentMode ? 'secondary' : 'default'}
                        onClick={() => {
                            if (lineSegmentMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setLineSegmentMode(true);
                            }
                        }}
                    >
                        <LineIcon className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="arrow"
                        variant={arrowMode ? 'secondary' : 'default'}
                        onClick={() => {
                            if (arrowMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setArrowMode(true);
                            }
                        }}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="rectangle"
                        variant={rectangleMode ? 'secondary' : 'default'}
                        onClick={() => {
                            if (rectangleMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setRectangleMode(true);
                            }
                        }}
                    >
                        <Square className="h-4 w-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="dashed-line"
                        variant={
                            moveMode &&
                            (getSelectedLine()?.isDashed ||
                                getSelectedRect()?.isDashed)
                                ? 'secondary'
                                : dashedMode
                                  ? 'secondary'
                                  : 'default'
                        }
                        onClick={() => {
                            if (moveMode && selectedId) {
                                if (selectedShape === 'line') {
                                    // Toggle dash for selected line
                                    const newLines = [...lines];
                                    const lineIndex = parseInt(selectedId);
                                    newLines[lineIndex] = {
                                        ...newLines[lineIndex],
                                        isDashed: !newLines[lineIndex].isDashed,
                                    };
                                    setLines(newLines);
                                    addToHistory(newLines);
                                } else if (selectedShape === 'rectangle') {
                                    // Toggle dash for selected rectangle
                                    const newRectangles = [...rectangles];
                                    const rectIndex = parseInt(selectedId);
                                    newRectangles[rectIndex] = {
                                        ...newRectangles[rectIndex],
                                        isDashed:
                                            !newRectangles[rectIndex].isDashed,
                                    };
                                    setRectangles(newRectangles);
                                    addToHistory(newRectangles);
                                }
                            } else {
                                // Toggle global dash mode
                                setDashedMode(!dashedMode);
                            }
                        }}
                    >
                        <SquareDashed className="h-4 w-4" />
                    </Button>
                </div>
                {!eraserMode && (
                    <>
                        <div>
                            <Button className="p-2 backdrop-blur">
                                <input
                                    aria-label="color"
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
                        stagePos={stagePos}
                        stageRef={stageRef}
                        stageScale={stageScale}
                        strokeWidth={strokeWidth}
                    />
                </div>
            </div>
            <div className="fixed bottom-4 left-4 z-20 flex gap-2">
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
                    stagePos={stagePos}
                    stageRef={stageRef}
                    stageScale={stageScale}
                    strokeWidth={strokeWidth}
                    className="hidden sm:block"
                />
            </div>
            <textarea
                ref={textareaRef}
                aria-label="textarea"
                style={{
                    color: currentColor,
                    lineHeight: '1.2',
                }}
                className="fixed z-10 m-0 hidden resize-none overflow-hidden border-none bg-transparent p-0 font-excalifont text-3xl outline-none"
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const updatedTexts = textElements.map((t) =>
                            t.id === selectedTextId
                                ? { ...t, text: editingText || '' }
                                : t,
                        );
                        setTextElements(updatedTexts);
                        setSelectedTextId(null);
                        setEditingText(null);
                        textareaRef.current!.style.display = 'none';
                        addToHistory(lines);
                        disableAllModes();
                    }
                }}
                onBlur={() => {
                    const updatedTexts = textElements.map((t) =>
                        t.id === selectedTextId
                            ? { ...t, text: editingText || '' }
                            : t,
                    );
                    setTextElements(updatedTexts);
                    setSelectedTextId(null);
                    setEditingText(null);
                    textareaRef.current!.style.display = 'none';
                    addToHistory(lines);
                }}
                value={editingText || ''}
            />
            <div
                data-testid="canvas-container"
                style={{
                    cursor: isDragging
                        ? 'grabbing'
                        : dragModeEnabled
                          ? 'grab'
                          : 'crosshair',
                }}
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
                                setSelectedShape(null);
                            }
                        }
                        handleStageClick(e);
                    }}
                    ref={stageRef}
                    x={stagePos.x}
                    y={stagePos.y}
                    style={{
                        cursor: isDragging
                            ? 'grabbing'
                            : dragModeEnabled
                              ? 'grab'
                              : 'crosshair',
                    }}
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
                                tension={0.5} // Set tension for smooth free-drawing curves
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation="source-over"
                                dash={line.isDashed ? [10, 10] : undefined}
                                onClick={(e) => {
                                    if (moveMode) {
                                        e.cancelBubble = true;
                                        const transformer =
                                            transformerRef.current;
                                        if (transformer) {
                                            transformer.nodes([e.target]);
                                            transformer.getLayer()?.batchDraw();
                                        }
                                        setSelectedId(String(i));
                                        setSelectedShape('line');
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
                                        setSelectedId(String(i));
                                        setSelectedShape('line');
                                    }
                                }}
                                onTransformEnd={(e) => handleTransformEnd(e, i)}
                                sceneFunc={(context, shape) => {
                                    context.beginPath();

                                    // Check if it's a line segment/arrow (will have exactly 4 points) or free drawing
                                    if (line.points.length === 4) {
                                        // Draw straight line for line segments and arrows
                                        context.moveTo(
                                            line.points[0],
                                            line.points[1],
                                        );
                                        context.lineTo(
                                            line.points[2],
                                            line.points[3],
                                        );
                                    } else {
                                        // Draw curved line for free drawing
                                        context.moveTo(
                                            line.points[0],
                                            line.points[1],
                                        );
                                        for (
                                            let i = 2;
                                            i < line.points.length;
                                            i += 2
                                        ) {
                                            context.lineTo(
                                                line.points[i],
                                                line.points[i + 1],
                                            );
                                        }
                                    }

                                    context.strokeShape(shape);

                                    if (
                                        line.isArrow &&
                                        line.points.length === 4
                                    ) {
                                        drawArrowhead(
                                            context,
                                            line.points[0],
                                            line.points[1],
                                            line.points[2],
                                            line.points[3],
                                        );
                                    }
                                }}
                            />
                        ))}
                        {rectangles.map((rect, i) => (
                            <Rect
                                key={`rect-${i}`}
                                id={`rect-${i}`}
                                {...rect}
                                cornerRadius={rect.cornerRadius} // Add this line
                                stroke={rect.color}
                                strokeWidth={rect.strokeWidth}
                                dash={rect.isDashed ? [10, 10] : undefined}
                                draggable={moveMode}
                                onClick={(e) => {
                                    if (moveMode) {
                                        e.cancelBubble = true;
                                        const transformer =
                                            transformerRef.current;
                                        if (transformer) {
                                            transformer.nodes([e.target]);
                                            transformer.getLayer()?.batchDraw();
                                        }
                                        setSelectedId(String(i));
                                        setSelectedShape('rectangle');
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
                                        setSelectedId(String(i));
                                        setSelectedShape('rectangle');
                                    }
                                }}
                                onTransformEnd={(e) => {
                                    const node = e.target;
                                    const scaleX = node.scaleX();
                                    const scaleY = node.scaleY();

                                    node.scaleX(1);
                                    node.scaleY(1);

                                    const newRectangles = [...rectangles];
                                    newRectangles[i] = {
                                        ...newRectangles[i],
                                        x: node.x(),
                                        y: node.y(),
                                        width: node.width() * scaleX,
                                        height: node.height() * scaleY,
                                    };

                                    setRectangles(newRectangles);
                                    addToHistory(newRectangles);
                                }}
                            />
                        ))}
                        {textElements.map((text) => (
                            <Text
                                key={text.id}
                                id={text.id}
                                x={text.x}
                                y={text.y}
                                text={text.text}
                                fontSize={text.fontSize}
                                fontFamily="Excalifont"
                                fill={text.fill}
                                draggable={moveMode}
                                visible={selectedTextId !== text.id}
                                onDblClick={(e) =>
                                    handleTextDblClick(e, text.id)
                                }
                                onDblTap={(e: KonvaEventObject<TouchEvent>) =>
                                    handleTextTap(e, text.id)
                                }
                                onClick={(e) => {
                                    if (moveMode) {
                                        e.cancelBubble = true;
                                        const transformer =
                                            transformerRef.current;
                                        if (transformer) {
                                            transformer.nodes([e.target]);
                                            transformer.getLayer()?.batchDraw();
                                        }
                                        setSelectedId(text.id);
                                        setSelectedShape('text');
                                    }
                                }}
                                onTap={(e) => {
                                    if (moveMode) {
                                        e.cancelBubble = true;
                                        const transformer =
                                            transformerRef.current;
                                        if (transformer) {
                                            transformer.nodes([e.target]);
                                            transformer.getLayer()?.batchDraw();
                                        }
                                        setSelectedId(text.id);
                                        setSelectedShape('text');
                                    }
                                }}
                                onTransform={(e) => {
                                    const node = e.target;
                                    const scaleX = node.scaleX();

                                    // Update the text element with new position and scale
                                    const updatedTexts = textElements.map(
                                        (t) =>
                                            t.id === text.id
                                                ? {
                                                      ...t,
                                                      x: node.x(),
                                                      y: node.y(),
                                                      fontSize:
                                                          text.fontSize *
                                                          scaleX,
                                                  }
                                                : t,
                                    );
                                    setTextElements(updatedTexts);

                                    // Reset scale after applying fontSize
                                    node.scaleX(1);
                                    node.scaleY(1);
                                }}
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
