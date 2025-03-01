import Konva from 'konva';

export const getTextRotation = (textNode: Konva.Text) => {
    // Get absolute rotation including all parent rotations
    let rotation = textNode.rotation();
    let parent = textNode.parent;
    while (parent) {
        rotation += parent.rotation();
        parent = parent.parent;
    }
    return rotation;
};

export const getTextPosition = (textNode: Konva.Text, stage: Konva.Stage) => {
    // Get absolute position
    const absPos = textNode.absolutePosition();

    // Convert to relative position considering stage transform
    return {
        x: (absPos.x - stage.x()) / stage.scaleX(),
        y: (absPos.y - stage.y()) / stage.scaleY(),
    };
};
