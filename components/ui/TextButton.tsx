import * as React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Type } from 'lucide-react';
import { TextSizeButtons } from '@/components/ui/TextSizeButtons';

interface TextButtonProps {
    textMode: boolean;
    onClick: () => void;
    moveMode: boolean;
    selectedShape: 'circle' | 'image' | 'rectangle' | 'text' | 'line' | null;
    selectedTextId: string | null;
    newTextSize: number;
    textElements: TextElement[];
    selectedId: string | null;
    setTextElements: (elements: TextElement[]) => void;
    addToHistory: (elements: TextElement[]) => void;
    setNewTextSize: (size: number) => void;
}

export default function TextButton({
    textMode,
    onClick,
    moveMode,
    selectedShape,
    selectedTextId,
    newTextSize,
    textElements,
    selectedId,
    setTextElements,
    addToHistory,
    setNewTextSize,
}: TextButtonProps) {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        if (!textMode) {
            setIsPopoverOpen(false);
        }
    }, [textMode]);

    const handleButtonClick = () => {
        // If we're currently in text mode, just turn it off and keep popover closed
        if (textMode) {
            setIsPopoverOpen(false);
            onClick();
        } else {
            // If we're enabling text mode, open the popover and turn on text mode
            setIsPopoverOpen(true);
            onClick();
        }
    };

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    aria-label="text"
                    variant={textMode ? 'secondary' : 'default'}
                    onClick={handleButtonClick}
                >
                    <Type className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
                <TextSizeButtons
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
            </PopoverContent>
        </Popover>
    );
}
