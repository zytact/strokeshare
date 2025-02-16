'use client';


import { useRef, useState } from 'react';

export default function InfiniteCanvas() {
    const [isPanning, setIsPanning] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPanning(true);
        setStartPan({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPosition({
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y,
            });


        setIsPanning(false);
    };

    return (
        <div
            ref={containerRef}
            className="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
            data-testid="infinite-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                className="relative h-[4000px] w-[4000px]"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    willChange: 'transform',
                }}
            >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                    <h2 className="text-xl">Infinite Canvas</h2>
                    <p>Click and drag to pan around</p>
                </div>
            </div>
        </div>
    );
}
