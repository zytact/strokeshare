import { useLineStore } from '@/store/useLineStore';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

export default function Clear() {
    const { lines, clearLines } = useLineStore();

    return (
        <Button
            onClick={clearLines}
            data-testid="clear"
            disabled={lines.length === 0}
        >
            <Trash className="h-4 w-4" />
        </Button>
    );
}
