'use client';

import React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Konva from 'konva';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
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
    const { toast } = useToast();
    const { resolvedTheme } = useTheme();
    const { exportWithBackground, setExportWithBackground } =
        useDownloadPopStore();

    const { lines, textElements, rectangles } = useCanvasStore();

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

    const handleSVG = () => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg width="${stageWidth}" height="${stageHeight}" xmlns="http://www.w3.org/2000/svg">`;

        if (exportWithBackground) {
            const backgroundColor =
                resolvedTheme === 'dark' ? '#000000' : '#ffffff';
            svg += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;
        }

        svg += `<g transform="translate(${stagePos.x},${stagePos.y}) scale(${stageScale})">`;

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
                    <Download className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex flex-col gap-4">
                    <h4 className="font-medium leading-none">Download</h4>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={handleSVG}
                        >
                            <Download className="h-4 w-4" />
                            <span>SVG</span>
                        </Button>
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={handlePNG}
                        >
                            <Download className="h-4 w-4" />
                            <span>PNG</span>
                        </Button>
                        <Button
                            variant="default"
                            className="flex items-center gap-2"
                            onClick={() => {
                                copyImg();
                                toast({
                                    title: 'Copied to clipboard',
                                });
                            }}
                        >
                            <Copy className="h-4 w-4" />
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
