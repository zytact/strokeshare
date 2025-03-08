import * as React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircleHelp, Github } from 'lucide-react';

export function Help() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    aria-label="Show help and keyboard shortcuts"
                    className="flex w-9 items-center gap-2"
                >
                    <CircleHelp className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 sm:w-72">
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <Link
                            href="https://github.com/zytact/strokeshare"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1"
                        >
                            <Github className="size-4" />
                        </Link>
                        Made with ❤️ by{' '}
                        <Link
                            href="https://zytact.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold"
                        >
                            Arnab
                        </Link>
                    </div>
                    <div className="hidden sm:block">
                        <span className="font-bold">keyboard shortcuts</span>
                        <ul className="list-none pl-5">
                            <li>
                                <span>
                                    <Badge className="mr-2">ctrl/cmd</Badge>
                                    <Badge className="mr-2">v</Badge> paste
                                    image
                                </span>
                            </li>
                            <li>
                                <span>
                                    <Badge className="mr-2">ctrl/cmd</Badge>
                                    <Badge className="mr-2">z</Badge> undo
                                </span>
                            </li>
                            <li>
                                <span>
                                    <Badge className="mr-2">ctrl/cmd</Badge>
                                    <Badge className="mr-2">y</Badge> redo
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
