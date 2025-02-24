import { Button } from '@/components/ui/button';

interface TextSizeButtonsProps {
    textMode: boolean;
    moveMode: boolean;
    selectedShape: string | null;
    selectedTextId: string | null;
    newTextSize: number;
    textElements: TextElement[];
    selectedId: string | null;
    setTextElements: (elements: TextElement[]) => void;
    addToHistory: (state: TextElement[]) => void;
    setNewTextSize: (size: number) => void;
}

const TEXT_SIZES = {
    SMALL: 20,
    MEDIUM: 30,
    LARGE: 40,
} as const;

type TextSizeKey = keyof typeof TEXT_SIZES;

const TEXT_SIZE_LABELS: Record<TextSizeKey, string> = {
    SMALL: 'S',
    MEDIUM: 'M',
    LARGE: 'L',
};

export function TextSizeButtons({
    textMode,
    moveMode,
    selectedShape,
    selectedTextId,
    newTextSize,
    textElements,
    selectedId,
    setTextElements,
    addToHistory,
    setNewTextSize,
}: TextSizeButtonsProps) {
    const handleTextSizeChange = (size: number) => {
        if (textMode && selectedTextId) {
            const newTextElements = textElements.map((text) =>
                text.id === selectedTextId ? { ...text, fontSize: size } : text,
            );
            setTextElements(newTextElements);
        } else if (textMode) {
            setNewTextSize(size);
        }
        if (moveMode && selectedId) {
            const newTextElements = textElements.map((text) =>
                text.id === selectedId ? { ...text, fontSize: size } : text,
            );
            setTextElements(newTextElements);
            addToHistory(newTextElements);
        }
    };

    if (textMode || (moveMode && selectedShape === 'text')) {
        return (
            <div className="flex flex-col items-center gap-2 sm:flex-row">
                {(Object.keys(TEXT_SIZES) as TextSizeKey[]).map((key) => (
                    <Button
                        key={key}
                        variant={
                            (textMode &&
                                ((!selectedTextId &&
                                    newTextSize === TEXT_SIZES[key]) ||
                                    (selectedTextId &&
                                        textElements.find(
                                            (t) => t.id === selectedTextId,
                                        )?.fontSize === TEXT_SIZES[key]))) ||
                            (moveMode &&
                                selectedShape === 'text' &&
                                textElements.find((t) => t.id === selectedId)
                                    ?.fontSize === TEXT_SIZES[key])
                                ? 'secondary'
                                : 'default'
                        }
                        onClick={() => handleTextSizeChange(TEXT_SIZES[key])}
                        disabled={moveMode && !selectedShape}
                    >
                        {TEXT_SIZE_LABELS[key]}
                    </Button>
                ))}
            </div>
        );
    }
    return null;
}
