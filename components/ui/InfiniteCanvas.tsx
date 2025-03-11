'use client';
import {
    Stage,
    Layer,
    Line,
    Transformer,
    Text,
    Rect,
    Circle,
    Image,
} from 'react-konva';
import { useState, useRef, useEffect, useCallback } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { useTheme } from 'next-themes';
import { useCanvasStore } from '@/store/useCanvasStore';
import useImage from 'use-image';
import {
    isPointNearText,
    isPointNearRectangle,
    isPointNearCircle,
    isPointNearImage,
    getDistanceToLineSegment,
} from '@/lib/eraserUtils';

import { getTextRotation } from '@/lib/textUtils';
import CanvasButtons from './canvasButtons';

interface LoadedImageProps
    extends Omit<React.ComponentProps<typeof Image>, 'image'> {
    src: string;
    alt: string;
}

const LoadedImage = ({ src, alt, ...imageProps }: LoadedImageProps) => {
    const [image] = useImage(src);
    return <Image image={image} alt={alt} {...imageProps} />;
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

    const [clipboardItem, setClipboardItem] = useState<{
        type: ShapeType;
        data: DrawLine | TextElement | Rectangle | Circle | Image;
    } | null>(null);

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
        rectangles,
        setRectangles,
        circles,
        setCircles,
        images,
        setImages,
    } = useCanvasStore();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);
    const [moveMode, setMoveMode] = useState(false);
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [lineSegmentMode, setLineSegmentMode] = useState(false);
    const [lineStart, setLineStart] = useState<Point | null>(null);
    const [arrowMode, setArrowMode] = useState(false);
    const [dashedMode, setDashedMode] = useState(false);
    const [rectangleMode, setRectangleMode] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [circleMode, setCircleMode] = useState(false);

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
        setCircleMode(false);
        resetTransformer();
    };

    useEffect(() => {
        const linesFromStorage = localStorage.getItem('lines');
        const textElementsFromStorage = localStorage.getItem('texts');
        const rectanglesFromStorage = localStorage.getItem('rectangles');
        const circlesFromStorage = localStorage.getItem('circles');
        const imagesFromStorage = localStorage.getItem('images');

        let loadedLines: DrawLine[] = [];
        let loadedTexts: TextElement[] = [];
        let loadedRectangles: Rectangle[] = [];
        let loadedCircles: Circle[] = [];
        let loadedImages: Image[] = [];

        if (linesFromStorage) {
            try {
                const parsedData = JSON.parse(linesFromStorage);
                const parsedLines = parsedData && parsedData.lines;
                if (Array.isArray(parsedLines)) {
                    setLines(parsedLines);
                    loadedLines = parsedLines;
                } else {
                    console.error('Lines data is not an array:', parsedLines);
                }
            } catch (error) {
                console.error(
                    'Failed to parse lines from localStorage:',
                    error,
                );
            }
        }

        if (textElementsFromStorage) {
            try {
                const parsedData = JSON.parse(textElementsFromStorage);
                const parsedTexts = parsedData && parsedData.textElements;
                if (Array.isArray(parsedTexts)) {
                    setTextElements(parsedTexts);
                    loadedTexts = parsedTexts;
                } else {
                    console.error(
                        'Text elements data is not an array:',
                        parsedTexts,
                    );
                }
            } catch (error) {
                console.error(
                    'Failed to parse text elements from localStorage:',
                    error,
                );
            }
        }

        if (rectanglesFromStorage) {
            try {
                const parsedData = JSON.parse(rectanglesFromStorage);
                const parsedRectangles = parsedData && parsedData.rectangles;
                if (Array.isArray(parsedRectangles)) {
                    setRectangles(parsedRectangles);
                    loadedRectangles = parsedRectangles;
                } else {
                    console.error(
                        'Rectangles data is not an array:',
                        parsedRectangles,
                    );
                }
            } catch (error) {
                console.error(
                    'Failed to parse rectangles from localStorage:',
                    error,
                );
            }
        }

        if (circlesFromStorage) {
            try {
                const parsedData = JSON.parse(circlesFromStorage);
                const parsedCircles = parsedData && parsedData.circles;
                if (Array.isArray(parsedCircles)) {
                    setCircles(parsedCircles);
                    loadedCircles = parsedCircles;
                } else {
                    console.error(
                        'Circles data is not an array:',
                        parsedCircles,
                    );
                }
            } catch (error) {
                console.error(
                    'Failed to parse circles from localStorage:',
                    error,
                );
            }
        }

        if (imagesFromStorage) {
            try {
                const parsedData = JSON.parse(imagesFromStorage);
                const parsedImages = parsedData && parsedData.images;
                if (Array.isArray(parsedImages)) {
                    setImages(parsedImages);
                    loadedImages = parsedImages;
                } else {
                    console.error('Images data is not an array:', parsedImages);
                }
            } catch (error) {
                console.error(
                    'Failed to parse images from localStorage:',
                    error,
                );
            }
        }

        // After loading all items from localStorage, add them to history all at once
        if (
            loadedLines.length > 0 ||
            loadedTexts.length > 0 ||
            loadedRectangles.length > 0 ||
            loadedCircles.length > 0 ||
            loadedImages.length > 0
        ) {
            addToHistory({
                lines: loadedLines,
                textElements: loadedTexts,
                rectangles: loadedRectangles,
                circles: loadedCircles,
                images: loadedImages,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            } else if (selectedShape === 'circle') {
                shape = stage.findOne('#circle-' + selectedId);
            } else if (selectedShape === 'image') {
                shape = stage.findOne('#' + selectedId); // Remove the 'image-' prefix
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

    // Function to handle paste operation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleElementPaste = () => {
        if (!clipboardItem) return;

        // Add a small offset to make the pasted item visible
        const OFFSET = 20;

        switch (clipboardItem.type) {
            case 'line': {
                const newLine = { ...clipboardItem.data } as DrawLine;
                // Apply offset to points
                if (
                    'points' in newLine &&
                    newLine.points &&
                    newLine.points.length > 0
                ) {
                    const offsetPoints = [...newLine.points];
                    for (let i = 0; i < offsetPoints.length; i += 2) {
                        offsetPoints[i] += OFFSET; // x
                        offsetPoints[i + 1] += OFFSET; // y
                    }
                    newLine.points = offsetPoints;
                }
                setLines([...lines, newLine]);
                addToHistory([...lines, newLine]);
                break;
            }
            case 'text': {
                const textData = clipboardItem.data as TextElement;
                const newText = {
                    ...textData,
                    id: `text-${Date.now()}`,
                    x: textData.x + OFFSET,
                    y: textData.y + OFFSET,
                };
                setTextElements([...textElements, newText]);
                addToHistory([...textElements, newText]);
                break;
            }
            case 'rectangle': {
                const rectData = clipboardItem.data as Rectangle;
                const newRect = {
                    ...rectData,
                    x: rectData.x + OFFSET,
                    y: rectData.y + OFFSET,
                };
                setRectangles([...rectangles, newRect]);
                addToHistory([...rectangles, newRect]);
                break;
            }
            case 'circle': {
                const circleData = clipboardItem.data as Circle;
                const newCircle = {
                    ...circleData,
                    x: circleData.x + OFFSET,
                    y: circleData.y + OFFSET,
                };
                setCircles([...circles, newCircle]);
                addToHistory([...circles, newCircle]);
                break;
            }
            case 'image': {
                const imageData = clipboardItem.data as Image;
                const newImage = {
                    ...imageData,
                    id: `image-${Date.now()}`,
                    x: imageData.x + OFFSET,
                    y: imageData.y + OFFSET,
                };

                setImages([...images, newImage]);
                addToHistory([...images, newImage]);
                break;
            }
        }

        // Select the newly pasted item
        setTimeout(() => {
            if (stageRef.current) {
                let pastedNode;

                if (clipboardItem.type === 'line') {
                    pastedNode = stageRef.current.findOne(
                        `#line-${lines.length}`,
                    );
                    setSelectedId(String(lines.length));
                } else if (clipboardItem.type === 'text') {
                    const newTextId = `text-${Date.now()}`;
                    pastedNode = stageRef.current.findOne(`#${newTextId}`);
                    setSelectedId(newTextId);
                } else if (clipboardItem.type === 'rectangle') {
                    pastedNode = stageRef.current.findOne(
                        `#rect-${rectangles.length}`,
                    );
                    setSelectedId(String(rectangles.length));
                } else if (clipboardItem.type === 'circle') {
                    pastedNode = stageRef.current.findOne(
                        `#circle-${circles.length}`,
                    );
                    setSelectedId(String(circles.length));
                } else if (clipboardItem.type === 'image') {
                    const newImageId = `image-${Date.now()}`;
                    pastedNode = stageRef.current.findOne(`#${newImageId}`);
                    setSelectedId(newImageId);
                }

                if (pastedNode && transformerRef.current) {
                    transformerRef.current.nodes([pastedNode]);
                    transformerRef.current.getLayer()?.batchDraw();
                    setSelectedShape(clipboardItem.type);
                }
            }
        }, 10);
    };

    // Function to handle copy operation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleElementCopy = () => {
        if (!selectedShape || !selectedId) return;

        switch (selectedShape) {
            case 'line': {
                const lineIndex = parseInt(selectedId);
                if (lines[lineIndex]) {
                    setClipboardItem({
                        type: 'line',
                        data: { ...lines[lineIndex] },
                    });
                }
                break;
            }
            case 'text': {
                const text = textElements.find((t) => t.id === selectedId);
                if (text) {
                    setClipboardItem({
                        type: 'text',
                        data: { ...text },
                    });
                }
                break;
            }
            case 'rectangle': {
                const rectIndex = parseInt(selectedId);
                if (rectangles[rectIndex]) {
                    setClipboardItem({
                        type: 'rectangle',
                        data: { ...rectangles[rectIndex] },
                    });
                }
                break;
            }
            case 'circle': {
                const circleIndex = parseInt(selectedId);
                if (circles[circleIndex]) {
                    setClipboardItem({
                        type: 'circle',
                        data: { ...circles[circleIndex] },
                    });
                }
                break;
            }
            case 'image': {
                const image = images.find((img) => img.id === selectedId);
                if (image) {
                    setClipboardItem({
                        type: 'image',
                        data: { ...image },
                    });
                }
                break;
            }
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleElementDelete = () => {
        if (!selectedId || !selectedShape) return;

        switch (selectedShape) {
            case 'line': {
                const lineIndex = parseInt(selectedId);
                const updatedLines = lines.filter(
                    (_, index) => index !== lineIndex,
                );
                setLines(updatedLines);
                addToHistory(updatedLines);
                break;
            }
            case 'text': {
                const updatedTexts = textElements.filter(
                    (text) => text.id !== selectedId,
                );
                setTextElements(updatedTexts);
                addToHistory(updatedTexts);
                break;
            }
            case 'rectangle': {
                const rectIndex = parseInt(selectedId);
                const updatedRectangles = rectangles.filter(
                    (_, index) => index !== rectIndex,
                );
                setRectangles(updatedRectangles);
                addToHistory(updatedRectangles);
                break;
            }
            case 'circle': {
                const circleIndex = parseInt(selectedId);
                const updatedCircles = circles.filter(
                    (_, index) => index !== circleIndex,
                );
                setCircles(updatedCircles);
                addToHistory(updatedCircles);
                break;
            }
            case 'image': {
                const updatedImages = images.filter(
                    (img) => img.id !== selectedId,
                );
                setImages(updatedImages);
                addToHistory(updatedImages);
                break;
            }
        }

        resetTransformer();
        setSelectedId(null);
        setSelectedShape(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                } else if (e.key === 'c') {
                    // Copy selected element
                    if (moveMode && selectedId && selectedShape) {
                        e.preventDefault();
                        handleElementCopy();
                    }
                } else if (e.key === 'v') {
                    // Paste copied element
                    if (moveMode && clipboardItem) {
                        e.preventDefault();
                        handleElementPaste();
                    }
                }
            }

            if (e.key === 'Delete') {
                if (moveMode) {
                    e.preventDefault();
                    handleElementDelete();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        undo,
        redo,
        moveMode,
        selectedId,
        selectedShape,
        clipboardItem,
        handleElementCopy,
        handleElementPaste,
        handleElementDelete,
    ]);

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
                fill: undefined,
            };
            setRectangles([...rectangles, newRect]);
            return;
        }

        if (evt.button === 0 && circleMode) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            setStartPoint(stagePoint);
            const newCircle = {
                x: stagePoint.x,
                y: stagePoint.y,
                radius: 0,
                color: currentColor,
                strokeWidth: strokeWidth,
                isDashed: dashedMode,
                fill: undefined,
            };
            setCircles([...circles, newCircle]);
            return;
        }

        if (
            evt.button === 0 &&
            !dragModeEnabled &&
            !moveMode &&
            !eraserMode &&
            !lineSegmentMode &&
            !arrowMode &&
            !rectangleMode &&
            !circleMode &&
            !textMode
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

            // Handle circle erasing
            const updatedCircles = circles.filter((circle) => {
                return !isPointNearCircle(
                    stagePoint.x,
                    stagePoint.y,
                    circle,
                    stage,
                    eraserRadius,
                );
            });

            // Handle image erasing
            const updatedImages = images.filter((image) => {
                return !isPointNearImage(
                    stagePoint.x,
                    stagePoint.y,
                    image,
                    stage,
                    eraserRadius,
                );
            });

            setLines(updatedLines);
            setTextElements(updatedTextElements);
            setRectangles(updatedRectangles);
            setCircles(updatedCircles);
            setImages(updatedImages);
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

        if (circleMode && startPoint) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            const dx = stagePoint.x - startPoint.x;
            const dy = stagePoint.y - startPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);

            const lastCircle = [...circles];
            const index = lastCircle.length - 1;
            lastCircle[index] = {
                ...lastCircle[index],
                radius: radius,
            };
            setCircles(lastCircle);
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
        resetInteractionStates();
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

    const handleLineTransformEnd = (
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
        e.evt.preventDefault(); // Still prevent context menu from showing
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
                cornerRadius: 8,
                fill: undefined,
            };
            setRectangles([...rectangles, newRect]);
            return;
        }

        if (circleMode) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            setStartPoint(stagePoint);
            const newCircle = {
                x: stagePoint.x,
                y: stagePoint.y,
                radius: 0,
                color: currentColor,
                strokeWidth: strokeWidth,
                isDashed: dashedMode,
                fill: undefined,
            };
            setCircles([...circles, newCircle]);
            return;
        }

        if (
            !dragModeEnabled &&
            !moveMode &&
            !lineSegmentMode &&
            !eraserMode &&
            !arrowMode &&
            !rectangleMode &&
            !circleMode &&
            !textMode
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
                fontSize: newTextSize, // Use newTextSize instead of hardcoded value
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
            textarea.style.fontSize = `${newTextSize}px`; // Update textarea font size
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
        const textPosition = textNode.absolutePosition();
        const rotation = getTextRotation(textNode);

        // Position textarea for touch input
        textarea.style.position = 'fixed';
        textarea.style.top = `${textPosition.y}px`;
        textarea.style.left = `${textPosition.x}px`;
        textarea.style.display = 'block';
        textarea.style.fontSize = `${text.fontSize * stageScale}px`;
        textarea.style.transform = `rotate(${rotation}deg)`;
        textarea.style.transformOrigin = 'left top';
        textarea.style.width = `${window.innerWidth - textPosition.x}px`; // Set exact width
        textarea.style.height = `${window.innerHeight - textPosition.y}px`; // Set exact height
        textarea.value = text.text;
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

            // Handle circle erasing
            const updatedCircles = circles.filter((circle) => {
                return !isPointNearCircle(
                    stagePoint.x,
                    stagePoint.y,
                    circle,
                    stage,
                    eraserRadius,
                );
            });

            // Handle image erasing
            const updatedImages = images.filter((image) => {
                return !isPointNearImage(
                    stagePoint.x,
                    stagePoint.y,
                    image,
                    stage,
                    eraserRadius,
                );
            });

            setLines(updatedLines);
            setTextElements(updatedTextElements);
            setRectangles(updatedRectangles);
            setCircles(updatedCircles);
            setImages(updatedImages);
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

        if (circleMode && startPoint) {
            const point = e.target.getStage()?.getPointerPosition();
            if (!point) return;

            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            const dx = stagePoint.x - startPoint.x;
            const dy = stagePoint.y - startPoint.y;
            const radius = Math.sqrt(dx * dx + dy * dy);

            const lastCircle = [...circles];
            const index = lastCircle.length - 1;
            lastCircle[index] = {
                ...lastCircle[index],
                radius: radius,
            };
            setCircles(lastCircle);
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
        resetInteractionStates();
    };

    const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
        if (!textMode) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const clickedOnEmpty = e.target === stage;
        if (!clickedOnEmpty) return;

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
            fontSize: newTextSize,
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
        textarea.style.width = `${window.innerWidth - point.x}px`;
        textarea.style.height = `${window.innerHeight - point.y}px`;
        textarea.style.fontSize = `${newTextSize * stageScale}px`;
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
        const textPosition = textNode.absolutePosition();
        const rotation = getTextRotation(textNode);

        // Apply the same transformations to textarea
        textarea.style.position = 'fixed';
        textarea.style.top = `${textPosition.y}px`;
        textarea.style.left = `${textPosition.x}px`;
        textarea.style.display = 'block';
        textarea.style.fontSize = `${text.fontSize * stageScale}px`;
        textarea.style.transform = `rotate(${rotation}deg)`;
        textarea.style.transformOrigin = 'left top';
        textarea.style.width = `${window.innerWidth - textPosition.x}px`; // Set exact width
        textarea.style.height = `${window.innerHeight - textPosition.y}px`; // Set exact height
        textarea.value = text.text;
        textarea.focus();
    };

    const resetInteractionStates = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
        }
        if (isDrawing) {
            setIsDrawing(false);
            addToHistory(lines);
        }
        if (isErasing) {
            setIsErasing(false);
            const currentState = {
                lines,
                textElements,
                rectangles,
                circles,
                images,
            };
            addToHistory(currentState);
        }
        if (rectangleMode && startPoint) {
            // Add history even if no startPoint to ensure proper state update
            addToHistory(rectangles);
            // Reset startPoint to allow drawing new rectangles
            setStartPoint(null);
        }
        if (circleMode && startPoint) {
            addToHistory(circles);
            // Reset startPoint to allow drawing new circles
            setStartPoint(null);
        }
    }, [
        addToHistory,
        circleMode,
        isDragging,
        isDrawing,
        isErasing,
        lines,
        rectangleMode,
        rectangles,
        circles,
        textElements,
        images,
        startPoint,
    ]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            resetInteractionStates();
        };

        // Add global event listeners
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [
        isDragging,
        isDrawing,
        isErasing,
        addToHistory,
        lines,
        textElements,
        rectangles,
        circles,
        images,
        resetInteractionStates,
    ]);

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

    const handleFillColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        if (moveMode && selectedId && selectedShape) {
            switch (selectedShape) {
                case 'rectangle':
                    const newRectangles = [...rectangles];
                    const rectIndex = parseInt(selectedId);
                    newRectangles[rectIndex] = {
                        ...newRectangles[rectIndex],
                        fill: `${newColor}40`, // 40 hex = 25% opacity
                    };
                    setRectangles(newRectangles);
                    addToHistory(newRectangles);
                    break;
                case 'circle':
                    const newCircles = [...circles];
                    const circleIndex = parseInt(selectedId);
                    newCircles[circleIndex] = {
                        ...newCircles[circleIndex],
                        fill: `${newColor}40`, // 40 hex = 25% opacity
                    };
                    setCircles(newCircles);
                    addToHistory(newCircles);
                    break;
                default:
                    console.warn(
                        `Fill color change not supported for shape type: ${selectedShape}`,
                    );
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new window.Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const scale = Math.min(300 / img.width, 300 / img.height);
                    const newImage: Image = {
                        x:
                            dimensions.width / 2 / stageScale -
                            (img.width * scale) / 2 -
                            stagePos.x / stageScale,
                        y:
                            dimensions.height / 2 / stageScale -
                            (img.height * scale) / 2 -
                            stagePos.y / stageScale,
                        width: img.width * scale,
                        height: img.height * scale,
                        src: event.target?.result as string,
                        id: `image-${Date.now()}`,
                    };
                    setImages([...images, newImage]);
                    addToHistory([...images, newImage]);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const handleImagePaste = async (e: ClipboardEvent) => {
            if (e.clipboardData && e.clipboardData.items) {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        e.preventDefault();
                        const file = items[i].getAsFile();
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const img = new window.Image();
                                img.src = event.target?.result as string;
                                img.onload = () => {
                                    const scale = Math.min(
                                        300 / img.width,
                                        300 / img.height,
                                    );
                                    const newImage: Image = {
                                        x:
                                            dimensions.width / 2 / stageScale -
                                            (img.width * scale) / 2 -
                                            stagePos.x / stageScale,
                                        y:
                                            dimensions.height / 2 / stageScale -
                                            (img.height * scale) / 2 -
                                            stagePos.y / stageScale,
                                        width: img.width * scale,
                                        height: img.height * scale,
                                        src: event.target?.result as string,
                                        id: `image-${Date.now()}`,
                                    };
                                    setImages([...images, newImage]);
                                    addToHistory([...images, newImage]);
                                };
                            };
                            reader.readAsDataURL(file);
                        }
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handleImagePaste);
        return () => window.removeEventListener('paste', handleImagePaste);
    }, [
        addToHistory,
        dimensions.height,
        dimensions.width,
        images,
        stagePos.x,
        stagePos.y,
        stageScale,
        setImages,
    ]);

    const [newTextSize, setNewTextSize] = useState(30);

    const shapeOnClickHandler = (
        e: KonvaEventObject<MouseEvent | TouchEvent>,
        i: number,
        shape: ShapeType,
    ) => {
        if (moveMode) {
            e.cancelBubble = true;
            const transformer = transformerRef.current;
            if (transformer) {
                const id = shape === 'image' ? images[i].id : String(i);
                transformer.nodes([e.target]);
                transformer.getLayer()?.batchDraw();
                setSelectedId(id);
                setSelectedShape(shape);
            }
        } else if (textMode) {
            e.cancelBubble = true; // Prevent bubbling

            // Get stage and pointer position
            const stage = e.target.getStage();
            if (!stage) return;

            const point = stage.getPointerPosition();
            if (!point) return;

            // Create text at click position
            const stagePoint = {
                x: (point.x - stagePos.x) / stageScale,
                y: (point.y - stagePos.y) / stageScale,
            };

            const newId = `text-${Date.now()}`;
            const newText: TextElement = {
                x: stagePoint.x,
                y: stagePoint.y,
                text: '',
                fontSize: newTextSize,
                fill: currentColor,
                id: newId,
            };

            setTextElements([...textElements, newText]);
            setSelectedTextId(newId);
            setEditingText('');

            // Position and show textarea for editing
            const textarea = textareaRef.current;
            if (!textarea) return;

            textarea.style.position = 'fixed';
            textarea.style.top = `${point.y}px`;
            textarea.style.left = `${point.x}px`;
            textarea.style.display = 'block';
            textarea.style.width = `${window.innerWidth - point.x}px`;
            textarea.style.height = `${window.innerHeight - point.y}px`;
            textarea.style.fontSize = `${newTextSize * stageScale}px`;
            textarea.focus();
        }
    };

    return (
        <>
            <CanvasButtons
                setMoveMode={setMoveMode}
                setDragModeEnabled={setDragModeEnabled}
                setEraserMode={setEraserMode}
                setLineSegmentMode={setLineSegmentMode}
                setArrowMode={setArrowMode}
                setRectangleMode={setRectangleMode}
                setCircleMode={setCircleMode}
                setTextMode={setTextMode}
                setNewTextSize={setNewTextSize}
                handleImageUpload={handleImageUpload}
                arrowMode={arrowMode}
                eraserMode={eraserMode}
                lineSegmentMode={lineSegmentMode}
                rectangleMode={rectangleMode}
                circleMode={circleMode}
                dashedMode={dashedMode}
                setDashedMode={setDashedMode}
                stageRef={stageRef}
                disableAllModes={disableAllModes}
                setStrokeWidth={setStrokeWidth}
                handleFillColorChange={handleFillColorChange}
                currentColor={currentColor}
                setCurrentColor={setCurrentColor}
                strokeWidth={strokeWidth}
                dragModeEnabled={dragModeEnabled}
                handleZoom={handleZoom}
                moveMode={moveMode}
                newTextSize={newTextSize}
                stagePos={stagePos}
                selectedId={selectedId}
                selectedShape={selectedShape}
                selectedTextId={selectedTextId}
                stageScale={stageScale}
                textMode={textMode}
            />
            <textarea
                ref={textareaRef}
                aria-label="textarea"
                style={{
                    color: currentColor,
                    lineHeight: '1.2',
                    fontSize: `${
                        selectedTextId
                            ? (textElements.find((t) => t.id === selectedTextId)
                                  ?.fontSize ?? newTextSize) * stageScale
                            : newTextSize * stageScale
                    }px`,
                }}
                className="font-excalifont fixed z-10 m-0 hidden resize-none overflow-hidden border-none bg-transparent p-0 outline-hidden"
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
                        // Only add to history if text was actually entered
                        if (editingText && editingText.trim() !== '') {
                            addToHistory(updatedTexts);
                        }
                        disableAllModes();
                    }
                }}
                onBlur={() => {
                    const updatedTexts = textElements.map((t) =>
                        t.id === selectedTextId
                            ? { ...t, text: editingText || '' }
                            : t,
                    );
                    // Remove empty text elements
                    const filteredTexts = updatedTexts.filter(
                        (t) => t.text.trim() !== '',
                    );
                    setTextElements(filteredTexts);
                    setSelectedTextId(null);
                    setEditingText(null);
                    textareaRef.current!.style.display = 'none';
                    // Only add to history if there were actual changes
                    if (
                        filteredTexts.length !== textElements.length ||
                        editingText?.trim()
                    ) {
                        addToHistory(filteredTexts);
                    }
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
                        {images.map((image, i) => (
                            <LoadedImage
                                key={image.id}
                                id={image.id}
                                src={image.src}
                                alt={`User uploaded content ${image.id}`}
                                x={image.x}
                                y={image.y}
                                width={image.width}
                                height={image.height}
                                draggable={moveMode}
                                onClick={(e: KonvaEventObject<MouseEvent>) => {
                                    shapeOnClickHandler(e, i, 'image');
                                }}
                                onTouchStart={(
                                    e: KonvaEventObject<TouchEvent>,
                                ) => {
                                    shapeOnClickHandler(e, i, 'image');
                                }}
                                onTransformEnd={(
                                    e: KonvaEventObject<Event>,
                                ) => {
                                    const node = e.target;
                                    const scaleX = node.scaleX();
                                    const scaleY = node.scaleY();

                                    node.scaleX(1);
                                    node.scaleY(1);

                                    const newImages = images.map((img) =>
                                        img.id === image.id
                                            ? {
                                                  ...img,
                                                  x: node.x(),
                                                  y: node.y(),
                                                  width: node.width() * scaleX,
                                                  height:
                                                      node.height() * scaleY,
                                              }
                                            : img,
                                    );

                                    setImages(newImages);
                                    addToHistory(newImages);
                                }}
                                onDragMove={(e: KonvaEventObject<Event>) => {
                                    const node = e.target;
                                    const updatedImages = images.map((img) =>
                                        img.id === image.id
                                            ? {
                                                  ...img,
                                                  x: node.x(),
                                                  y: node.y(),
                                              }
                                            : img,
                                    );
                                    setImages(updatedImages);
                                }}
                                onDragEnd={() => {
                                    addToHistory(images);
                                }}
                            />
                        ))}
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
                                onTransformEnd={(e) =>
                                    handleLineTransformEnd(e, i)
                                }
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
                                onDragEnd={(e) => {
                                    const node = e.target;
                                    const lineIndex = parseInt(
                                        node.id().split('-')[1],
                                    );

                                    // Get the current position of the line
                                    const dx = node.x();
                                    const dy = node.y();

                                    // Update the points array with the new position
                                    const newLines = [...lines];
                                    const points = [
                                        ...newLines[lineIndex].points,
                                    ];

                                    // Update each point's position
                                    for (let i = 0; i < points.length; i += 2) {
                                        points[i] += dx;
                                        points[i + 1] += dy;
                                    }

                                    // Update the line with new points
                                    newLines[lineIndex] = {
                                        ...newLines[lineIndex],
                                        points: points,
                                    };

                                    // Reset the node position since we've updated the points
                                    node.x(0);
                                    node.y(0);

                                    setLines(newLines);
                                    addToHistory(newLines);
                                }}
                            />
                        ))}
                        {rectangles.map((rect, i) => (
                            <Rect
                                key={`rect-${i}`}
                                id={`rect-${i}`}
                                {...rect}
                                cornerRadius={rect.cornerRadius}
                                stroke={rect.color}
                                strokeWidth={rect.strokeWidth}
                                dash={rect.isDashed ? [10, 10] : undefined}
                                draggable={moveMode}
                                fill={rect.fill}
                                onClick={(e) => {
                                    shapeOnClickHandler(e, i, 'rectangle');
                                }}
                                onTouchStart={(e) => {
                                    shapeOnClickHandler(e, i, 'rectangle');
                                }}
                                onTransformEnd={(e) => {
                                    const node = e.target;
                                    const scaleX = node.scaleX();
                                    const scaleY = node.scaleY();

                                    // Reset scale
                                    node.scaleX(1);
                                    node.scaleY(1);

                                    const newRectangles = rectangles.map(
                                        (r, index) =>
                                            index === i
                                                ? {
                                                      ...r,
                                                      x: node.x(),
                                                      y: node.y(),
                                                      width:
                                                          node.width() * scaleX,
                                                      height:
                                                          node.height() *
                                                          scaleY,
                                                  }
                                                : r,
                                    );

                                    setRectangles(newRectangles);
                                    addToHistory(newRectangles);
                                }}
                                onDragMove={(e) => {
                                    const node = e.target;
                                    const updatedRectangles = rectangles.map(
                                        (r, index) =>
                                            index === i
                                                ? {
                                                      ...r,
                                                      x: node.x(),
                                                      y: node.y(),
                                                  }
                                                : r,
                                    );
                                    setRectangles(updatedRectangles);
                                }}
                                onDragEnd={() => {
                                    addToHistory(rectangles);
                                }}
                            />
                        ))}
                        {circles.map((circle, i) => (
                            <Circle
                                key={`circle-${i}`}
                                id={`circle-${i}`}
                                {...circle}
                                stroke={circle.color}
                                strokeWidth={circle.strokeWidth}
                                dash={circle.isDashed ? [10, 10] : undefined}
                                draggable={moveMode}
                                fill={circle.fill}
                                onClick={(e) => {
                                    shapeOnClickHandler(e, i, 'circle');
                                }}
                                onTouchStart={(e) => {
                                    shapeOnClickHandler(e, i, 'circle');
                                }}
                                onTransformEnd={(e) => {
                                    const node = e.target;
                                    const scaleX = node.scaleX();
                                    const scaleY = node.scaleY();

                                    // Reset scale
                                    node.scaleX(1);
                                    node.scaleY(1);

                                    const newCircles = circles.map(
                                        (c, index) =>
                                            index === i
                                                ? {
                                                      ...c,
                                                      x: node.x(),
                                                      y: node.y(),
                                                      radius:
                                                          c.radius *
                                                          Math.max(
                                                              scaleX,
                                                              scaleY,
                                                          ),
                                                  }
                                                : c,
                                    );

                                    setCircles(newCircles);
                                    addToHistory(newCircles);
                                }}
                                onDragMove={(e) => {
                                    const node = e.target;
                                    const updatedCircles = circles.map(
                                        (c, index) =>
                                            index === i
                                                ? {
                                                      ...c,
                                                      x: node.x(),
                                                      y: node.y(),
                                                  }
                                                : c,
                                    );
                                    setCircles(updatedCircles);
                                }}
                                onDragEnd={() => {
                                    addToHistory(circles);
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
                                onDragMove={(e) => {
                                    const node = e.target;
                                    const updatedTexts = textElements.map(
                                        (t) =>
                                            t.id === text.id
                                                ? {
                                                      ...t,
                                                      x: node.x(),
                                                      y: node.y(),
                                                  }
                                                : t,
                                    );
                                    setTextElements(updatedTexts);
                                }}
                                onDragEnd={() => {
                                    addToHistory(textElements);
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
                            />
                        )}
                    </Layer>
                </Stage>
            </div>
        </>
    );
}
