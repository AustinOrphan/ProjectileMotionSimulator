import { calculateVisibleRange, calculateCanvasCoordinates } from './scaling.js';
import { PADDING, ASPECT_RATIO } from './constants.js';

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
    canvas.height = parentWidth * ASPECT_RATIO; // Maintain aspect ratio
}

export function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawAxes(maxHeight = 0, range = 0, scale = 1, offsetX = 0, offsetY = 0) {
    clearCanvas();

    // Calculate visible range based on scaling
    let { visibleRangeX, visibleRangeY } = calculateVisibleRange(maxHeight, range);

    // Set base tick spacing (adjustable for better visualization)
    const baseTickSpacingWorldUnits = Math.min(visibleRangeX, visibleRangeY) / 5; // Tick spacing in world units
    const tickSpacing = baseTickSpacingWorldUnits * scale; // Adjust spacing for zoom

    ctx.strokeStyle = "#e0e0e0"; // Light gray for grid lines
    ctx.lineWidth = 1;

    // Draw and label grid lines for x-axis
    drawGridLines('x', offsetX, tickSpacing, visibleRangeX, PADDING, scale);

    // Draw and label grid lines for y-axis
    drawGridLines('y', offsetY, tickSpacing, visibleRangeY, PADDING, scale);

    // Draw main axes
    drawMainAxes(PADDING);

    // Add axis titles
    addAxisTitles(PADDING);
}

function drawGridLines(axis, offset, tickSpacing, visibleRange, padding, scale) {
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
        if (canvasCoord > PADDING && canvasCoord < (axis === 'x' ? canvas.width - PADDING : canvas.height - PADDING)) {
            ctx.beginPath();
            if (coord === 0) {
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = "#e0e0e0";
                ctx.lineWidth = 1;
            }
            if (axis === 'x') {
                ctx.moveTo(canvasCoord, canvas.height - PADDING);
                ctx.lineTo(canvasCoord, PADDING);
            } else {
                ctx.moveTo(PADDING, canvasCoord);
                ctx.lineTo(canvas.width - PADDING, canvasCoord);
            }
            ctx.stroke();

            const label = (coord).toFixed(1); // Adjust label for scaling
            ctx.fillStyle = "black";
            if (axis === 'x') {
                ctx.textAlign = "left";
                ctx.fillText(coord === 0 ? "0" : label, canvasCoord - 10, canvas.height - PADDING + 20);
            } else {
                ctx.textAlign = "right";
                ctx.fillText(coord === 0 ? "0" : label, PADDING - 5, canvasCoord + 5);
            }
        }
    }
}

function drawMainAxes(padding) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING, canvas.height - PADDING); // x-axis
    ctx.lineTo(canvas.width - PADDING, canvas.height - PADDING);
    ctx.moveTo(PADDING, canvas.height - PADDING); // y-axis
    ctx.lineTo(PADDING, PADDING);
    ctx.stroke();
}

function addAxisTitles(padding) {
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    // ctx.fillText("0", PADDING - 10, canvas.height - PADDING + 15);
    ctx.fillText("Range (m)", canvas.width - PADDING - 50, canvas.height - PADDING + 35);
    ctx.fillText("Height (m)", PADDING - 30, PADDING - 10);
}

function drawSpecificDashedLine(type, measurementValue, padding ) {
    let canvasCoord, label;
    switch (type) {
        case 'maxHeight':
            const { canvasY: canvasYMaxHeight } = calculateCanvasCoordinates(0, measurementValue);
            canvasCoord = canvasYMaxHeight;
            label = `Max Height: ${measurementValue.toFixed(2)}m`;
            ctx.moveTo(PADDING, canvasCoord);
            ctx.lineTo(canvas.width - PADDING, canvasCoord);
            break;
        case 'range':
            const { canvasX: canvasXRange } = calculateCanvasCoordinates(measurementValue, 0);
            canvasCoord = canvasXRange;
            label = `Range: ${measurementValue.toFixed(2)}m`;
            ctx.moveTo(canvasCoord, PADDING);
            ctx.lineTo(canvasCoord, canvas.height - PADDING);
            break;
        case 'xAtMaxHeight':
            const { canvasX: canvasXXAtMaxHeight } = calculateCanvasCoordinates(measurementValue, 0);
            canvasCoord = canvasXXAtMaxHeight;
            label = `X@MaxHeight: ${measurementValue.toFixed(2)}m`;
            ctx.moveTo(canvasCoord, PADDING);
            ctx.lineTo(canvasCoord, canvas.height - PADDING);
            break;
    }

    ctx.stroke();
    let textX, textY;
    if (type === 'maxHeight') {
        textX = PADDING + 10;
        textY = canvasCoord - 5;
    } else {
        textX = canvasCoord + 5;
        textY = canvas.height - PADDING - 10;
    }
    ctx.fillText(label, textX, textY);
}

export function drawDashedLinesAndLabels(maxHeight, range, xAtMaxHeight) {
    ctx.setLineDash([5, 5]); // Dashed line pattern: 5px dash, 5px space
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;

    drawSpecificDashedLine('maxHeight', maxHeight, PADDING);
    drawSpecificDashedLine('range', range, PADDING);
    drawSpecificDashedLine('xAtMaxHeight', xAtMaxHeight, PADDING);
    
    ctx.setLineDash([]); // Reset dashed lines
}