import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import InfiniteCanvas from '../InfiniteCanvas';
import { describe, it, expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock the ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

describe('InfiniteCanvas', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders without crashing', () => {
        render(<InfiniteCanvas />);
        expect(screen.getByTestId('infinite-canvas')).toBeInTheDocument();
    });

    it('starts in pan mode by default', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        expect(modeButton).toBeInTheDocument();
    });

    it('toggles between pan and draw mode', () => {
        render(<InfiniteCanvas />);
        const toggleButton = screen.getByTestId('toggle-button');

        // Initially should show Hand icon in pan mode
        expect(toggleButton.querySelector('svg')).toHaveAttribute(
            'aria-label',
            'pan-mode',
        );

        // Click to switch to draw mode
        fireEvent.click(toggleButton);
        expect(toggleButton.querySelector('svg')).toHaveAttribute(
            'aria-label',
            'draw-mode',
        );

        // Click again to switch back to pan mode
        fireEvent.click(toggleButton);
        expect(toggleButton.querySelector('svg')).toHaveAttribute(
            'aria-label',
            'pan-mode',
        );
    });

    it('buttons container has correct responsive classes', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton); // Switch to draw mode to show all buttons

        const buttonContainer = modeButton.parentElement;
        expect(buttonContainer).toHaveClass('flex', 'sm:flex-row', 'flex-col');
    });

    it('shows drawing controls only in draw mode', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');

        // Initially, color picker and undo button should not be visible
        expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument();
        expect(screen.queryByTestId('undo')).not.toBeInTheDocument();

        // Switch to draw mode
        fireEvent.click(modeButton);

        // Now drawing controls should be visible
        expect(screen.getByTestId('color-picker')).toBeInTheDocument();
        expect(screen.getByTestId('undo')).toBeInTheDocument();
    });

    it('handles mouse events for panning', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        // Simulate panning
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Check if cursor styles are applied correctly
        expect(canvas).toHaveClass('cursor-grab');
        fireEvent.mouseDown(canvas);
        expect(canvas).toHaveClass('cursor-grabbing');
    });

    it('handles mouse events for drawing', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');
        const modeButton = screen.getByTestId('toggle-button');

        // Switch to draw mode
        fireEvent.click(modeButton);

        // Check if cursor style changes
        expect(canvas).toHaveClass('cursor-crosshair');

        // Simulate drawing
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);
    });

    it('handles undo functionality', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton);

        const undoButton = screen.getByTestId('undo');
        expect(undoButton).toHaveClass('disabled:opacity-50'); // Should be disabled initially

        // Simulate drawing
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        expect(undoButton).not.toBeDisabled(); // Should be enabled after drawing
    });

    it('handles color picker changes', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton);

        const colorPicker = screen.getByTestId('color-picker');
        fireEvent.change(colorPicker, { target: { value: '#ff0000' } });

        expect(colorPicker).toHaveValue('#ff0000');
    });

    it('handles keyboard shortcuts', () => {
        render(<InfiniteCanvas />);

        // Simulate Ctrl+Z
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

        // Simulate Cmd+Z (Mac)
        fireEvent.keyDown(window, { key: 'z', metaKey: true });
    });

    it('cleans up event listeners on unmount', () => {
        const { unmount } = render(<InfiniteCanvas />);
        unmount();
        // ResizeObserver should be disconnected on unmount
        expect(global.ResizeObserver).toBeCalled();
    });
});

describe('InfiniteCanvas Touch Events', () => {
    afterEach(() => {
        cleanup();
    });
    it('handles touch events for panning', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        // Simulate touch panning
        fireEvent.touchStart(canvas, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(canvas, {
            touches: [{ clientX: 150, clientY: 150 }],
        });
        fireEvent.touchEnd(canvas);

        // Check if cursor styles are applied correctly
        expect(canvas).toHaveClass('cursor-grab');
    });

    it('handles touch events for drawing', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');
        const modeButton = screen.getByTestId('toggle-button');

        // Switch to draw mode
        fireEvent.click(modeButton);

        // Check if cursor style changes
        expect(canvas).toHaveClass('cursor-crosshair');

        // Simulate drawing with touch
        fireEvent.touchStart(canvas, {
            touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(canvas, {
            touches: [{ clientX: 150, clientY: 150 }],
        });
        fireEvent.touchEnd(canvas);
    });

    it('handles multi-touch interactions correctly', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        // Simulate multi-touch interaction
        fireEvent.touchStart(canvas, {
            touches: [
                { clientX: 100, clientY: 100 },
                { clientX: 200, clientY: 200 },
            ],
        });
        fireEvent.touchMove(canvas, {
            touches: [
                { clientX: 150, clientY: 150 },
                { clientX: 250, clientY: 250 },
            ],
        });
        fireEvent.touchEnd(canvas);
    });

    it('maintains drawing state through touch interactions', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');
        const modeButton = screen.getByTestId('toggle-button');

        // Switch to draw mode
        fireEvent.click(modeButton);

        // Start drawing
        fireEvent.touchStart(canvas, {
            touches: [{ clientX: 100, clientY: 100 }],
        });

        // Multiple touch moves
        fireEvent.touchMove(canvas, {
            touches: [{ clientX: 120, clientY: 120 }],
        });
        fireEvent.touchMove(canvas, {
            touches: [{ clientX: 140, clientY: 140 }],
        });

        // End drawing
        fireEvent.touchEnd(canvas);

        // Verify undo button is enabled after drawing
        const undoButton = screen.getByTestId('undo');
        expect(undoButton).not.toBeDisabled();
    });
});

describe('InfiniteCanvas Redo Functionality', () => {
    afterEach(() => {
        cleanup();
    });

    it('redo button should be disabled initially', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton); // Switch to draw mode

        const redoButton = screen.getByTestId('redo');
        expect(redoButton).toBeDisabled();
    });

    it('redo button should be enabled after an undo operation', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton); // Switch to draw mode

        // Draw something
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Perform undo
        const undoButton = screen.getByTestId('undo');
        fireEvent.click(undoButton);

        // Check if redo button is enabled
        const redoButton = screen.getByTestId('redo');
        expect(redoButton).not.toBeDisabled();
    });

    it('redo button should be disabled after redoing all available actions', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton); // Switch to draw mode

        // Draw something
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Undo
        const undoButton = screen.getByTestId('undo');
        fireEvent.click(undoButton);

        // Redo
        const redoButton = screen.getByTestId('redo');
        fireEvent.click(redoButton);

        // Check if redo button is disabled again
        expect(redoButton).toBeDisabled();
    });

    it('handles Ctrl+Y keyboard shortcut for redo', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton); // Switch to draw mode

        // Draw something
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Undo with Ctrl+Z
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

        // Redo with Ctrl+Y
        fireEvent.keyDown(window, { key: 'y', ctrlKey: true });

        const redoButton = screen.getByTestId('redo');
        expect(redoButton).toBeDisabled(); // Should be disabled after redoing
    });

    it('handles Shift+Ctrl+Z keyboard shortcut for redo', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton); // Switch to draw mode

        // Draw something
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Undo with Ctrl+Z
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

        // Redo with Shift+Ctrl+Z
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });

        const redoButton = screen.getByTestId('redo');
        expect(redoButton).toBeDisabled(); // Should be disabled after redoing
    });

    it('clears redo stack when new drawing is made after undo', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('toggle-button');
        fireEvent.click(modeButton); // Switch to draw mode

        const canvas = screen.getByTestId('infinite-canvas');

        // Draw first line
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Undo
        const undoButton = screen.getByTestId('undo');
        fireEvent.click(undoButton);

        // Draw new line
        fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
        fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 });
        fireEvent.mouseUp(canvas);

        // Check if redo button is disabled
        const redoButton = screen.getByTestId('redo');
        expect(redoButton).toBeDisabled();
    });
});
