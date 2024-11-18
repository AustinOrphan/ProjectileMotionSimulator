let canvas;
let ctx;

export function initializeCanvas() {
    canvas = document.getElementById("trajectoryCanvas");
    ctx = canvas.getContext("2d");
}

export { canvas, ctx };

export function resizeCanvas() {
    const parentWidth = canvas.parentElement.clientWidth;
    canvas.width = parentWidth;
    canvas.height = parentWidth * (9 / 16); // Maintain 16:9 aspect ratio
}

export function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawAxes(maxHeight = 0, range = 0, scale = 1, offsetX = 0, offsetY = 0) {
    const padding = 40;
    const aspectRatio = canvas.width / canvas.height;
    clearCanvas();

    // Calculate visible range based on scaling
    let visibleRangeX = range / scale; // Scaled range for x-axis
    let visibleRangeY = maxHeight / scale; // Scaled range for y-axis
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

    // Set base tick spacing (adjustable for better visualization)
    const baseTickSpacingWorldUnits = Math.min(visibleRangeX, visibleRangeY) / 10; // Tick spacing in world units
    const tickSpacing = baseTickSpacingWorldUnits * scale; // Adjust spacing for zoom

    ctx.strokeStyle = "#e0e0e0"; // Light gray for grid lines
    ctx.lineWidth = 1;

    // Draw and label grid lines for x-axis
    drawGridLines('x', offsetX, tickSpacing, visibleRangeX, padding, scale);

    // Draw and label grid lines for y-axis
    drawGridLines('y', offsetY, tickSpacing, visibleRangeY, padding, scale);

    // Draw main axes
    drawMainAxes(padding);

    // Add axis titles
    addAxisTitles(padding);
}

function drawGridLines(axis, offset, tickSpacing, visibleRange, padding, scale) {
    const startCoord = (offset / scale) - ((offset / scale) % tickSpacing);
    const endCoord = offset + visibleRange;

    for (let coord = startCoord; coord <= endCoord; coord += tickSpacing) {
        let canvasCoord;
        if (axis === 'x') {
            canvasCoord = padding + ((coord - offset) / visibleRange) * (canvas.width - 2 * padding);
        } else {
            canvasCoord = canvas.height - padding - ((coord - offset) / visibleRange) * (canvas.height - 2 * padding);
        }

        if (canvasCoord >= padding && canvasCoord <= canvas.width - padding) {
            ctx.beginPath();
            if (axis === 'x') {
                ctx.moveTo(canvasCoord, canvas.height - padding);
                ctx.lineTo(canvasCoord, padding);
            } else {
                ctx.moveTo(padding, canvasCoord);
                ctx.lineTo(canvas.width - padding, canvasCoord);
            }
            ctx.stroke();

            const label = (coord / scale).toFixed(1); // Adjust label for scaling
            ctx.fillStyle = "black";
            if (axis === 'x') {
                ctx.fillText(label, canvasCoord - 10, canvas.height - padding + 20);
            } else {
                ctx.fillText(label, padding - 30, canvasCoord + 5);
            }

            console.log(`${axis.toUpperCase()}-axis gridline at canvas${axis.toUpperCase()}: ${canvasCoord}, label: ${label}`);
        }
    }
}

function drawMainAxes(padding) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding); // x-axis
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.moveTo(padding, canvas.height - padding); // y-axis
    ctx.lineTo(padding, padding);
    ctx.stroke();
}

function addAxisTitles(padding) {
    ctx.fillStyle = "black";
    ctx.fillText("0", padding - 10, canvas.height - padding + 15);
    ctx.fillText("Range (m)", canvas.width - padding - 50, canvas.height - padding + 15);
    ctx.fillText("Height (m)", padding - 30, padding - 10);

    console.log(`Main axes drawn with padding: ${padding}`);
}

export function drawDashedLinesAndLabels(maxHeight, range, xAtMaxHeight, scale, offsetX, offsetY) {
    console.log(`Drawing dashed lines and labels with maxHeight: ${maxHeight}, range: ${range}, xAtMaxHeight: ${xAtMaxHeight}, scale: ${scale}`);

    ctx.setLineDash([5, 5]); // Dashed line pattern: 5px dash, 5px space
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";

    const padding = 40;

    // Max height dashed line and label
    const maxHeightY = canvas.height - padding - (maxHeight * scale / maxHeight) * (canvas.height - 2 * padding) - offsetY;
    console.log(`Max Height Y: ${maxHeightY}`);
    ctx.beginPath();
    ctx.moveTo(padding, maxHeightY);
    ctx.lineTo(canvas.width - padding, maxHeightY);
    ctx.stroke();
    ctx.fillText(`Max Height: ${maxHeight.toFixed(2)}m`, padding + 10, maxHeightY - 5);

    // Range dashed line and label
    const rangeX = padding + (range * scale / range) * (canvas.width - 2 * padding) + offsetX;
    console.log(`Range X: ${rangeX}`);
    ctx.beginPath();
    ctx.moveTo(rangeX, padding);
    ctx.lineTo(rangeX, canvas.height - padding);
    ctx.stroke();
    ctx.fillText(`Range: ${range.toFixed(2)}m`, rangeX + 5, canvas.height - padding - 10);

    // X at max height dashed line and label
    const xAtMaxHeightX = padding + (xAtMaxHeight * scale / range) * (canvas.width - 2 * padding) + offsetX;
    console.log(`X at Max Height X: ${xAtMaxHeightX}`);
    ctx.beginPath();
    ctx.moveTo(xAtMaxHeightX, padding);
    ctx.lineTo(xAtMaxHeightX, canvas.height - padding);
    ctx.stroke();
    ctx.fillText(`X@MaxHeight: ${xAtMaxHeight.toFixed(2)}m`, xAtMaxHeightX + 5, canvas.height - padding - 10);

    ctx.setLineDash([]); // Reset dashed lines
}