import { Button } from '@/components/ui/button';
import { Eraser as EraserIcon } from 'lucide-react';
import { useEraserStore, useLineStore } from '@/store/useCanvasStore';

export default function Eraser() {
    const { isEraserMode, toggleEraseMode } = useEraserStore();
    const { lines } = useLineStore();
    return (
        <Button
            onClick={() => toggleEraseMode()}
            variant={isEraserMode ? 'secondary' : 'default'}
            data-testid="eraser-button"
            disabled={lines.length === 0}
        >
            <EraserIcon className="h-4 w-4" />
        </Button>
    );
}
