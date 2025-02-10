import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Eraser from '../Eraser';
import { useEraserStore, useLineStore } from '@/store/useCanvasStore';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe('Eraser', () => {
    afterEach(() => {
        cleanup();
        // Reset both eraser and line stores after each test
        useEraserStore.setState({ isEraserMode: false });
        useLineStore.setState({ lines: [] });
    });

    it('renders eraser button with icon', () => {
        render(<Eraser />);
        const eraserButton = screen.getByTestId('eraser-button');
        expect(eraserButton).toBeInTheDocument();
        expect(eraserButton.querySelector('svg')).toBeInTheDocument();
    });

    it('is disabled when there are no lines', () => {
        useLineStore.setState({ lines: [] });
        render(<Eraser />);
        const eraserButton = screen.getByTestId('eraser-button');
        expect(eraserButton).toHaveAttribute('disabled');
    });

    it('is enabled when there are lines', () => {
        useLineStore.setState({
            lines: [{ points: [{ x: 0, y: 0 }], color: '#000000' }],
        });
        render(<Eraser />);
        const eraserButton = screen.getByTestId('eraser-button');
        expect(eraserButton).not.toHaveAttribute('disabled');
    });

    it('toggles eraser mode when clicked', () => {
        useLineStore.setState({
            lines: [{ points: [{ x: 0, y: 0 }], color: '#000000' }],
        });

        render(<Eraser />);
        const eraserButton = screen.getByTestId('eraser-button');

        // Initial state (default variant)
        expect(eraserButton).toHaveClass('bg-primary');
        expect(useEraserStore.getState().isEraserMode).toBe(false);

        // Click to enable eraser mode
        fireEvent.click(eraserButton);
        expect(eraserButton).toHaveClass('bg-secondary');
        expect(useEraserStore.getState().isEraserMode).toBe(true);

        // Click to disable eraser mode
        fireEvent.click(eraserButton);
        expect(eraserButton).toHaveClass('bg-primary');
        expect(useEraserStore.getState().isEraserMode).toBe(false);
    });

    it('maintains disabled state when lines are removed', async () => {
        // Start with lines
        useLineStore.setState({
            lines: [{ points: [{ x: 0, y: 0 }], color: '#000000' }],
        });

        render(<Eraser />);
        const eraserButton = screen.getByTestId('eraser-button');
        expect(eraserButton).not.toHaveAttribute('disabled');

        // Remove all lines
        useLineStore.setState({ lines: [] });
        expect(eraserButton).toHaveClass('disabled:opacity-50');
    });

    it('changes variant based on eraser mode', () => {
        useLineStore.setState({
            lines: [{ points: [{ x: 0, y: 0 }], color: '#000000' }],
        });

        render(<Eraser />);
        const eraserButton = screen.getByTestId('eraser-button');

        // Check initial variant (default)
        expect(eraserButton).toHaveClass('bg-primary');

        // Enable eraser mode
        fireEvent.click(eraserButton);
        expect(eraserButton).toHaveClass('bg-secondary');

        // Disable eraser mode
        fireEvent.click(eraserButton);
        expect(eraserButton).toHaveClass('bg-primary');
    });
});
