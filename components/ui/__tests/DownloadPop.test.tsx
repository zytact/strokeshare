import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, vi, expect, afterEach } from 'vitest';
import { DownloadPop } from '@/components/ui/DownloadPop';
import '@testing-library/jest-dom/vitest';
import Konva from 'konva';

describe('DownloadPop', () => {
    const mockStage = new Konva.Stage({
        container: document.createElement('div'),
        width: 800,
        height: 600,
    });

    const defaultProps = {
        stageRef: { current: mockStage },
        stagePos: { x: 0, y: 0 },
        stageScale: 1,
        strokeWidth: 1,
    };

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders download button', () => {
        render(<DownloadPop {...defaultProps} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('opens popover with export options when clicked', () => {
        render(<DownloadPop {...defaultProps} />);

        const downloadButton = screen.getByRole('button');
        fireEvent.click(downloadButton);

        expect(screen.getByText('Download')).toBeInTheDocument();
        expect(screen.getByText('SVG')).toBeInTheDocument();
        expect(screen.getByText('PNG')).toBeInTheDocument();
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Background')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
        const customClassName = 'custom-class';
        render(<DownloadPop {...defaultProps} className={customClassName} />);
        expect(screen.getByRole('button')).toHaveClass(customClassName);
    });
});
