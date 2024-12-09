import { initializeCanvas, canvas, ctx, drawAxes, drawDashedLinesAndLabels } from './canvas.js';
import { calculateVisibleRange, calculateCanvasCoordinates } from './scaling.js';
import { CANVAS_PADDING, NUM_SIMULATION_STEPS, FRAME_TIME_MS } from './constants.js';
import { getSimulationParameters, calculateSimulationValues, updateSimulation } from './controls.js';

let animationFrameId;
let trajectoryData = []; // Stores trajectory points for redrawing
export let isPaused = false;
let currentTime = 0;

export function animateProjectile(velocity, angle, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY, speedFactor) {
    let simulationIndexAtCurrentTime = Math.floor(currentTime * NUM_SIMULATION_STEPS / timeOfFlight); // Current step of the simulation
    const stepDuration = FRAME_TIME_MS / speedFactor;
    const simulationTimeInput = document.getElementById("simulationTime");
    const simulationTimeSlider = document.getElementById("simulationTimeSlider");

    // Set the max value of the slider to the time of flight
    simulationTimeSlider.max = timeOfFlight.toFixed(2);

    // Cancel any existing animation
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    function drawFrame() {
        // Clear the canvas and redraw the axes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAxes(maxHeight, range, scale, offsetX, offsetY);
        drawDashedLinesAndLabels(maxHeight, range, velocity * Math.cos(angle) * (velocity * Math.sin(angle) / gravity));

        ctx.setLineDash([]); // Reset dashed lines

        // Draw trajectory up to the current time
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;

        let lastX, lastY;
        for (let i = 0; i <= simulationIndexAtCurrentTime; i++) {
            const time = (timeOfFlight / NUM_SIMULATION_STEPS) * i;
            const { x, y } = getProjectileCoordinates(time, velocity, angle, initialHeight, gravity);

            // Convert x and y to canvas coordinates
            const { canvasX, canvasY } = calculateCanvasCoordinates(x, y);

            if (!isPointWithinCanvas(canvasX, canvasY) || i === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }

            lastX = canvasX;
            lastY = canvasY;
        }

        ctx.stroke();

        // Draw the red circle at the current position
        if (lastX !== undefined && lastY !== undefined && isPointWithinCanvas(lastX, lastY) && simulationIndexAtCurrentTime < NUM_SIMULATION_STEPS) {
            ctx.beginPath();
            ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI); // Projectile as a small circle
            ctx.fillStyle = "red";
            ctx.fill();
        }

        // Update simulation time display and slider
        currentTime = (simulationIndexAtCurrentTime * timeOfFlight / NUM_SIMULATION_STEPS).toFixed(2);
        simulationTimeInput.value = currentTime;
        simulationTimeSlider.value = currentTime;

        // Request the next frame if the simulation is not over and not paused
        if (simulationIndexAtCurrentTime < NUM_SIMULATION_STEPS && !isPaused) {
            simulationIndexAtCurrentTime += 10 * speedFactor;
            animationFrameId = window.requestAnimationFrame(drawFrame);
        }
    }

    drawFrame();
}

export function getProjectileCoordinates(time, velocity, angle, initialHeight, gravity) {
    const x = velocity * Math.cos(angle) * time;
    const y = initialHeight + velocity * Math.sin(angle) * time - 0.5 * gravity * Math.pow(time, 2);
    return { x, y };
}

function isPointWithinCanvas(xCoord, yCoord) {
    const isWithinCanvasX = xCoord > CANVAS_PADDING && xCoord < canvas.width - CANVAS_PADDING;
    const isWithinCanvasY = yCoord > CANVAS_PADDING && yCoord < canvas.height - CANVAS_PADDING;
    return isWithinCanvasX && isWithinCanvasY;
}

export function calculateTrajectory(initialVelocity, angle, gravity, initialHeight) {
    const points = [];
    const radianAngle = (angle * Math.PI) / 180; // Convert angle to radians
    const vx = initialVelocity * Math.cos(radianAngle); // Velocity in x direction
    const vy = initialVelocity * Math.sin(radianAngle); // Velocity in y direction
    const timeOfFlight = (vy + Math.sqrt(vy ** 2 + 2 * gravity * initialHeight)) / gravity;

    for (let t = 0; t <= timeOfFlight; t++) {
        const x = vx * t;
        const y = initialHeight + vy * t - 0.5 * gravity * t ** 2;
        points.push({ x, y });
    }

    trajectoryData = points; // Store trajectory points for redrawing
    drawTrajectory(); // Draw trajectory on canvas

    return points; // Return the points array
}

function drawTrajectory() {
    const initialCanvasWidth = canvas.width;
    const initialCanvasHeight = canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    if (trajectoryData.length === 0) return; // No trajectory data to draw

    const scaleX = canvas.width / initialCanvasWidth;
    const scaleY = canvas.height / initialCanvasHeight;

    ctx.beginPath();
    ctx.strokeStyle = "blue";
    trajectoryData.forEach((point) => {
        const x = point.x * scaleX;
        const y = canvas.height - point.y * scaleY; // Flip y-axis for canvas

        ctx.moveTo(x, y);
    });
    ctx.stroke();
}

export function togglePlayPause() {
    isPaused = !isPaused;
    if (!isPaused) {
        currentTime = parseFloat(document.getElementById("simulationTime").value);
        updateSimulation();
    }
}