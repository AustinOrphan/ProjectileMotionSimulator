import { canvas, ctx, drawAxes, drawDashedLinesAndLabels } from './canvas.js';
import { calculateCanvasCoordinates } from './scaling.js';
import { CANVAS_PADDING, NUM_SIMULATION_STEPS, FRAME_TIME_MS } from './constants.js';
import { updateSimulation, trajectoryData } from './controls.js';

let animationFrameId;
export let isPaused = false;
let currentTime = 0;

export function animateProjectile(timeOfFlight, maxHeight, range, xAtMaxHeight, scale, offsetX, offsetY, speedFactor, startTime = 0) {
    const simulationTimeInput = document.getElementById("simulationTime");
    const simulationTimeSlider = document.getElementById("simulationTimeSlider");

    // Set the max value of the slider to the time of flight
    simulationTimeSlider.max = timeOfFlight.toFixed(2);

    // Cancel any existing animation
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Set currentTime based on startTime
    currentTime = startTime * NUM_SIMULATION_STEPS / timeOfFlight;

    function drawFrame() {
        // Clear the canvas and redraw the axes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAxes(maxHeight, range, scale, offsetX, offsetY);
        drawDashedLinesAndLabels(maxHeight, range, xAtMaxHeight);

        ctx.setLineDash([]); // Reset dashed lines

        // Draw trajectory up to the current time
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;

        let lastX, lastY;
        for (let i = 0; i <= currentTime && i < trajectoryData.length ; i++) {
            const { x, y } = trajectoryData[i];

            // Convert x and y to canvas coordinates
            const { canvasX, canvasY } = calculateCanvasCoordinates(x, y);

            if (i === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }

            lastX = canvasX;
            lastY = canvasY;
        }

        ctx.stroke();

        // Draw the red circle at the current position
        if (lastX !== undefined && lastY !== undefined && isPointWithinCanvas(lastX, lastY) && currentTime < trajectoryData.length) {
            ctx.beginPath();
            ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI); // Projectile as a small circle
            ctx.fillStyle = "red";
            ctx.fill();
        }

        // Update simulation time display and slider
        const currentTimeInSeconds = (currentTime * timeOfFlight / NUM_SIMULATION_STEPS).toFixed(2);
        simulationTimeInput.value = currentTimeInSeconds;
        simulationTimeSlider.value = currentTimeInSeconds;

        // Request the next frame if the simulation is not over and not paused
        
        if (currentTime <= trajectoryData.length - 1 && !isPaused) {
            if (currentTime >= trajectoryData.length - 10) {
                currentTime = trajectoryData.length - 1;
            }
            currentTime += 10 * speedFactor;
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

export function calculateSimulationValues(velocity, angle, gravity, initialHeight) {
    const angleRadians = angle * Math.PI / 180;
    const vx = velocity * Math.cos(angleRadians);
    const vy = velocity * Math.sin(angleRadians);
    const timeOfFlight = (vy + Math.sqrt(Math.pow(vy, 2) + 2 * gravity * initialHeight)) / gravity;
    const maxHeight = initialHeight + Math.pow(vy, 2) / (2 * gravity);
    const range = vx * timeOfFlight;
    const xAtMaxHeight = vx * (vy / gravity);

    return { angleRadians, timeOfFlight, maxHeight, range, xAtMaxHeight, vx, vy };
}

export function calculateTrajectory(velocity, angle, gravity, initialHeight) {
    const points = [];
    const { timeOfFlight, vx, vy } = calculateSimulationValues(velocity, angle, gravity, initialHeight);

    for (let i = 0; i <= NUM_SIMULATION_STEPS; i++) {
        const time = (timeOfFlight / NUM_SIMULATION_STEPS) * i;
        const x = vx * time;
        const y = initialHeight + vy * time - 0.5 * gravity * Math.pow(time, 2);
        points.push({ x, y });
    }

    return points; // Return the points array
}

export function togglePlayPause() {
    isPaused = !isPaused;
    if (!isPaused) {
        const simulationTimeInput = document.getElementById("simulationTime");
        currentTime = parseFloat(simulationTimeInput.value) * NUM_SIMULATION_STEPS / trajectoryData.length;
        updateSimulation();
    }
}