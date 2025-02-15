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

    it('buttons container has correct responsive classes', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('pan-button');
        fireEvent.click(modeButton); // Switch to draw mode to show all buttons

        const buttonContainer = modeButton.parentElement;
        expect(buttonContainer).toHaveClass('flex', 'sm:flex-row', 'flex-col');
    });

    it('handles mouse events for panning', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');
        const modeButton = screen.getByTestId('pan-button');
        fireEvent.click(modeButton);

        // Simulate panning
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Check if cursor styles are applied correctly
        expect(canvas).toHaveClass('cursor-grab');
        fireEvent.mouseDown(canvas);
        expect(canvas).toHaveClass('cursor-grabbing');
    });

    it('handles undo functionality', () => {
        render(<InfiniteCanvas />);

        const undoButton = screen.getByTestId('undo');
        // Initially the undo button should be disabled
        expect(undoButton).toBeDisabled();

        // Simulate drawing (we're in drawing mode by default now)
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // After drawing, undo button should be enabled
        expect(undoButton).not.toBeDisabled();
    });

    it('handles color picker changes', () => {
        render(<InfiniteCanvas />);

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
        const modeButton = screen.getByTestId('pan-button');
        fireEvent.click(modeButton);

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
        const modeButton = screen.getByTestId('pan-button');
        fireEvent.click(modeButton);

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
        const modeButton = screen.getByTestId('pan-button');
        fireEvent.click(modeButton); // Switch to draw mode

        const redoButton = screen.getByTestId('redo');
        expect(redoButton).toBeDisabled();
    });

    it('redo button should be enabled after an undo operation', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByTestId('pan-button');
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
        const modeButton = screen.getByTestId('pan-button');
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
        const modeButton = screen.getByTestId('pan-button');
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
        const modeButton = screen.getByTestId('pan-button');
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

describe('InfiniteCanvas Eraser Undo/Redo', () => {
    afterEach(() => {
        cleanup();
    });

    it('should allow undo and redo of erased lines', () => {
        render(<InfiniteCanvas />);

        // Draw a line
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Switch to eraser mode
        const eraserButton = screen.getByTestId('eraser-button');
        fireEvent.click(eraserButton);

        // Erase the line
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Undo the eraser action
        const undoButton = screen.getByTestId('undo');
        fireEvent.click(undoButton);
        expect(undoButton).not.toBeDisabled();

        // Redo the eraser action
        const redoButton = screen.getByTestId('redo');
        expect(redoButton).not.toBeDisabled();
        fireEvent.click(redoButton);
    });

    it('should properly handle multiple undo/redo operations with eraser', () => {
        render(<InfiniteCanvas />);

        // Draw multiple lines
        const canvas = screen.getByTestId('infinite-canvas');

        // Draw first line
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Draw second line
        fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
        fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 });
        fireEvent.mouseUp(canvas);

        // Switch to eraser mode
        const eraserButton = screen.getByTestId('eraser-button');
        fireEvent.click(eraserButton);

        // Erase first line
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        const undoButton = screen.getByTestId('undo');
        const redoButton = screen.getByTestId('redo');

        // Undo eraser action
        fireEvent.click(undoButton);
        expect(redoButton).not.toBeDisabled();

        // Redo eraser action
        fireEvent.click(redoButton);
        expect(redoButton).toBeDisabled();

        // Undo again
        fireEvent.click(undoButton);
        expect(redoButton).not.toBeDisabled();
    });

    it('should clear redo stack when drawing after erasing and undoing', () => {
        render(<InfiniteCanvas />);

        const canvas = screen.getByTestId('infinite-canvas');

        // Draw initial line
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Switch to eraser mode and erase
        const eraserButton = screen.getByTestId('eraser-button');
        fireEvent.click(eraserButton);
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Undo eraser action
        const undoButton = screen.getByTestId('undo');
        fireEvent.click(undoButton);

        // Switch back to draw mode
        fireEvent.click(eraserButton); // Turn off eraser

        // Draw new line
        fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
        fireEvent.mouseMove(canvas, { clientX: 250, clientY: 250 });
        fireEvent.mouseUp(canvas);

        // Check if redo is disabled
        const redoButton = screen.getByTestId('redo');
        expect(redoButton).toBeDisabled();
    });

    it('should handle keyboard shortcuts for undo/redo after erasing', () => {
        render(<InfiniteCanvas />);

        const canvas = screen.getByTestId('infinite-canvas');

        // Draw a line
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Switch to eraser and erase
        const eraserButton = screen.getByTestId('eraser-button');
        fireEvent.click(eraserButton);
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Undo with keyboard shortcut
        fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

        // Redo with keyboard shortcut
        fireEvent.keyDown(window, { key: 'y', ctrlKey: true });

        const redoButton = screen.getByTestId('redo');
        expect(redoButton).toBeDisabled();
    });
});

describe('InfiniteCanvas Space Bar Pan Mode', () => {
    afterEach(() => {
        cleanup();
    });

    it('should enter pan mode when space bar is pressed', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        // Initially should be in drawing mode
        expect(canvas).toHaveClass('cursor-crosshair');

        // Press space bar
        fireEvent.keyDown(window, { code: 'Space' });

        // Should switch to pan mode
        expect(canvas).toHaveClass('cursor-grab');
    });

    it('should return to previous mode when space bar is released', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        // Press space bar
        fireEvent.keyDown(window, { code: 'Space' });

        // Release space bar
        fireEvent.keyUp(window, { code: 'Space' });

        // Should return to drawing mode
        expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('should handle panning while space bar is pressed', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        // Press space bar
        fireEvent.keyDown(window, { code: 'Space' });

        // Simulate panning
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });

        // Should show grabbing cursor while panning
        expect(canvas).toHaveClass('cursor-grabbing');

        fireEvent.mouseUp(canvas);

        // Should return to grab cursor after releasing mouse
        expect(canvas).toHaveClass('cursor-grab');

        // Release space bar
        fireEvent.keyUp(window, { code: 'Space' });

        // Should return to drawing mode
        expect(canvas).toHaveClass('cursor-crosshair');
    });

    it('should prevent default space bar behavior', () => {
        render(<InfiniteCanvas />);

        // Create a mock event with preventDefault
        const mockEvent = new KeyboardEvent('keydown', { code: 'Space' });
        const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

        // Dispatch the event
        window.dispatchEvent(mockEvent);

        // Check if preventDefault was called
        expect(preventDefaultSpy).toHaveBeenCalled();
    });
});

describe('InfiniteCanvas Zoom Functionality', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render zoom controls', () => {
        render(<InfiniteCanvas />);

        // Check if zoom controls are present
        expect(screen.getByTestId('zoom-in')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-out')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-percentage')).toBeInTheDocument();
    });

    it('should display initial zoom level as 100%', () => {
        render(<InfiniteCanvas />);

        const zoomDisplay = screen.getByTestId('zoom-percentage');
        expect(zoomDisplay).toHaveTextContent('100%');
    });

    it('should increase zoom level when zoom in button is clicked', () => {
        render(<InfiniteCanvas />);

        const zoomInButton = screen.getByTestId('zoom-in');
        fireEvent.click(zoomInButton);

        const zoomDisplay = screen.getByTestId('zoom-percentage');
        expect(zoomDisplay).toHaveTextContent('105%');
    });

    it('should decrease zoom level when zoom out button is clicked', () => {
        render(<InfiniteCanvas />);

        const zoomOutButton = screen.getByTestId('zoom-out');
        fireEvent.click(zoomOutButton);

        const zoomDisplay = screen.getByTestId('zoom-percentage');
        expect(zoomDisplay).toHaveTextContent('95%');
    });

    it('should handle ctrl + wheel zoom in', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        fireEvent.wheel(canvas, {
            deltaY: -100,
            ctrlKey: true,
            clientX: 100,
            clientY: 100,
        });

        const zoomDisplay = screen.getByTestId('zoom-percentage');
        expect(zoomDisplay).toHaveTextContent('110%');
    });

    it('should handle ctrl + wheel zoom out', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        fireEvent.wheel(canvas, {
            deltaY: 100,
            ctrlKey: true,
            clientX: 100,
            clientY: 100,
        });

        const zoomDisplay = screen.getByTestId('zoom-percentage');
        expect(zoomDisplay).toHaveTextContent('90%');
    });

    it('should respect minimum zoom limit', () => {
        render(<InfiniteCanvas />);
        const zoomOutButton = screen.getByTestId('zoom-out');

        // Click multiple times to try to go below minimum
        for (let i = 0; i < 20; i++) {
            fireEvent.click(zoomOutButton);
        }

        const zoomDisplay = screen.getByTestId('zoom-percentage');
        expect(
            Number.parseInt(zoomDisplay.textContent!),
        ).toBeGreaterThanOrEqual(10);
    });

    it('should maintain drawn lines after zooming', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByTestId('infinite-canvas');

        // Draw a line
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Zoom in
        const zoomInButton = screen.getByTestId('zoom-in');
        fireEvent.click(zoomInButton);

        // Check if undo is still available (indicating the line is still there)
        const undoButton = screen.getByTestId('undo');
        expect(undoButton).not.toBeDisabled();
    });
});
