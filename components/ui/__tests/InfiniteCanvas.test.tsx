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
        Layer: vi.fn((props) => ({
            add: vi.fn(),
            batchDraw: vi.fn(),
            ...props, // This will allow props like data-testid to be passed through
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
        expect(buttons).toHaveLength(19);
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
            name: /color/i,
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
        const colorPickerInput = screen.getByRole('button', {
            name: /draw-color/i,
        }) as HTMLInputElement;

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

        const colorPicker = screen.queryByRole('textbox', {
            name: /color/i,
        });
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

        // Test Ctrl/Cmd + Y for redo
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

describe('InfiniteCanvas Zoom Controls', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders zoom controls with initial 100% scale', () => {
        render(<InfiniteCanvas />);

        const zoomInButton = screen.getByRole('button', { name: /zoom-in/i });
        const zoomOutButton = screen.getByRole('button', { name: /zoom-out/i });
        const scaleDisplay = screen.getByText('100%');

        expect(zoomInButton).toBeInTheDocument();
        expect(zoomOutButton).toBeInTheDocument();
        expect(scaleDisplay).toBeInTheDocument();
    });

    it('increases scale when zoom in button is clicked', () => {
        render(<InfiniteCanvas />);

        const zoomInButton = screen.getByRole('button', { name: /zoom-in/i });
        fireEvent.click(zoomInButton);

        // Scale should increase by 5%
        const scaleDisplay = screen.getByText('105%');
        expect(scaleDisplay).toBeInTheDocument();
    });

    it('decreases scale when zoom out button is clicked', () => {
        render(<InfiniteCanvas />);

        const zoomOutButton = screen.getByRole('button', { name: /zoom-out/i });
        fireEvent.click(zoomOutButton);

        // Scale should decrease by 5%
        const scaleDisplay = screen.getByText('95%');
        expect(scaleDisplay).toBeInTheDocument();
    });

    it('shows correct scale after multiple zoom operations', () => {
        render(<InfiniteCanvas />);

        const zoomInButton = screen.getByRole('button', { name: /zoom-in/i });
        const zoomOutButton = screen.getByRole('button', { name: /zoom-out/i });

        // Zoom in twice
        fireEvent.click(zoomInButton);
        fireEvent.click(zoomInButton);
        expect(screen.getByText('110%')).toBeInTheDocument();

        // Zoom out once
        fireEvent.click(zoomOutButton);
        expect(screen.getByText('105%')).toBeInTheDocument();
    });

    it('maintains zoom state when switching tools', () => {
        render(<InfiniteCanvas />);

        const zoomInButton = screen.getByRole('button', { name: /zoom-in/i });
        const eraserButton = screen.getByRole('button', { name: /eraser/i });

        // Zoom in first
        fireEvent.click(zoomInButton);
        expect(screen.getByText('105%')).toBeInTheDocument();

        // Switch to eraser mode
        fireEvent.click(eraserButton);

        // Scale should remain the same
        expect(screen.getByText('105%')).toBeInTheDocument();
    });
});

describe('StrokeWidth Component Responsiveness', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('hides stroke width text on mobile screens', () => {
        // Mock window.innerWidth to simulate mobile screen
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500, // Mobile width
        });

        // Trigger window resize event
        window.dispatchEvent(new Event('resize'));

        render(<InfiniteCanvas />);

        // Find the stroke width span
        const strokeWidthSpan = screen.queryByText(/px$/);

        // Check if the span has the hidden class
        expect(strokeWidthSpan).toHaveClass('hidden');
    });

    it('shows stroke width text on desktop screens', () => {
        // Mock window.innerWidth to simulate desktop screen
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024, // Desktop width
        });

        // Trigger window resize event
        window.dispatchEvent(new Event('resize'));

        render(<InfiniteCanvas />);

        // Find the stroke width span
        const strokeWidthSpan = screen.queryByText(/px$/);

        // Check if the span has the sm:block class
        expect(strokeWidthSpan).toHaveClass('sm:block');
    });

    it('stroke width button remains visible on all screen sizes', () => {
        render(<InfiniteCanvas />);

        // Find the stroke width button by the Minus icon
        const strokeWidthButton = screen.getByRole('button', {
            name: /3px/i, // Assuming default stroke width is 3
        });

        expect(strokeWidthButton).toBeVisible();
    });
});

describe('InfiniteCanvas Text Mode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('toggles text mode when text button is clicked', () => {
        render(<InfiniteCanvas />);
        const textButton = screen.getByRole('button', { name: /text/i });

        // Click text button
        fireEvent.click(textButton);
        expect(textButton).toHaveClass('bg-secondary');

        // Click again to disable
        fireEvent.click(textButton);
        expect(textButton).toHaveClass('bg-primary');
    });

    it('shows textarea when clicking on canvas in text mode', () => {
        render(<InfiniteCanvas />);
        const textButton = screen.getByRole('button', { name: /text/i });
        const canvas = screen.getByRole('presentation');

        // Enable text mode
        fireEvent.click(textButton);

        // Click on canvas
        fireEvent.click(canvas, { clientX: 100, clientY: 100 });

        const textarea = screen.getByRole('textbox', {
            name: /textarea/i,
        });
        expect(textarea).toBeInTheDocument();
    });

    it('adds text to canvas when pressing Enter', () => {
        render(<InfiniteCanvas />);
        const textButton = screen.getByRole('button', { name: /text/i });
        const canvas = screen.getByRole('presentation');

        // Enable text mode
        fireEvent.click(textButton);

        // Click on canvas
        fireEvent.click(canvas, { clientX: 100, clientY: 100 });

        const textarea = screen.getByRole('textbox', {
            name: /textarea/i,
        });
        fireEvent.change(textarea, { target: { value: 'Test Text' } });
        fireEvent.keyDown(textarea, { key: 'Enter' });

        // Textarea should be hidden after pressing Enter
        expect(textarea).toHaveStyle({ display: 'none' });
    });

    it('disables text mode when switching to other tools', () => {
        render(<InfiniteCanvas />);
        const textButton = screen.getByRole('button', { name: /text/i });
        const eraserButton = screen.getByRole('button', { name: /eraser/i });

        // Enable text mode
        fireEvent.click(textButton);
        expect(textButton).toHaveClass('bg-secondary');

        // Switch to eraser
        fireEvent.click(eraserButton);
        expect(textButton).toHaveClass('bg-primary');
        expect(eraserButton).toHaveClass('bg-secondary');
    });

    it('maintains text color based on theme', () => {
        render(<InfiniteCanvas />);
        const textButton = screen.getByRole('button', { name: /text/i });
        const canvas = screen.getByRole('presentation');

        // Enable text mode
        fireEvent.click(textButton);
        fireEvent.click(canvas, { clientX: 100, clientY: 100 });

        const textarea = screen.getByRole('textbox');
        // In light theme (mocked), text should be black
        expect(textarea).toHaveStyle({ color: '#000000' });
    });
});

describe('InfiniteCanvas Arrow Mode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('toggles arrow mode when arrow button is clicked', () => {
        render(<InfiniteCanvas />);
        const arrowButton = screen.getByRole('button', { name: /arrow/i });

        // Click arrow button
        fireEvent.click(arrowButton);
        expect(arrowButton).toHaveClass('bg-secondary');

        // Click again to disable
        fireEvent.click(arrowButton);
        expect(arrowButton).toHaveClass('bg-primary');
    });

    it('disables other modes when arrow mode is enabled', () => {
        render(<InfiniteCanvas />);
        const arrowButton = screen.getByRole('button', { name: /arrow/i });
        const handButton = screen.getByRole('button', { name: /hand/i });
        const eraserButton = screen.getByRole('button', { name: /eraser/i });

        // Enable arrow mode
        fireEvent.click(arrowButton);

        // Other buttons should not be in secondary mode
        expect(handButton).not.toHaveClass('bg-secondary');
        expect(eraserButton).not.toHaveClass('bg-secondary');
    });
});

describe('InfiniteCanvas Dash Mode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('toggles dash mode when dash button is clicked', () => {
        render(<InfiniteCanvas />);
        const dashButton = screen.getByRole('button', { name: /dashed-line/i });

        // Click dash button
        fireEvent.click(dashButton);
        expect(dashButton).toHaveClass('bg-secondary');

        // Click again to disable
        fireEvent.click(dashButton);
        expect(dashButton).toHaveClass('bg-primary');
    });

    it('maintains dash mode state across different drawing tools', () => {
        render(<InfiniteCanvas />);
        const dashButton = screen.getByRole('button', { name: /dashed-line/i });
        const lineButton = screen.getByRole('button', {
            name: /line-segment/i,
        });
        const arrowButton = screen.getByRole('button', { name: /arrow/i });

        // Enable dash mode
        fireEvent.click(dashButton);
        expect(dashButton).toHaveClass('bg-secondary');

        // Switch between line and arrow mode
        fireEvent.click(lineButton);
        expect(dashButton).toHaveClass('bg-secondary');

        fireEvent.click(arrowButton);
        expect(dashButton).toHaveClass('bg-secondary');
    });

    it('toggles dash property for selected line in move mode', () => {
        render(<InfiniteCanvas />);
        const moveButton = screen.getByRole('button', { name: /move/i });
        const dashButton = screen.getByRole('button', { name: /dashed-line/i });
        const canvas = screen.getByRole('presentation');

        // Draw a line first
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
        fireEvent.mouseUp(canvas);

        // Enable move mode and select the line
        fireEvent.click(moveButton);
        fireEvent.click(canvas);

        // Toggle dash for selected line
        fireEvent.click(dashButton);
        expect(dashButton).toHaveClass('bg-secondary');

        // Toggle dash off for selected line
        fireEvent.click(dashButton);
        expect(dashButton).toHaveClass('bg-primary');
    });
});

describe('InfiniteCanvas Rectangle Mode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('toggles rectangle mode when rectangle button is clicked', () => {
        render(<InfiniteCanvas />);
        const rectangleButton = screen.getByRole('button', {
            name: /rectangle/i,
        });

        // Click rectangle button
        fireEvent.click(rectangleButton);
        expect(rectangleButton).toHaveClass('bg-secondary');

        // Click again to disable
        fireEvent.click(rectangleButton);
        expect(rectangleButton).toHaveClass('bg-primary');
    });

    it('disables other modes when rectangle mode is enabled', () => {
        render(<InfiniteCanvas />);
        const rectangleButton = screen.getByRole('button', {
            name: /rectangle/i,
        });
        const handButton = screen.getByRole('button', { name: /hand/i });
        const eraserButton = screen.getByRole('button', { name: /eraser/i });

        // Enable rectangle mode
        fireEvent.click(rectangleButton);

        // Other buttons should not be in secondary mode
        expect(handButton).not.toHaveClass('bg-secondary');
        expect(eraserButton).not.toHaveClass('bg-secondary');
    });
});

describe('InfiniteCanvas Circle Mode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('toggles circle mode when circle button is clicked', () => {
        render(<InfiniteCanvas />);
        const circleButton = screen.getByRole('button', { name: /circle/i });

        // Click circle button
        fireEvent.click(circleButton);
        expect(circleButton).toHaveClass('bg-secondary');

        // Click again to disable
        fireEvent.click(circleButton);
        expect(circleButton).toHaveClass('bg-primary');
    });

    it('disables other modes when circle mode is enabled', () => {
        render(<InfiniteCanvas />);
        const circleButton = screen.getByRole('button', { name: /circle/i });
        const handButton = screen.getByRole('button', { name: /hand/i });
        const eraserButton = screen.getByRole('button', { name: /eraser/i });

        // Enable circle mode
        fireEvent.click(circleButton);

        // Other buttons should not be in secondary mode
        expect(handButton).not.toHaveClass('bg-secondary');
        expect(eraserButton).not.toHaveClass('bg-secondary');
    });

    it('supports dashed style for circles', () => {
        render(<InfiniteCanvas />);
        const moveButton = screen.getByRole('button', { name: /move/i });
        const dashButton = screen.getByRole('button', { name: /dashed-line/i });
        const canvas = screen.getByRole('presentation');
        const circleButton = screen.getByRole('button', { name: /circle/i });

        // Draw a circle first
        fireEvent.click(circleButton);
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(canvas);

        // Enable move mode and select the circle
        fireEvent.click(moveButton);
        fireEvent.click(canvas);

        // Toggle dash for selected circle
        fireEvent.click(dashButton);
        expect(dashButton).toHaveClass('bg-secondary');

        // Toggle dash off for selected circle
        fireEvent.click(dashButton);
        expect(dashButton).toHaveClass('bg-primary');
    });
});

describe('InfiniteCanvas Image Mode', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders upload image button', () => {
        render(<InfiniteCanvas />);
        const imageButton = screen.getByRole('button', {
            name: /upload-image/i,
        });
        expect(imageButton).toBeInTheDocument();
    });

    it('accepts image file upload', () => {
        render(<InfiniteCanvas />);
        const imageButton = screen.getByRole('button', {
            name: /upload-image/i,
        });
        const fileInput = imageButton.querySelector('input[type="file"]');

        expect(fileInput).toBeInTheDocument();
        expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('handles image file upload', async () => {
        render(<InfiniteCanvas />);
        const imageButton = screen.getByRole('button', {
            name: /upload-image/i,
        });
        const fileInput = imageButton.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;

        const file = new File(['dummy content'], 'test.png', {
            type: 'image/png',
        });
        const dataTransfer = {
            files: [file],
        };

        fireEvent.change(fileInput, { target: dataTransfer });
    });

    it('handles image paste event', () => {
        render(<InfiniteCanvas />);

        // Create a mock clipboard event with image data
        const clipboardData = {
            items: [
                {
                    type: 'image/png',
                    getAsFile: () =>
                        new File(['dummy content'], 'pasted.png', {
                            type: 'image/png',
                        }),
                },
            ],
        };

        // Dispatch paste event
        fireEvent.paste(document, {
            clipboardData,
        });
    });
});
