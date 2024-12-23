import { calculateVisibleRange, calculateCanvasCoordinates } from './scaling.js';
import { CANVAS_PADDING, CANVAS_ASPECT_RATIO } from './constants.js';

let canvas;
let ctx;

export function initializeCanvas() {
    canvas = document.getElementById("trajectoryCanvas");
    if (!canvas) {
        throw new Error("Canvas element not found");
    }
    ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Failed to get canvas context");
    }
}

export { canvas, ctx };

export function resizeCanvas() {
    const parentWidth = canvas.parentElement.clientWidth;
    canvas.width = parentWidth;
    canvas.height = parentWidth * CANVAS_ASPECT_RATIO; // Maintain aspect ratio
}

export function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawAxes(maxHeight = 0, range = 0, scale = 1, offsetX = 0, offsetY = 0) {

    // Calculate visible range based on scaling
    let { visibleRangeX, visibleRangeY } = calculateVisibleRange(maxHeight, range);

    // Set base tick spacing (adjustable for better visualization)
    const baseTickSpacingWorldUnits = Math.min(visibleRangeX, visibleRangeY) / 5; // Tick spacing in world units
    const tickSpacing = baseTickSpacingWorldUnits * scale; // Adjust spacing for zoom

    // Draw and label grid lines for x-axis
    drawGridLines('x', offsetX, tickSpacing, visibleRangeX);

    // Draw and label grid lines for y-axis
    drawGridLines('y', offsetY, tickSpacing, visibleRangeY);

    // Draw main axes
    drawMainAxes();

    // Add axis titles
    addAxisTitles();
}

function drawGridLines(axis, offset, tickSpacing, visibleRange) {
    let startCoord, endCoord;
    if (axis === 'x') {
        startCoord = offset - (offset % tickSpacing);
        endCoord = offset + visibleRange;
    } else {
        startCoord = (offset % tickSpacing) - offset;
        endCoord = visibleRange - offset;
    }

    // Draw grid lines including the line at 0
    for (let coord = startCoord; coord <= endCoord; coord += tickSpacing) {
        let canvasCoord;
        if (axis === 'x') {
            const { canvasX } = calculateCanvasCoordinates(coord, 0);
            canvasCoord = canvasX;
        } else {
            const { canvasY } = calculateCanvasCoordinates(0, coord);
            canvasCoord = canvasY;
        }

        // Draw grid line if within canvas bounds
        if (isGridLineInBounds(canvasCoord, axis)) {
            ctx.beginPath();
            if (coord === 0) {
                ctx.strokeStyle = "#1D2B35";
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = "#e0e0e0";
                ctx.lineWidth = 1;
            }
            if (axis === 'x') {
                ctx.moveTo(canvasCoord, canvas.height - CANVAS_PADDING);
                ctx.lineTo(canvasCoord, CANVAS_PADDING);
            } else {
                ctx.moveTo(CANVAS_PADDING, canvasCoord);
                ctx.lineTo(canvas.width - CANVAS_PADDING, canvasCoord);
            }
            ctx.stroke();
            ctx.closePath();
            const label = (coord).toFixed(1); // Adjust label for scaling
            ctx.fillStyle = "#1D2B35";
            ctx.font = "12px Arial";
            if (coord === 0) {
                ctx.textAlign = "right";
                ctx.fillText("0", CANVAS_PADDING - 5, canvas.height - CANVAS_PADDING + 20)
            }
            else if (axis === 'x') {
                ctx.textAlign = "left";
                ctx.fillText(label, canvasCoord - 10, canvas.height - CANVAS_PADDING + 20);
            } else {
                ctx.textAlign = "right";
                ctx.fillText(label, CANVAS_PADDING - 5, canvasCoord + 5);
            }
        }
    }
}

function drawMainAxes() {
    ctx.strokeStyle = "#1D2B35";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_PADDING, canvas.height - CANVAS_PADDING); // x-axis
    ctx.lineTo(canvas.width - CANVAS_PADDING, canvas.height - CANVAS_PADDING);
    ctx.moveTo(CANVAS_PADDING, canvas.height - CANVAS_PADDING); // y-axis
    ctx.lineTo(CANVAS_PADDING, CANVAS_PADDING);
    ctx.stroke();
    ctx.closePath();
}

function addAxisTitles() {
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#1D2B35";
    ctx.textAlign = "left";
    ctx.fillText("Range (m)", canvas.width - CANVAS_PADDING - 50, canvas.height - CANVAS_PADDING + 35);
    ctx.fillText("Height (m)", CANVAS_PADDING - 30, CANVAS_PADDING - 10);
}

function drawSpecificDashedLine(type, measurementValue) {
    let canvasCoord, label, axis;
    switch (type) {
        case 'maxHeight':
            const { canvasY: canvasYMaxHeight } = calculateCanvasCoordinates(0, measurementValue);
            canvasCoord = canvasYMaxHeight;
            label = `Max Height: ${measurementValue.toFixed(2)}m`;
            axis = 'y';
            break;
        case 'range':
            const { canvasX: canvasXRange } = calculateCanvasCoordinates(measurementValue, 0);
            canvasCoord = canvasXRange;
            label = `Range: ${measurementValue.toFixed(2)}m`;
            axis = 'x';
            break;
        case 'xAtMaxHeight':
            const { canvasX: canvasXXAtMaxHeight } = calculateCanvasCoordinates(measurementValue, 0);
            canvasCoord = canvasXXAtMaxHeight;
            label = `X@MaxHeight: ${measurementValue.toFixed(2)}m`;
            axis = 'x';
            break;
    }

    if (!isGridLineInBounds(canvasCoord, axis)) {
        return;
    }

    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line pattern: 5px dash, 5px space

    switch (axis) {
        case 'x':
            ctx.moveTo(canvasCoord, canvas.height - CANVAS_PADDING);
            ctx.lineTo(canvasCoord, CANVAS_PADDING);
            break;
        case 'y':
            ctx.moveTo(CANVAS_PADDING, canvasCoord);
            ctx.lineTo(canvas.width - CANVAS_PADDING, canvasCoord);
            break;
    }

    ctx.stroke();
    ctx.closePath();

    let textX, textY;
    if (type === 'maxHeight') {
        textX = CANVAS_PADDING + 10;
        textY = canvasCoord - 5;
    } else {
        textX = canvasCoord + 5;
        textY = canvas.height - CANVAS_PADDING - 10;
    }
    ctx.font = "12px Arial";
    ctx.fillText(label, textX, textY);
}

export function drawDashedLinesAndLabels(maxHeight, range, xAtMaxHeight) {
    ctx.beginPath();
    ctx.setLineDash([5, 5]); // Dashed line pattern: 5px dash, 5px space
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;

    drawSpecificDashedLine('maxHeight', maxHeight);
    drawSpecificDashedLine('range', range);
    drawSpecificDashedLine('xAtMaxHeight', xAtMaxHeight);
    ctx.closePath();
    ctx.setLineDash([]); // Reset dashed lines
}

function isGridLineInBounds (coord, axis) {
    return coord >= CANVAS_PADDING && coord <= (axis === 'x' ? canvas.width - CANVAS_PADDING : canvas.height - CANVAS_PADDING)
}