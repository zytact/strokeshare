import * as React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { MoveHorizontal } from 'lucide-react';

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
                    <MoveHorizontal className="size-4" />
                    <span className="hidden text-sm sm:block">
                        {strokeWidth}px
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex flex-col gap-4">
                    <h4 className="leading-none font-medium">Stroke Width</h4>
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
