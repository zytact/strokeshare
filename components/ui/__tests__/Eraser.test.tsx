import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Eraser from '../Eraser';
import { useEraserStore } from '@/store/useCanvasStore';
import InfiniteCanvas from '@/components/ui/InfiniteCanvas';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe('Eraser', () => {
    afterEach(() => {
        cleanup();
        // Reset the eraser store state after each test
        useEraserStore.setState({ isEraserMode: false });
    });

    it('renders without crashing', () => {
        render(<Eraser />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('toggles eraser mode when clicked', () => {
        render(<Eraser />);
        const eraserButton = screen.getByRole('button');

        // Initially should have default variant (not containing bg-secondary)
        expect(eraserButton).not.toHaveClass('bg-secondary');

        // Click to enable eraser mode
        fireEvent.click(eraserButton);
        expect(eraserButton).toHaveClass('bg-secondary');

        // Click again to disable eraser mode
        fireEvent.click(eraserButton);
        expect(eraserButton).not.toHaveClass('bg-secondary');
    });

    it('updates store state when toggled', () => {
        render(<Eraser />);
        const eraserButton = screen.getByRole('button');

        // Check initial state
        expect(useEraserStore.getState().isEraserMode).toBe(false);

        // Toggle eraser mode on
        fireEvent.click(eraserButton);
        expect(useEraserStore.getState().isEraserMode).toBe(true);

        // Toggle eraser mode off
        fireEvent.click(eraserButton);
        expect(useEraserStore.getState().isEraserMode).toBe(false);
    });

    describe('Eraser Integration with InfiniteCanvas', () => {
        it('eraser functionality works in drawing mode', () => {
            render(<InfiniteCanvas />);

            // Switch to drawing mode
            const modeButton = screen.getByTestId('pan-button');
            fireEvent.click(modeButton);

            // Enable eraser mode
            const eraserButton = screen.getByTestId('eraser-button');
            fireEvent.click(eraserButton);

            // Verify eraser mode is active
            expect(eraserButton).toHaveClass('bg-secondary');

            // Simulate drawing and erasing
            const canvas = screen.getByTestId('infinite-canvas');

            // Draw something
            fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
            fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
            fireEvent.mouseUp(canvas);

            // Erase
            fireEvent.mouseDown(canvas, { clientX: 125, clientY: 125 });
            fireEvent.mouseMove(canvas, { clientX: 125, clientY: 125 });
            fireEvent.mouseUp(canvas);
        });

        it('eraser mode disables color picker', () => {
            render(<InfiniteCanvas />);

            // Switch to drawing mode
            const modeButton = screen.getByTestId('pan-button');
            fireEvent.click(modeButton);

            // Color picker should be visible initially
            expect(screen.getByTestId('color-picker')).toBeInTheDocument();

            // Enable eraser mode
            const eraserButton = screen.getByTestId('eraser-button');
            fireEvent.click(eraserButton);

            // Color picker should not be visible in eraser mode
            expect(
                screen.queryByTestId('color-picker'),
            ).not.toBeInTheDocument();
        });

        it('maintains eraser state when switching between pan and draw modes', () => {
            render(<InfiniteCanvas />);

            // Switch to drawing mode
            const modeButton = screen.getByTestId('pan-button');
            fireEvent.click(modeButton);

            // Enable eraser mode
            const eraserButton = screen.getByTestId('eraser-button');
            fireEvent.click(eraserButton);

            // Switch to pan mode
            fireEvent.click(modeButton);

            // Switch back to draw mode
            fireEvent.click(modeButton);

            // Eraser button should still be in active state
            expect(eraserButton).toHaveClass('bg-secondary');
            expect(useEraserStore.getState().isEraserMode).toBe(true);
        });

        it('handles touch events in eraser mode', () => {
            render(<InfiniteCanvas />);
            const canvas = screen.getByTestId('infinite-canvas');
            const modeButton = screen.getByTestId('pan-button');

            // Switch to draw mode
            fireEvent.click(modeButton);

            // Switch to eraser mode
            const eraserButton = screen.getByTestId('eraser-button');
            fireEvent.click(eraserButton);

            // Simulate erasing with touch
            fireEvent.touchStart(canvas, {
                touches: [{ clientX: 100, clientY: 100 }],
            });
            fireEvent.touchMove(canvas, {
                touches: [{ clientX: 150, clientY: 150 }],
            });
            fireEvent.touchEnd(canvas);
        });
    });
});
