interface Point {
    x: number;
    y: number;
}

interface DrawLine {
    points: number[];
    color: string;
    strokeWidth?: number;
    isArrow?: boolean;
    isDashed?: boolean;
}

interface TextElement {
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fill: string;
    id: string;
}

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    strokeWidth?: number;
    isDashed?: boolean;
    cornerRadius?: number;
    fill?: string;
}
