import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import InfiniteCanvas from '../InfiniteCanvas';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

describe('InfiniteCanvas', () => {
    afterEach(() => {
        cleanup();
    });
    it('renders the canvas element', () => {
        render(<InfiniteCanvas />);
        const canvasElement = screen.getByTestId('infinite-canvas');
        expect(canvasElement).toBeInTheDocument();
    });

    it('responds to mouse interactions for panning', () => {
        render(<InfiniteCanvas />);
        const canvasElement = screen.getByTestId('infinite-canvas');
        const canvasContent = canvasElement.firstElementChild as HTMLElement;

        // Initial Postion at 0px, 0px
        expect(canvasContent).toHaveStyle({
            transform: 'translate(0px, 0px)',
        });

        fireEvent.mouseDown(canvasElement, { clientX: 100, clientY: 100 });

        fireEvent.mouseMove(canvasElement, { clientX: 200, clientY: 200 });

        // Moved to 100px, 100px
        expect(canvasContent).toHaveStyle({
            transform: 'translate(100px, 100px)',
        });

        fireEvent.mouseUp(canvasElement);

        // Stays the same
        expect(canvasContent).toHaveStyle({
            transform: 'translate(100px, 100px)',
        });

        expect(canvasElement).toBeInTheDocument();
    });
});

