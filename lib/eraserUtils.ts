import Konva from 'konva';

export const isPointNearText = (
    px: number,
    py: number,
    text: TextElement,
    stage: Konva.Stage,
    eraserRadius: number,
) => {
    const textNode = stage.findOne('#' + text.id) as Konva.Text;
    if (!textNode) return false;

    // Get the absolute transformed bounding box
    const box = textNode.getClientRect();

    // Convert the eraser point to the same coordinate space as the bounding box
    const scale = stage.scaleX();
    const point = {
        x: px * scale + stage.x(),
        y: py * scale + stage.y(),
    };

    // Adjust eraserRadius for stage scale
    const scaledRadius = eraserRadius * scale;

    // Check if point is near the bounding box edges
    const nearLeft = Math.abs(point.x - box.x) <= scaledRadius;
    const nearRight = Math.abs(point.x - (box.x + box.width)) <= scaledRadius;
    const nearTop = Math.abs(point.y - box.y) <= scaledRadius;
    const nearBottom = Math.abs(point.y - (box.y + box.height)) <= scaledRadius;

    // Check if point is inside or near the box
    const insideX =
        point.x >= box.x - scaledRadius &&
        point.x <= box.x + box.width + scaledRadius;
    const insideY =
        point.y >= box.y - scaledRadius &&
        point.y <= box.y + box.height + scaledRadius;

    return (
        (insideX && (nearTop || nearBottom)) ||
        (insideY && (nearLeft || nearRight))
    );
};

export const isPointNearRectangle = (
    px: number,
    py: number,
    rect: Rectangle,
    stage: Konva.Stage,
    eraserRadius: number,
) => {
    // Convert the rectangle's position to the same coordinate space as the eraser point
    const scale = stage.scaleX();
    const box = {
        x: rect.x * scale + stage.x(),
        y: rect.y * scale + stage.y(),
        width: rect.width * scale,
        height: rect.height * scale,
    };

    // Convert the point to the same coordinate space
    const point = {
        x: px * scale + stage.x(),
        y: py * scale + stage.y(),
    };

    // Adjust eraserRadius for stage scale
    const scaledRadius = eraserRadius * scale;

    // Check if point is near the rectangle edges
    const nearLeft = Math.abs(point.x - box.x) <= scaledRadius;
    const nearRight = Math.abs(point.x - (box.x + box.width)) <= scaledRadius;
    const nearTop = Math.abs(point.y - box.y) <= scaledRadius;
    const nearBottom = Math.abs(point.y - (box.y + box.height)) <= scaledRadius;

    // Check if point is inside or near the rectangle
    const insideX =
        point.x >= box.x - scaledRadius &&
        point.x <= box.x + box.width + scaledRadius;
    const insideY =
        point.y >= box.y - scaledRadius &&
        point.y <= box.y + box.height + scaledRadius;

    return (
        (insideX && (nearTop || nearBottom)) ||
        (insideY && (nearLeft || nearRight))
    );
};

export const isPointNearCircle = (
    px: number,
    py: number,
    circle: Circle,
    stage: Konva.Stage,
    eraserRadius: number,
) => {
    // Convert the circle's position to the same coordinate space as the eraser point
    const scale = stage.scaleX();
    const circleCenter = {
        x: circle.x * scale + stage.x(),
        y: circle.y * scale + stage.y(),
    };
    const scaledRadius = circle.radius * scale;

    // Convert the point to the same coordinate space
    const point = {
        x: px * scale + stage.x(),
        y: py * scale + stage.y(),
    };

    // Calculate distance from point to circle's edge
    const dx = point.x - circleCenter.x;
    const dy = point.y - circleCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if point is near the circle's edge
    return Math.abs(distance - scaledRadius) <= eraserRadius * scale;
};

export const isPointNearImage = (
    px: number,
    py: number,
    image: Image,
    stage: Konva.Stage,
    eraserRadius: number,
) => {
    // Convert coordinates to stage space
    const scale = stage.scaleX();
    const box = {
        x: image.x * scale + stage.x(),
        y: image.y * scale + stage.y(),
        width: image.width * scale,
        height: image.height * scale,
    };

    const point = {
        x: px * scale + stage.x(),
        y: py * scale + stage.y(),
    };

    const scaledRadius = eraserRadius * scale;

    // Check if point is near the edges
    const nearLeft = Math.abs(point.x - box.x) <= scaledRadius;
    const nearRight = Math.abs(point.x - (box.x + box.width)) <= scaledRadius;
    const nearTop = Math.abs(point.y - box.y) <= scaledRadius;
    const nearBottom = Math.abs(point.y - (box.y + box.height)) <= scaledRadius;

    const insideX =
        point.x >= box.x - scaledRadius &&
        point.x <= box.x + box.width + scaledRadius;
    const insideY =
        point.y >= box.y - scaledRadius &&
        point.y <= box.y + box.height + scaledRadius;

    return (
        (insideX && (nearTop || nearBottom)) ||
        (insideY && (nearLeft || nearRight))
    );
};

export function getDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function getDistanceToLineSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    return getDistance(px, py, xx, yy);
}
