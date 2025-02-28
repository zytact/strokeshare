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
