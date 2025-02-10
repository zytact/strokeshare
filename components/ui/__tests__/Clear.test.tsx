import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import InfiniteCanvas from '../InfiniteCanvas';
import { describe, it, expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe('Clear', () => {
    afterEach(() => {
        cleanup();
    });
    it('handles clear functionality', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton);

        // Should be disabled at first
        const clearButton = screen.getByTestId('clear');
        expect(clearButton).toHaveClass('disabled:opacity-50');

        // Draw something
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Click clear button
        fireEvent.click(clearButton);

        // After clearing, the undo and clear button should be disabled
        const undoButton = screen.getByTestId('undo');
        expect(undoButton).toHaveClass('disabled:opacity-50');
        expect(clearButton).toHaveClass('disabled:opacity-50');
    });
});
