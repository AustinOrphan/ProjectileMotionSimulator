import { canvas } from "./canvas.js";
import { scale, offsetX, offsetY } from "./controls.js";
import { CANVAS_ASPECT_RATIO, CANVAS_PADDING } from "./constants.js";

let visibleRangeX = 0, visibleRangeY = 0;

export function calculateVisibleRange(maxHeight, range) {
    visibleRangeX = range / scale; // Scaled range for x-axis
    visibleRangeY = maxHeight / scale; // Scaled range for y-axis
    if (visibleRangeX === 0) {
        visibleRangeX = 1; // Prevent division by zero
    }
    if (visibleRangeY === 0) {
        visibleRangeY = 1; // Prevent division by zero
    }
    if (visibleRangeX < visibleRangeY / CANVAS_ASPECT_RATIO) {
        visibleRangeX = visibleRangeY / CANVAS_ASPECT_RATIO;
    } else {
        visibleRangeY = visibleRangeX * CANVAS_ASPECT_RATIO;
    }
    return { visibleRangeX, visibleRangeY };
}

export function calculateCanvasCoordinates(x, y) {
    const xOffset = (x - offsetX) / visibleRangeX;
    const yOffset = (y + offsetY) / visibleRangeY;
    const canvasX = CANVAS_PADDING + xOffset * (canvas.width - 2 * CANVAS_PADDING);
    const canvasY = canvas.height - CANVAS_PADDING - yOffset * (canvas.height - 2 * CANVAS_PADDING);
    return { canvasX, canvasY };
}

export function invertCanvasCoordinates(canvasX, canvasY) {
    const canvasWidth = canvas.width - 2 * CANVAS_PADDING;
    const canvasHeight = canvas.height - 2 * CANVAS_PADDING;

    // Prevent division by zero
    const safeCanvasWidth = canvasWidth === 0 ? 1 : canvasWidth;
    const safeCanvasHeight = canvasHeight === 0 ? 1 : canvasHeight;

    const xOffset = (canvasX - CANVAS_PADDING) / safeCanvasWidth;
    const yOffset = (canvas.height - CANVAS_PADDING - canvasY) / safeCanvasHeight;
    const x = xOffset * visibleRangeX + offsetX;
    const y = yOffset * visibleRangeY - offsetY;
    return { x, y };
}