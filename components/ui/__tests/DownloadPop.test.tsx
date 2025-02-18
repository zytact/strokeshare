import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, vi, expect, afterEach } from 'vitest';
import { DownloadPop } from '@/components/ui/DownloadPop';
import '@testing-library/jest-dom/vitest';

const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

describe('DownloadPop', () => {
    const mockHandleSVG = vi.fn();
    const mockHandlePNG = vi.fn();
    const mockCopyImg = vi.fn();
    const mockSetExportWithBackground = vi.fn();

    const defaultProps = {
        handleSVG: mockHandleSVG,
        handlePNG: mockHandlePNG,
        copyImg: mockCopyImg,
        exportWithBackground: false,
        setExportWithBackground: mockSetExportWithBackground,
    };

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders download button', () => {
        render(<DownloadPop {...defaultProps} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('opens popover when download button is clicked', () => {
        render(<DownloadPop {...defaultProps} />);

        const downloadButton = screen.getByRole('button');
        fireEvent.click(downloadButton);

        expect(screen.getByText('Download')).toBeInTheDocument();
        expect(screen.getByText('SVG')).toBeInTheDocument();
        expect(screen.getByText('PNG')).toBeInTheDocument();
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.getByText('Background')).toBeInTheDocument();
    });

    it('calls handleSVG when SVG button is clicked', () => {
        render(<DownloadPop {...defaultProps} />);

        const downloadButton = screen.getByRole('button');
        fireEvent.click(downloadButton);

        const svgButton = screen.getByText('SVG');
        fireEvent.click(svgButton);

        expect(mockHandleSVG).toHaveBeenCalledTimes(1);
    });

    it('calls handlePNG when PNG button is clicked', () => {
        render(<DownloadPop {...defaultProps} />);

        const downloadButton = screen.getByRole('button');
        fireEvent.click(downloadButton);

        const pngButton = screen.getByText('PNG');
        fireEvent.click(pngButton);

        expect(mockHandlePNG).toHaveBeenCalledTimes(1);
    });

    it('calls copyImg when Copy button is clicked', () => {
        render(<DownloadPop {...defaultProps} />);

        const downloadButton = screen.getByRole('button');
        fireEvent.click(downloadButton);

        const copyButton = screen.getByText('Copy');
        fireEvent.click(copyButton);

        expect(mockCopyImg).toHaveBeenCalledTimes(1);
    });

    it('toggles background switch when clicked', () => {
        render(<DownloadPop {...defaultProps} />);

        const downloadButton = screen.getByRole('button');
        fireEvent.click(downloadButton);

        const backgroundSwitch = screen.getByRole('switch');
        fireEvent.click(backgroundSwitch);

        expect(mockSetExportWithBackground).toHaveBeenCalledTimes(1);
        expect(mockSetExportWithBackground).toHaveBeenCalledWith(true);
    });

    it('applies custom className when provided', () => {
        const customClassName = 'custom-class';
        render(<DownloadPop {...defaultProps} className={customClassName} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass(customClassName);
    });

    it('calls copyImg and shows toast when Copy button is clicked', () => {
        // Get the mocked toast function

        render(<DownloadPop {...defaultProps} />);

        const downloadButton = screen.getByRole('button');
        fireEvent.click(downloadButton);

        const copyButton = screen.getByText('Copy');
        fireEvent.click(copyButton);

        // Verify that copyImg was called
        expect(mockCopyImg).toHaveBeenCalledTimes(1);

        // Verify that toast was called with correct parameters
        expect(mockToast).toHaveBeenCalledTimes(1);
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Copied to clipboard',
        });
    });
});
