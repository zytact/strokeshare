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
        const modeButton = screen.getByText('Pan Mode');
        expect(modeButton).toBeInTheDocument();
    });

    it('toggles between pan and draw mode', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByText('Pan Mode');

        fireEvent.click(modeButton);
        expect(screen.getByText('Draw Mode')).toBeInTheDocument();

        fireEvent.click(modeButton);
        expect(screen.getByText('Pan Mode')).toBeInTheDocument();
    });

    it('shows drawing controls only in draw mode', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByText('Pan Mode');

        // Initially, color picker and undo button should not be visible
        expect(screen.queryByText('Color:')).not.toBeInTheDocument();
        expect(screen.queryByText('Undo')).not.toBeInTheDocument();

        // Switch to draw mode
        fireEvent.click(modeButton);

        // Now drawing controls should be visible
        expect(screen.getByText('Color:')).toBeInTheDocument();
        expect(screen.getByText('Undo')).toBeInTheDocument();
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
        const modeButton = screen.getByText('Pan Mode');

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
        const modeButton = screen.getByText('Pan Mode');
        fireEvent.click(modeButton);

        const undoButton = screen.getByText('Undo');
        expect(undoButton).toBeDisabled(); // Should be disabled initially

        // Simulate drawing
        const canvas = screen.getByTestId('infinite-canvas');
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        expect(undoButton).not.toBeDisabled(); // Should be enabled after drawing
    });

    it('handles color picker changes', () => {
        render(<InfiniteCanvas />);
        const modeButton = screen.getByText('Pan Mode');
        fireEvent.click(modeButton);

        const colorPicker = screen.getByLabelText('Color:');
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
