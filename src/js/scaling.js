import { canvas, aspectRatio } from "./canvas.js";
import { scale, offsetX, offsetY } from "./controls.js";

let visibleRangeX = 0, visibleRangeY = 0;
let padding = 50;

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
        visibleRangeX = visibleRangeY * aspectRatio;
    } else {
        visibleRangeY = visibleRangeX / aspectRatio;
    }
    return { visibleRangeX, visibleRangeY };
}

export function calculateCanvasCoordinates(x, y) {
    const xOffset = (x - offsetX) / visibleRangeX;
    const yOffset = (y + offsetY) / visibleRangeY;
    const canvasX = padding + xOffset * (canvas.width - 2 * padding);
    const canvasY = canvas.height - padding - yOffset * (canvas.height - 2 * padding);
    return { canvasX, canvasY };
}

export function invertCanvasCoordinates(canvasX, canvasY) {
    const canvasWidth = canvas.width - 2 * padding;
    const canvasHeight = canvas.height - 2 * padding;

    // Prevent division by zero
    const safeCanvasWidth = canvasWidth === 0 ? 1 : canvasWidth;
    const safeCanvasHeight = canvasHeight === 0 ? 1 : canvasHeight;

    const xOffset = (canvasX - padding) / safeCanvasWidth;
    const yOffset = (canvas.height - padding - canvasY) / safeCanvasHeight;
    const x = xOffset * visibleRangeX + offsetX;
    const y = yOffset * visibleRangeY - offsetY;
    return { x, y };
}