import { useState, useRef, useCallback, useEffect } from "react";
import { GripVertical } from "lucide-react";

interface ComparisonProps {
    beforeContent: React.ReactNode;
    afterContent: React.ReactNode;
    beforeLabel?: string;
    afterLabel?: string;
}

export function FeatureComparison({
    beforeContent,
    afterContent,
    beforeLabel = "Before",
    afterLabel = "After",
}: ComparisonProps) {
    const [inset, setInset] = useState<number>(50);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setInset(percentage);
    }, []);

    // Global mouse/touch handlers so dragging works even outside the component
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            updatePosition(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                updatePosition(e.touches[0].clientX);
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleEnd);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging, updatePosition]);

    const handleStart = (clientX: number) => {
        setIsDragging(true);
        updatePosition(clientX);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-2xl select-none border shadow-lg"
            style={{ minHeight: "600px", cursor: isDragging ? "ew-resize" : "default" }}
        >
            {/* Slider divider */}
            <div
                className="bg-stewart-blue h-full w-1 absolute z-20 top-0 -ml-0.5 select-none"
                style={{ left: inset + "%" }}
            >
                <button
                    className="bg-stewart-blue text-white rounded-lg hover:scale-110 transition-all w-8 h-12 select-none -translate-y-1/2 absolute top-1/2 -ml-3.5 z-30 cursor-ew-resize flex justify-center items-center shadow-lg"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        handleStart(e.clientX);
                    }}
                    onTouchStart={(e) => {
                        if (e.touches.length > 0) {
                            handleStart(e.touches[0].clientX);
                        }
                    }}
                >
                    <GripVertical className="h-5 w-5 select-none" />
                </button>
            </div>

            {/* After (right side - revealed by sliding left) */}
            <div className="absolute inset-0 z-10" style={{ clipPath: `inset(0 0 0 ${inset}%)` }}>
                <div className="w-full h-full">
                    {afterContent}
                </div>
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {afterLabel}
                </div>
            </div>

            {/* Before (left side - base layer) */}
            <div className="absolute inset-0">
                <div className="w-full h-full">
                    {beforeContent}
                </div>
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {beforeLabel}
                </div>
            </div>
        </div>
    );
}
