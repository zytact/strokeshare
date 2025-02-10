import { useLineStore } from '@/store/useLineStore';
import { Button } from '@/components/ui/button';

export default function Clear() {
    const { lines, clearLines } = useLineStore();

    return (
        <Button onClick={clearLines} disabled={lines.length === 0}>
            {' '}
            Clear{' '}
        </Button>
    );
}
