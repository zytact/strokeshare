'use client';

import React, { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Konva from 'konva';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useDownloadPopStore } from '@/store/useDownloadPopStore';
import { useCanvasStore } from '@/store/useCanvasStore';

interface DownloadPopProps {
    stageRef: React.RefObject<Konva.Stage | null>;
    stagePos: Point;
    stageScale: number;
    strokeWidth: number;
    className?: string;
}

export function DownloadPop({
    stageRef,
    stagePos,
    stageScale,
    strokeWidth,
    className,
}: DownloadPopProps) {
    const { resolvedTheme } = useTheme();
    const { exportWithBackground, setExportWithBackground } =
        useDownloadPopStore();

    const { lines, textElements, rectangles, circles, images } =
        useCanvasStore();

    const [wasCopied, setWasCopied] = useState(false);
    const [isFading, setIsFading] = useState(false);

    const handlePNG = () => {
        if (!stageRef.current) return;

        // If we want to export with background, temporarily add a background rect
        if (exportWithBackground) {
            const backgroundColor =
                resolvedTheme === 'dark' ? '#000000' : '#ffffff';
            const background = new Konva.Rect({
                x: -stagePos.x / stageScale,
                y: -stagePos.y / stageScale,
                width: stageRef.current.width() / stageScale,
                height: stageRef.current.height() / stageScale,
                fill: backgroundColor,
            });

            // Add background as the first node
            const layer = stageRef.current.findOne('Layer') as Konva.Layer;
            if (layer) {
                layer.add(background);
                background.moveToBottom();
            }
            background.moveToBottom();

            // Get the data URL
            const dataURL = stageRef.current.toDataURL({
                pixelRatio: 2,
            });

            // Remove the temporary background
            background.destroy();

            // Create download link
            const link = document.createElement('a');
            link.download = 'strokeshare-export.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // Export without background
            const dataURL = stageRef.current.toDataURL({
                pixelRatio: 2,
            });

            const link = document.createElement('a');
            link.download = 'strokeshare-export.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleJSON = async () => {
        // Create a structured JSON object with all canvas elements
        const canvasData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            elements: {
                lines,
                textElements,
                rectangles,
                circles,
                images,
            },
        };

        // Convert to JSON string with nice formatting
        const jsonString = JSON.stringify(canvasData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        try {
            // Use the File System Access API to show a file picker
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: 'Untitled.str',
                types: [
                    {
                        description: 'StrokeShare File',
                        accept: {
                            'application/json': ['.str'],
                        },
                    },
                ],
            });

            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            // User probably canceled the save dialog
            console.log('Save operation was canceled or failed:', err);

            // Fallback method if the File System Access API fails
            if (
                err &&
                typeof err === 'object' &&
                'name' in err &&
                err.name !== 'AbortError'
            ) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'Untitled.str';
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }
    };

    const handleSVG = () => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg width="${stageWidth}" height="${stageHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;

        // Add defs section for images
        svg += '<defs>';
        images.forEach((image, index) => {
            svg += `<image id="img${index}" href="${image.src}" />`;
        });
        svg += '</defs>';

        if (exportWithBackground) {
            const backgroundColor =
                resolvedTheme === 'dark' ? '#000000' : '#ffffff';
            svg += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;
        }

        svg += `<g transform="translate(${stagePos.x},${stagePos.y}) scale(${stageScale})">`;

        // Add images first (to be in the background)
        images.forEach((image, index) => {
            svg += `<use
                xlink:href="#img${index}"
                x="${image.x}"
                y="${image.y}"
                width="${image.width}"
                height="${image.height}"
            />`;
        });

        // Add rectangles first (to be in the background)
        rectangles.forEach((rect) => {
            svg += `<rect
                x="${rect.x}"
                y="${rect.y}"
                width="${rect.width}"
                height="${rect.height}"
                stroke="${rect.color}"
                stroke-width="${rect.strokeWidth || strokeWidth}"
                ${rect.fill ? `fill="${rect.fill}"` : 'fill="none"'}
                ${rect.cornerRadius ? `rx="${rect.cornerRadius}" ry="${rect.cornerRadius}"` : ''}
                ${rect.isDashed ? 'stroke-dasharray="10 10"' : ''}
            />`;
        });

        // Add circles
        circles.forEach((circle) => {
            svg += `<circle
                cx="${circle.x}"
                cy="${circle.y}"
                r="${circle.radius}"
                stroke="${circle.color}"
                stroke-width="${circle.strokeWidth || strokeWidth}"
                ${circle.fill ? `fill="${circle.fill}"` : 'fill="none"'}
                ${circle.isDashed ? 'stroke-dasharray="10 10"' : ''}
            />`;
        });

        // Add lines
        lines.forEach((line) => {
            const points = line.points;
            if (points.length >= 4) {
                let pathData = `M ${points[0]},${points[1]}`;
                for (let i = 2; i < points.length; i += 2) {
                    pathData += ` L ${points[i]},${points[i + 1]}`;
                }
                svg += `<path d="${pathData}" stroke="${line.color}" stroke-width="${line.strokeWidth || strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
            }
        });

        // Add text elements
        textElements.forEach((text) => {
            const textColor = resolvedTheme === 'dark' ? '#ffffff' : '#000000';
            const escapedContent = text.text
                ? text.text
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&apos;')
                : '';

            svg += `<text x="${text.x || 0}" y="${text.y || 0}"
                fill="${textColor}"
                font-family="system-ui, sans-serif"
                font-size="${text.fontSize || 16}px"
                text-anchor="start"
                dominant-baseline="hanging">${escapedContent}</text>`;
        });

        svg += '</g></svg>';

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'strokeshare-export.svg';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyImg = async () => {
        if (!stageRef.current) return;

        let background;
        // If we want to export with background, temporarily add a background rect
        if (exportWithBackground) {
            const backgroundColor =
                resolvedTheme === 'dark' ? '#000000' : '#ffffff';
            background = new Konva.Rect({
                x: -stagePos.x / stageScale,
                y: -stagePos.y / stageScale,
                width: stageRef.current.width() / stageScale,
                height: stageRef.current.height() / stageScale,
                fill: backgroundColor,
            });

            // Add background as the first node
            const layer = stageRef.current.findOne('Layer') as Konva.Layer;
            if (layer) {
                layer.add(background);
                background.moveToBottom();
            }
            background.moveToBottom();
        }
        const dataURL = stageRef.current.toDataURL({
            pixelRatio: 2,
        });

        // Remove the temporary background
        if (background) {
            background.destroy();
        }

        const blob = await fetch(dataURL).then((res) => res.blob());

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);
        } catch (err) {
            console.log('Copying failed: ', err);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className={cn('flex items-center gap-2', className)}
                >
                    <Download className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex flex-col gap-4">
                    <h4 className="leading-none font-medium">Download</h4>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={handleSVG}
                        >
                            <Download className="size-4" />
                            <span>SVG</span>
                        </Button>
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={handlePNG}
                        >
                            <Download className="size-4" />
                            <span>PNG</span>
                        </Button>
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={handleJSON}
                        >
                            <Download className="size-4" />
                            <span>Save to Disk</span>
                        </Button>
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={() => {
                                copyImg();
                                setWasCopied(true);
                                setIsFading(true);
                                setTimeout(() => {
                                    setIsFading(false);
                                }, 1800);
                                setTimeout(() => {
                                    setWasCopied(false);
                                }, 2000);
                            }}
                        >
                            {wasCopied ? (
                                <Check
                                    className={cn(
                                        'size-4 transition-opacity duration-700',
                                        isFading ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                            ) : (
                                <Copy
                                    className={cn(
                                        'size-4 transition-opacity duration-300',
                                        wasCopied ? 'opacity-0' : 'opacity-100',
                                    )}
                                />
                            )}
                            <span>Copy</span>
                        </Button>
                        <div className="flex items-center gap-4">
                            <Switch
                                id="background-toggle"
                                checked={exportWithBackground}
                                onCheckedChange={setExportWithBackground}
                            />
                            <Label
                                htmlFor="background-toggle"
                                className="font-love-ya"
                            >
                                Background
                            </Label>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
