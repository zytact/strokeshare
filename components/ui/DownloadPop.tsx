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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DownloadPopProps {
    handleSVG: () => void;
    handlePNG: () => void;
    copyImg: () => void;
    exportWithBackground: boolean;
    setExportWithBackground: (value: boolean) => void;
    className?: string;
}

export function DownloadPop({
    handleSVG,
    handlePNG,
    copyImg,
    exportWithBackground,
    setExportWithBackground,
    className,
}: DownloadPopProps) {
    const { toast } = useToast();

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
                            <Label htmlFor="background-toggle">
                                Background
                            </Label>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
