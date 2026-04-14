const XTwitterIcon = ({
    size = undefined,
    color = "#000000",
    strokeWidth = 2,
    background = "transparent",
    opacity = 1,
    rotation = 0,
    shadow = 0,
    flipHorizontal = false,
    flipVertical = false,
    padding = 0,
}: {
    size?: number;
    color?: string;
    strokeWidth?: number;
    background?: string;
    opacity?: number;
    rotation?: number;
    shadow?: number;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    padding?: number;
}) => {
    const transforms = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipHorizontal) transforms.push("scaleX(-1)");
    if (flipVertical) transforms.push("scaleY(-1)");

    const viewBoxSize = 24 + padding * 2;
    const viewBoxOffset = -padding;
    const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
            width={size}
            height={size}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                opacity,
                transform: transforms.join(" ") || undefined,
                filter:
                    shadow > 0
                        ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))`
                        : undefined,
                backgroundColor: background !== "transparent" ? background : undefined,
            }}
        >
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={strokeWidth}
                d="m13.081 10.712l-4.786-6.71a.6.6 0 0 0-.489-.252H5.28a.6.6 0 0 0-.488.948l6.127 8.59m2.162-2.576l6.127 8.59a.6.6 0 0 1-.488.948h-2.526a.6.6 0 0 1-.489-.252l-4.786-6.71m2.162-2.576l5.842-6.962m-8.004 9.538L5.077 20.25"
            />
        </svg>
    );
};

export default XTwitterIcon;
