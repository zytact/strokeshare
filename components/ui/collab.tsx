'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Users, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRoomStore } from '@/store/useRoomStore';

export function Collab() {
    const [name, setName] = useState<string>('');
    const { setRoomId } = useRoomStore();
    const [roomLink, setRoomLink] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    useEffect(() => {
        const newRoomId = uuidv4().substring(0, 8);
        setRoomId(newRoomId);

        // Create the full room link
        const baseUrl = window.location.origin;
        setRoomLink(`${baseUrl}/room/${newRoomId}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isOpen && roomLink) {
            window.history.pushState(
                { roomId: roomLink.split('/').pop() },
                '',
                roomLink,
            );
        }
    }, [isOpen, roomLink]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className="flex w-9 items-center gap-1"
                >
                    <Users className="size-2" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex flex-col gap-4">
                    <h4 className="leading-none font-medium">Share Link</h4>
                    <div className="flex flex-col space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                            Name
                        </label>
                        <Input
                            id="name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <label
                            htmlFor="roomLink"
                            className="text-sm font-medium"
                        >
                            Room Link
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="roomLink"
                                value={roomLink}
                                readOnly
                                className="flex-1"
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={copyToClipboard}
                                className="size-8"
                            >
                                {copied ? (
                                    <Check className="size-4" />
                                ) : (
                                    <Copy className="size-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Share this link to collaborate in real-time
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
