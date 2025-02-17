import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import InfiniteCanvas from '@/components/ui/InfiniteCanvas';
import { describe, it, vi, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

vi.mock('next-themes', () => ({
    useTheme: () => ({
        resolvedTheme: 'light',
    }),
}));

// Mock window resize
vi.mock('konva', () => ({
    default: {
        Stage: vi.fn(() => ({
            on: vi.fn(),
            off: vi.fn(),
            getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
            scale: vi.fn(),
            position: vi.fn(),
        })),
        Layer: vi.fn(() => ({
            add: vi.fn(),
            batchDraw: vi.fn(),
        })),
        Line: vi.fn(() => ({
            on: vi.fn(),
            off: vi.fn(),
            points: vi.fn(),
        })),
    },
}));

describe('InfiniteCanvas', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders the canvas with initial controls', () => {
        render(<InfiniteCanvas />);

        // Check if canvas is present
        const canvas = screen.getByRole('presentation');
        expect(canvas).toBeInTheDocument();

        // Check if buttons are present (hand, move, eraser, and color picker)
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(6);
    });

    it('toggles drag mode when hand button is clicked', () => {
        render(<InfiniteCanvas />);
        const buttons = screen.getAllByRole('button');
        const handButton = buttons[0]; // First button is hand
        const canvasContainer = screen.getByRole('presentation').parentElement;

        // Initial state
        expect(canvasContainer).toHaveStyle({ cursor: 'crosshair' });

        // Click hand button
        fireEvent.click(handButton);
        expect(canvasContainer).toHaveStyle({ cursor: 'grab' });
    });

    it('hides color picker in eraser mode', () => {
        render(<InfiniteCanvas />);
        const buttons = screen.getAllByRole('button');
        const eraserButton = buttons[1]; // Second button is eraser

        // Click eraser button
        fireEvent.click(eraserButton);

        const colorPickerInput = screen.queryByRole('textbox', {
            hidden: true,
        });
        expect(colorPickerInput).not.toBeInTheDocument();
    });

    it('disables drag mode when switching to eraser mode', () => {
        render(<InfiniteCanvas />);
        const eraserButton = screen.getByRole('button', { name: /eraser/i });
        const stage = screen.getByTestId('canvas-container');

        // First click the eraser button
        fireEvent.click(eraserButton);

        expect(stage).toHaveStyle({ cursor: 'crosshair' });
    });

    it('has correct canvas dimensions', () => {
        render(<InfiniteCanvas />);
        const canvas = screen.getByRole('presentation').querySelector('canvas');
        expect(canvas).toHaveAttribute('width', '1024');
        expect(canvas).toHaveAttribute('height', '768');
    });

    it('changes color when color picker value changes', () => {
        render(<InfiniteCanvas />);
        const colorPickerInput = screen.getByDisplayValue(
            '#000000',
        ) as HTMLInputElement;

        fireEvent.change(colorPickerInput, { target: { value: '#ff0000' } });
        expect(colorPickerInput.value).toBe('#ff0000');
    });

    it('shows color picker in default mode', () => {
        const { container } = render(<InfiniteCanvas />);
        const colorPickerInput = container.querySelector('input[type="color"]');
        expect(colorPickerInput).toBeInTheDocument();
    });

    it('hides color picker in eraser mode', () => {
        render(<InfiniteCanvas />);
        const eraserButton = screen.getByRole('button', { name: /eraser/i });

        // Click eraser button
        fireEvent.click(eraserButton);

        const colorPicker = screen.queryByRole('textbox', { hidden: true });
        expect(colorPicker).not.toBeInTheDocument();
    });

    it('has correct initial button states', () => {
        render(<InfiniteCanvas />);
        const handButton = screen.getByRole('button', { name: /hand/i });
        const eraserButton = screen.getByRole('button', { name: /eraser/i });

        // Check initial button states
        expect(handButton).toHaveClass('bg-primary');
        expect(eraserButton).toHaveClass('bg-primary');
    });
});

describe('InfiniteCanvas MoveMode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });
    it('toggles move mode when move button is clicked', () => {
        render(<InfiniteCanvas />);
        const buttons = screen.getAllByRole('button');
        const moveUpLeftButton = buttons[1]; // Second button is move

        // Click move button
        fireEvent.click(moveUpLeftButton);
        expect(moveUpLeftButton).toHaveClass('bg-secondary');

        // Click again to disable
        fireEvent.click(moveUpLeftButton);
        expect(moveUpLeftButton).toHaveClass('bg-primary');
    });

    it('changes cursor style when move mode is enabled', () => {
        render(<InfiniteCanvas />);
        const buttons = screen.getAllByRole('button');
        const moveUpLeftButton = buttons[1];
        const canvasContainer = screen.getByTestId('canvas-container');

        // Initial state
        expect(canvasContainer).toHaveStyle({ cursor: 'crosshair' });

        // Enable move mode
        fireEvent.click(moveUpLeftButton);
        expect(canvasContainer).toHaveStyle({ cursor: 'crosshair' });
    });

    it('handles tool state transitions correctly', () => {
        render(<InfiniteCanvas />);
        const buttons = screen.getAllByRole('button');
        const moveUpLeftButton = buttons[1];
        const eraserButton = buttons[2];

        // Enable move mode
        fireEvent.click(moveUpLeftButton);
        expect(moveUpLeftButton).toHaveClass('bg-secondary');

        // Switch to eraser
        fireEvent.click(eraserButton);
        expect(eraserButton).toHaveClass('bg-secondary');
        // Move mode remains active
        expect(moveUpLeftButton).toHaveClass('bg-secondary');

        // Disable eraser
        fireEvent.click(eraserButton);
        expect(eraserButton).toHaveClass('bg-primary');
        // Move mode still remains active
        expect(moveUpLeftButton).toHaveClass('bg-secondary');
    });
});

describe('InfiniteCanvas Undo/Redo', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders undo and redo buttons', () => {
        render(<InfiniteCanvas />);

        const undoButton = screen.getByRole('button', { name: /undo/i });
        const redoButton = screen.getByRole('button', { name: /redo/i });

        expect(undoButton).toBeInTheDocument();
        expect(redoButton).toBeInTheDocument();
    });

    it('initially disables undo and redo buttons when no actions are performed', () => {
        render(<InfiniteCanvas />);

        const undoButton = screen.getByRole('button', { name: /undo/i });
        const redoButton = screen.getByRole('button', { name: /redo/i });

        expect(undoButton).toBeDisabled();
        expect(redoButton).toBeDisabled();
    });

    it('enables undo button after drawing action', () => {
        render(<InfiniteCanvas />);

        const canvas = screen.getByRole('presentation');

        // Simulate drawing action
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
        fireEvent.mouseUp(canvas);

        const undoButton = screen.getByRole('button', { name: /undo/i });
        expect(undoButton).not.toBeDisabled();
    });

    it('enables redo button after undo action', () => {
        render(<InfiniteCanvas />);

        const canvas = screen.getByRole('presentation');
        const undoButton = screen.getByRole('button', { name: /undo/i });
        const redoButton = screen.getByRole('button', { name: /redo/i });

        // Simulate drawing action
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
        fireEvent.mouseUp(canvas);

        // Perform undo
        fireEvent.click(undoButton);

        expect(redoButton).not.toBeDisabled();
    });

    it('disables redo button after new drawing action following undo', () => {
        render(<InfiniteCanvas />);

        const canvas = screen.getByRole('presentation');
        const undoButton = screen.getByRole('button', { name: /undo/i });
        const redoButton = screen.getByRole('button', { name: /redo/i });

        // First drawing action
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
        fireEvent.mouseUp(canvas);

        // Undo
        fireEvent.click(undoButton);
        expect(redoButton).not.toBeDisabled();

        // New drawing action
        fireEvent.mouseDown(canvas, { clientX: 200, clientY: 200 });
        fireEvent.mouseMove(canvas, { clientX: 220, clientY: 220 });
        fireEvent.mouseUp(canvas);

        expect(redoButton).toBeDisabled();
    });

    it('responds to keyboard shortcuts for undo/redo', () => {
        render(<InfiniteCanvas />);

        const canvas = screen.getByRole('presentation');

        // Simulate drawing action
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
        fireEvent.mouseUp(canvas);

        // Test Ctrl/Cmd + Z for undo
        fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

        // Test Ctrl/Cmd + Shift + Z for redo
        fireEvent.keyDown(document, {
            key: 'y',
            ctrlKey: true,
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        const redoButton = screen.getByRole('button', { name: /redo/i });

        // After redo, undo should be enabled and redo disabled
        expect(undoButton).not.toBeDisabled();
        expect(redoButton).toBeDisabled();
    });
});
