import { Button } from '@/components/ui/button';
import { Eraser as EraserIcon } from 'lucide-react';
import { useEraserStore } from '@/store/useCanvasStore';

export default function Eraser() {
    const { isEraserMode, toggleEraseMode } = useEraserStore();
    return (
        <Button
            onClick={() => toggleEraseMode()}
            variant={isEraserMode ? 'secondary' : 'default'}
            data-testid="eraser-button"
        >
            <EraserIcon className="h-4 w-4" />
        </Button>
    );
}
