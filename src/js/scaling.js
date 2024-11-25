import { canvas } from "./canvas.js";
import { scale, offsetX, offsetY } from "./controls.js";
import { ASPECT_RATIO, PADDING } from "./constants.js";

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
    if (visibleRangeX < visibleRangeY) {
        visibleRangeX = visibleRangeY / ASPECT_RATIO;
    } else {
        visibleRangeY = visibleRangeX * ASPECT_RATIO;
    }
    return { visibleRangeX, visibleRangeY };
}

export function calculateCanvasCoordinates(x, y) {
    const xOffset = (x - offsetX) / visibleRangeX;
    const yOffset = (y + offsetY) / visibleRangeY;
    const canvasX = PADDING + xOffset * (canvas.width - 2 * PADDING);
    const canvasY = canvas.height - PADDING - yOffset * (canvas.height - 2 * PADDING);
    return { canvasX, canvasY };
}

export function invertCanvasCoordinates(canvasX, canvasY) {
    const canvasWidth = canvas.width - 2 * PADDING;
    const canvasHeight = canvas.height - 2 * PADDING;

    // Prevent division by zero
    const safeCanvasWidth = canvasWidth === 0 ? 1 : canvasWidth;
    const safeCanvasHeight = canvasHeight === 0 ? 1 : canvasHeight;

    const xOffset = (canvasX - PADDING) / safeCanvasWidth;
    const yOffset = (canvas.height - PADDING - canvasY) / safeCanvasHeight;
    const x = xOffset * visibleRangeX + offsetX;
    const y = yOffset * visibleRangeY - offsetY;
    return { x, y };
}