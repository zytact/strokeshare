import * as React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Minus } from 'lucide-react';

interface StrokeWidthProps {
    strokeWidth: number;
    onStrokeWidthChange: (width: number) => void;
}

export function StrokeWidth({
    strokeWidth,
    onStrokeWidthChange,
}: StrokeWidthProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="default" className="flex items-center gap-2">
                    <Minus className="h-4 w-4" />
                    <span className="text-sm">{strokeWidth}px</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex flex-col gap-4">
                    <h4 className="font-medium leading-none">Stroke Width</h4>
                    <Slider
                        defaultValue={[strokeWidth]}
                        max={20}
                        min={1}
                        step={1}
                        onValueChange={(value) => onStrokeWidthChange(value[0])}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
