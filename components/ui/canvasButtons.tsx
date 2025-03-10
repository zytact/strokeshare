import { Button } from './button';
import TextButton from './TextButton';
import Konva from 'konva';
import {
    Hand,
    Eraser,
    MoveUpLeft,
    Redo2,
    Undo2,
    ZoomIn,
    ZoomOut,
    Minus as LineIcon,
    ArrowRight,
    SquareDashed,
    Square,
    PaintBucket,
    Palette,
    Circle as CircleIcon,
    Image as ImageIcon,
    FileUp,
    Trash,
} from 'lucide-react';
import { TextSizeButtons } from './TextSizeButtons';
import { StrokeWidth } from './StrokeWidth';
import { DownloadPop } from './DownloadPop';
import { Help } from './Help';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
    getSelectedLine,
    getSelectedCircle,
    getSelectedRect,
} from '@/lib/selectShapeUtils';

interface CanvasButtonsProps {
    dragModeEnabled: boolean;
    setDragModeEnabled: (enabled: boolean) => void;
    moveMode: boolean;
    setMoveMode: (enabled: boolean) => void;
    eraserMode: boolean;
    setEraserMode: (enabled: boolean) => void;
    textMode: boolean;
    setTextMode: (enabled: boolean) => void;
    lineSegmentMode: boolean;
    setLineSegmentMode: (enabled: boolean) => void;
    arrowMode: boolean;
    setArrowMode: (enabled: boolean) => void;
    rectangleMode: boolean;
    setRectangleMode: (enabled: boolean) => void;
    circleMode: boolean;
    setCircleMode: (enabled: boolean) => void;
    dashedMode: boolean;
    setDashedMode: (enabled: boolean) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFillColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleZoom: (zoomIn: boolean) => void;
    stagePos: { x: number; y: number };
    stageRef: React.RefObject<Konva.Stage | null>;
    stageScale: number;
    strokeWidth: number;
    setCurrentColor: (color: string) => void;
    currentColor: string;
    newTextSize: number;
    setNewTextSize: (size: number) => void;
    selectedShape: ShapeType | null;
    selectedTextId: string | null;
    selectedId: string | null;
    disableAllModes: () => void;
    setStrokeWidth: (width: number) => void;
}

export default function CanvasButtons({
    dragModeEnabled,
    setDragModeEnabled,
    moveMode,
    setMoveMode,
    eraserMode,
    setEraserMode,
    textMode,
    setTextMode,
    lineSegmentMode,
    setLineSegmentMode,
    arrowMode,
    setArrowMode,
    rectangleMode,
    setRectangleMode,
    circleMode,
    setCircleMode,
    dashedMode,
    setDashedMode,
    handleImageUpload,
    handleFillColorChange,
    handleZoom,
    stagePos,
    stageRef,
    stageScale,
    strokeWidth,
    setCurrentColor,
    currentColor,
    newTextSize,
    setNewTextSize,
    selectedShape,
    selectedTextId,
    selectedId,
    disableAllModes,
    setStrokeWidth,
}: CanvasButtonsProps) {
    const {
        canRedo,
        canUndo,
        undo,
        redo,
        setImages,
        setLines,
        setRectangles,
        setCircles,
        lines,
        rectangles,
        textElements,
        setTextElements,
        circles,
        addToHistory,
        clear,
    } = useCanvasStore();

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                if (!event.target || typeof event.target.result !== 'string')
                    return;

                const jsonData = JSON.parse(event.target.result);

                // Validate the imported data has the expected structure
                if (!jsonData.elements) {
                    console.error('Invalid JSON format: missing elements');
                    return;
                }

                // Import all canvas elements
                const elements = jsonData.elements;

                // Set all the elements individually
                if (elements.lines) {
                    setLines(elements.lines);
                }

                if (elements.textElements) {
                    setTextElements(elements.textElements);
                }

                if (elements.rectangles) {
                    setRectangles(elements.rectangles);
                }

                if (elements.circles) {
                    setCircles(elements.circles);
                }

                if (elements.images) {
                    setImages(elements.images);
                }

                // Add everything to history at once as a consolidated state
                addToHistory({
                    lines: elements.lines || [],
                    textElements: elements.textElements || [],
                    rectangles: elements.rectangles || [],
                    circles: elements.circles || [],
                    images: elements.images || [],
                });

                // Reset the file input
                e.target.value = '';
            } catch (error) {
                console.error('Error importing JSON:', error);
            }
        };

        reader.readAsText(file);
    };

    return (
        <>
            <div className="fixed z-20 mt-2 ml-2 flex flex-col gap-1 sm:flex-row sm:gap-2">
                <div className="relative">
                    <Button variant="default">
                        <input
                            type="file"
                            accept=".str"
                            onChange={handleImportJSON}
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        <FileUp className="size-4" />
                    </Button>
                </div>
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
                        <Hand className="size-4" />
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
                        <MoveUpLeft className="size-4" />
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
                        <Eraser className="size-4" />{' '}
                    </Button>
                </div>
                <div>
                    <TextButton
                        textMode={textMode}
                        moveMode={moveMode}
                        selectedShape={selectedShape}
                        selectedTextId={selectedTextId}
                        newTextSize={newTextSize}
                        textElements={textElements}
                        selectedId={selectedId}
                        setTextElements={setTextElements}
                        addToHistory={addToHistory}
                        setNewTextSize={setNewTextSize}
                        onClick={() => {
                            if (textMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setTextMode(true);
                            }
                        }}
                    />
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
                        <LineIcon className="size-4" />
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
                        <ArrowRight className="size-4" />
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
                        <Square className="size-4" />
                    </Button>
                </div>
                <div>
                    <Button
                        aria-label="circle"
                        variant={circleMode ? 'secondary' : 'default'}
                        onClick={() => {
                            if (circleMode) {
                                disableAllModes();
                            } else {
                                disableAllModes();
                                setCircleMode(true);
                            }
                        }}
                    >
                        <CircleIcon className="size-4" />
                    </Button>
                </div>

                <div className="relative">
                    <Button aria-label="upload-image" className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        <ImageIcon className="size-4" />
                    </Button>
                </div>

                <div>
                    <Button
                        aria-label="dashed-line"
                        variant={
                            moveMode &&
                            (getSelectedLine(selectedId, selectedShape, lines)
                                ?.isDashed ||
                                getSelectedRect(
                                    selectedId,
                                    selectedShape,
                                    rectangles,
                                )?.isDashed ||
                                getSelectedCircle(
                                    selectedId,
                                    selectedShape,
                                    circles,
                                )?.isDashed)
                                ? 'secondary'
                                : dashedMode
                                  ? 'secondary'
                                  : 'default'
                        }
                        onClick={() => {
                            if (moveMode && selectedId) {
                                switch (selectedShape) {
                                    case 'line':
                                        const newLines = [...lines];
                                        const lineIndex = parseInt(selectedId);
                                        newLines[lineIndex] = {
                                            ...newLines[lineIndex],
                                            isDashed:
                                                !newLines[lineIndex].isDashed,
                                        };
                                        setLines(newLines);
                                        addToHistory(newLines);
                                        break;
                                    case 'rectangle':
                                        const newRectangles = [...rectangles];
                                        const rectIndex = parseInt(selectedId);
                                        newRectangles[rectIndex] = {
                                            ...newRectangles[rectIndex],
                                            isDashed:
                                                !newRectangles[rectIndex]
                                                    .isDashed,
                                        };
                                        setRectangles(newRectangles);
                                        addToHistory(newRectangles);
                                        break;
                                    case 'circle':
                                        const newCircles = [...circles];
                                        const circleIndex =
                                            parseInt(selectedId);
                                        newCircles[circleIndex] = {
                                            ...newCircles[circleIndex],
                                            isDashed:
                                                !newCircles[circleIndex]
                                                    .isDashed,
                                        };
                                        setCircles(newCircles);
                                        addToHistory(newCircles);
                                        break;
                                }
                            } else {
                                // Toggle global dash mode
                                setDashedMode(!dashedMode);
                            }
                        }}
                    >
                        <SquareDashed className="size-4" />
                    </Button>
                </div>
                {moveMode && (
                    <>
                        {(selectedShape === 'rectangle' ||
                            selectedShape === 'circle') && (
                            <div className="relative">
                                <Button aria-label="fill" className="relative">
                                    <input
                                        type="color"
                                        onChange={handleFillColorChange}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                    <PaintBucket className="size-4" />
                                </Button>
                            </div>
                        )}
                        <div className="relative">
                            <Button
                                aria-label="stroke-color"
                                className="relative"
                                disabled={!selectedShape}
                            >
                                <input
                                    type="color"
                                    onChange={(e) => {
                                        const newColor = e.target.value;
                                        if (
                                            moveMode &&
                                            selectedId &&
                                            selectedShape
                                        ) {
                                            switch (selectedShape) {
                                                case 'line': {
                                                    const newLines = [...lines];
                                                    const lineIndex =
                                                        parseInt(selectedId);
                                                    newLines[lineIndex] = {
                                                        ...newLines[lineIndex],
                                                        color: newColor,
                                                    };
                                                    setLines(newLines);
                                                    addToHistory(newLines);
                                                    break;
                                                }

                                                case 'rectangle': {
                                                    const newRectangles = [
                                                        ...rectangles,
                                                    ];
                                                    const rectIndex =
                                                        parseInt(selectedId);
                                                    newRectangles[rectIndex] = {
                                                        ...newRectangles[
                                                            rectIndex
                                                        ],
                                                        color: newColor,
                                                    };
                                                    setRectangles(
                                                        newRectangles,
                                                    );
                                                    addToHistory(newRectangles);
                                                    break;
                                                }

                                                case 'circle': {
                                                    const newCircles = [
                                                        ...circles,
                                                    ];
                                                    const circleIndex =
                                                        parseInt(selectedId);
                                                    newCircles[circleIndex] = {
                                                        ...newCircles[
                                                            circleIndex
                                                        ],
                                                        color: newColor,
                                                    };
                                                    setCircles(newCircles);
                                                    addToHistory(newCircles);
                                                    break;
                                                }
                                                case 'text': {
                                                    const newTextElements =
                                                        textElements.map((t) =>
                                                            t.id === selectedId
                                                                ? {
                                                                      ...t,
                                                                      fill: newColor,
                                                                  }
                                                                : t,
                                                        );
                                                    setTextElements(
                                                        newTextElements,
                                                    );
                                                    addToHistory(
                                                        newTextElements,
                                                    );
                                                    break;
                                                }
                                            }
                                        }
                                    }}
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    disabled={!selectedShape}
                                />
                                <Palette className="size-4" />
                            </Button>
                        </div>
                    </>
                )}
                {!eraserMode && (
                    <>
                        <div>
                            <Button className="p-2 backdrop-blur-sm">
                                <input
                                    aria-label="draw-color"
                                    type="color"
                                    onChange={(e) =>
                                        setCurrentColor(e.target.value)
                                    }
                                    className="h-8 w-8 cursor-pointer rounded-md bg-transparent"
                                    value={currentColor}
                                />
                            </Button>
                        </div>
                        {moveMode && (
                            <TextSizeButtons
                                className="hidden gap-2 sm:flex"
                                textMode={textMode}
                                moveMode={moveMode}
                                selectedShape={selectedShape}
                                selectedTextId={selectedTextId}
                                newTextSize={newTextSize}
                                textElements={textElements}
                                selectedId={selectedId}
                                setTextElements={setTextElements}
                                addToHistory={addToHistory}
                                setNewTextSize={setNewTextSize}
                            />
                        )}

                        <StrokeWidth
                            strokeWidth={strokeWidth}
                            onStrokeWidthChange={setStrokeWidth}
                        />
                    </>
                )}
                <div>
                    <Button
                        aria-label="clear-canvas"
                        onClick={() => {
                            clear();
                            disableAllModes();
                        }}
                    >
                        <Trash className="size-4" />
                    </Button>
                </div>
                <div className="block sm:hidden">
                    <DownloadPop
                        stagePos={stagePos}
                        stageRef={stageRef}
                        stageScale={stageScale}
                        strokeWidth={strokeWidth}
                    />
                </div>
            </div>
            <div className="fixed right-4 bottom-16 z-20 block sm:hidden">
                {moveMode && (
                    <TextSizeButtons
                        className="flex flex-col items-center gap-2 sm:hidden"
                        textMode={textMode}
                        moveMode={moveMode}
                        selectedShape={selectedShape}
                        selectedTextId={selectedTextId}
                        newTextSize={newTextSize}
                        textElements={textElements}
                        selectedId={selectedId}
                        setTextElements={setTextElements}
                        addToHistory={addToHistory}
                        setNewTextSize={setNewTextSize}
                    />
                )}
            </div>
            <div className="fixed bottom-4 left-4 z-20 flex gap-2">
                <Button
                    aria-label="undo"
                    variant="default"
                    onClick={undo}
                    disabled={!canUndo()}
                >
                    <Undo2 className="size-4" />
                </Button>
                <Button
                    aria-label="redo"
                    variant="default"
                    onClick={redo}
                    disabled={!canRedo()}
                >
                    <Redo2 className="size-4" />
                </Button>
                <div className="bg-border mx-2 h-8 w-px" />
                <Button
                    aria-label="zoom-in"
                    variant="default"
                    onClick={() => handleZoom(true)}
                >
                    <ZoomIn className="size-4" />
                </Button>
                <div className="bg-secondary flex h-10 min-w-[4rem] items-center justify-center rounded-md px-2 text-sm">
                    {Math.round(stageScale * 100)}%
                </div>
                <Button
                    aria-label="zoom-out"
                    variant="default"
                    onClick={() => handleZoom(false)}
                >
                    <ZoomOut className="size-4" />
                </Button>
                <div className="bg-border mx-2 hidden h-8 w-px sm:block" />
                <DownloadPop
                    stagePos={stagePos}
                    stageRef={stageRef}
                    stageScale={stageScale}
                    strokeWidth={strokeWidth}
                    className="hidden sm:block"
                />
            </div>
            <div className="fixed right-4 bottom-4 z-20 hidden sm:block">
                <Help />
            </div>
        </>
    );
}
