interface Point {
    x: number;
    y: number;
}

interface DrawLine {
    points: number[];
    color: string;
    strokeWidth?: number;
}

interface TextElement {
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fill: string;
    id: string;
}
