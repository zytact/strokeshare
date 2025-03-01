export const getSelectedLine = (
    selectedId: string | null,
    selectedShape: ShapeType | null,
    lines: DrawLine[],
) => {
    if (selectedId && selectedShape === 'line') {
        return lines[parseInt(selectedId)];
    }
    return null;
};

export const getSelectedRect = (
    selectedId: string | null,
    selectedShape: ShapeType | null,
    rectangles: Rectangle[],
) => {
    if (selectedId && selectedShape === 'rectangle') {
        return rectangles[parseInt(selectedId)];
    }
    return null;
};

export const getSelectedCircle = (
    selectedId: string | null,
    selectedShape: ShapeType | null,
    circles: Circle[],
) => {
    if (selectedId && selectedShape === 'circle') {
        return circles[parseInt(selectedId)];
    }
    return null;
};
