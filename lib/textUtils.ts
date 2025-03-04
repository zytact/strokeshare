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
