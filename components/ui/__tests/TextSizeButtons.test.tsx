import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, vi, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { TextSizeButtons } from '@/components/ui/TextSizeButtons';

describe('TextSizeButtons', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });
    const mockProps = {
        textMode: false,
        moveMode: false,
        selectedShape: null,
        selectedTextId: null,
        newTextSize: 30,
        textElements: [],
        selectedId: null,
        setTextElements: vi.fn(),
        addToHistory: vi.fn(),
        setNewTextSize: vi.fn(),
    };

    it('renders nothing when no relevant mode is active', () => {
        render(<TextSizeButtons {...mockProps} />);
        expect(screen.queryByText('S')).not.toBeInTheDocument();
        expect(screen.queryByText('M')).not.toBeInTheDocument();
        expect(screen.queryByText('L')).not.toBeInTheDocument();
    });

    it('renders text size buttons in text mode', () => {
        render(<TextSizeButtons {...mockProps} textMode={true} />);
        expect(screen.getByText('S')).toBeInTheDocument();
        expect(screen.getByText('M')).toBeInTheDocument();
        expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('renders text size buttons in move mode with text selected', () => {
        render(
            <TextSizeButtons
                {...mockProps}
                moveMode={true}
                selectedShape="text"
            />,
        );
        expect(screen.getByText('S')).toBeInTheDocument();
        expect(screen.getByText('M')).toBeInTheDocument();
        expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('highlights current size button in text mode', () => {
        render(
            <TextSizeButtons {...mockProps} textMode={true} newTextSize={30} />,
        );
        const mediumButton = screen.getByText('M');
        expect(mediumButton.closest('button')).toHaveClass('bg-secondary');
    });

    it('handles text size change in text mode without selection', () => {
        render(<TextSizeButtons {...mockProps} textMode={true} />);
        const smallButton = screen.getByText('S');

        fireEvent.click(smallButton);

        expect(mockProps.setNewTextSize).toHaveBeenCalledWith(20);
    });

    it('handles text size change for selected text', () => {
        const textElements = [
            {
                id: 'text-1',
                fontSize: 30,
                text: 'Test',
                x: 0,
                y: 0,
                fill: '#000',
            },
        ];
        render(
            <TextSizeButtons
                {...mockProps}
                textMode={true}
                selectedTextId="text-1"
                textElements={textElements}
            />,
        );

        fireEvent.click(screen.getByText('S'));

        expect(mockProps.setTextElements).toHaveBeenCalledWith([
            { ...textElements[0], fontSize: 20 },
        ]);
    });

    it('handles text size change in move mode', () => {
        const textElements = [
            {
                id: 'text-1',
                fontSize: 30,
                text: 'Test',
                x: 0,
                y: 0,
                fill: '#000',
            },
        ];
        render(
            <TextSizeButtons
                {...mockProps}
                moveMode={true}
                selectedShape="text"
                selectedId="text-1"
                textElements={textElements}
            />,
        );

        fireEvent.click(screen.getByText('L'));

        expect(mockProps.setTextElements).toHaveBeenCalledWith([
            { ...textElements[0], fontSize: 40 },
        ]);
        expect(mockProps.addToHistory).toHaveBeenCalled();
    });

    it('disables buttons in move mode without shape selected', () => {
        render(<TextSizeButtons {...mockProps} moveMode={true} />);

        const buttons = screen.queryAllByRole('button');
        buttons.forEach((button) => {
            expect(button).toBeDisabled();
        });
    });

    it('correctly changes text size from medium to large', () => {
        const textElements = [
            {
                id: 'text-1',
                fontSize: 30,
                text: 'Test',
                x: 0,
                y: 0,
                fill: '#000',
            },
        ];
        render(
            <TextSizeButtons
                {...mockProps}
                moveMode={true}
                selectedShape="text"
                selectedId="text-1"
                textElements={textElements}
            />,
        );

        const largeButton = screen.getByText('L');
        fireEvent.click(largeButton);

        expect(mockProps.setTextElements).toHaveBeenCalledWith([
            { ...textElements[0], fontSize: 40 },
        ]);
    });

    it('persists text size selection between mode switches', () => {
        const { rerender } = render(
            <TextSizeButtons {...mockProps} textMode={true} newTextSize={20} />,
        );

        expect(screen.getByText('S').closest('button')).toHaveClass(
            'bg-secondary',
        );

        rerender(
            <TextSizeButtons
                {...mockProps}
                textMode={false}
                moveMode={true}
                selectedShape="text"
                selectedId="text-1"
                textElements={[
                    {
                        id: 'text-1',
                        fontSize: 20,
                        text: 'Test',
                        x: 0,
                        y: 0,
                        fill: '#000',
                    },
                ]}
            />,
        );

        expect(screen.getByText('S').closest('button')).toHaveClass(
            'bg-secondary',
        );
    });
});
