import { resizeCanvas, drawAxes, drawDashedLinesAndLabels, canvas, ctx } from './canvas.js';
import { animateProjectile, calculateTrajectory } from './simulation.js';
import { calculateCanvasCoordinates } from './scaling.js';

export let scale = 1; // Default scale
export let offsetX = 0; // Default offset
export let offsetY = 0; // Default offset
let speedFactor = 1; // Default speed factor
let animationFrameId; // Store the animation frame ID

export function setupControls() {
    const gravitySelect = document.getElementById("gravitySelect");
    const customGravityInput = document.getElementById("customGravity");

    gravitySelect.addEventListener("change", function () {
        customGravityInput.style.display = gravitySelect.value === "0" ? "inline" : "none";
    });

    const inputs = document.querySelectorAll("#velocity, #angle, #height, #gravitySelect, #customGravity");
    inputs.forEach((input) => {
        input.addEventListener("input", updateSimulation);
    });

    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        const zoomFactor = 0.1;
        scale += event.deltaY < 0 ? zoomFactor : -zoomFactor; // Zoom in/out
        scale = Math.min(Math.max(scale, 0.5), 2); // Limit zoom level
        updateSimulation();
    });

    let isPanning = false;
    let startX, startY;

    canvas.addEventListener("mousedown", (event) => {
        isPanning = true;
        startX = event.offsetX;
        startY = event.offsetY;
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isPanning) {
            const { canvasX: startCanvasX, canvasY: startCanvasY } = calculateCanvasCoordinates(startX, startY);
            const { canvasX: currentCanvasX, canvasY: currentCanvasY } = calculateCanvasCoordinates(event.offsetX, event.offsetY);

            const dx = (currentCanvasX - startCanvasX) / scale; // Adjust by zoom level
            const dy = (currentCanvasY - startCanvasY) / scale;

            offsetX -= dx; // Subtract to move in opposite direction
            offsetY += dy; // Add to move in correct direction

            startX = event.offsetX;
            startY = event.offsetY;

            updateSimulation(); // Redraw the canvas with updated offsets
        }
    });

    canvas.addEventListener("mouseup", () => {
        isPanning = false;
    });

    canvas.addEventListener("mouseleave", () => {
        isPanning = false;
    });

    // Add event listener for speed control
    document.getElementById('speedControl').addEventListener('input', function(event) {
        speedFactor = parseFloat(event.target.value);
        document.getElementById('speedValue').textContent = `${speedFactor}x`;
        updateSimulation(); // Update the simulation with the new speed factor
    });
}

export function updateSimulation() {
    const velocity = parseFloat(document.getElementById("velocity").value);
    const angle = parseFloat(document.getElementById("angle").value);
    let gravity = parseFloat(document.getElementById("gravitySelect").value);
    if (gravity === 0) {
        gravity = parseFloat(document.getElementById("customGravity").value);
    }
    const initialHeight = parseFloat(document.getElementById("height").value);

    if (isNaN(velocity) || isNaN(angle) || isNaN(gravity) || isNaN(initialHeight) || velocity <= 0 || gravity <= 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAxes(0, 0); // Keep the grid visible
        return;
    }

    // Cancel any existing animation
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    const angleRadians = (angle * Math.PI) / 180;
    const timeOfFlight =
        (velocity * Math.sin(angleRadians) +
            Math.sqrt(
                Math.pow(velocity * Math.sin(angleRadians), 2) +
                2 * gravity * initialHeight
            )) /
        gravity;
    const maxHeight =
        initialHeight +
        Math.pow(velocity * Math.sin(angleRadians), 2) / (2 * gravity);
    const range = velocity * Math.cos(angleRadians) * timeOfFlight;
    const xAtMaxHeight = velocity * Math.cos(angleRadians) * (velocity * Math.sin(angleRadians) / gravity);

    const trajectoryPoints = calculateTrajectory(velocity, angleRadians, gravity, initialHeight);
    drawAxes(maxHeight, range, scale, offsetX, offsetY);
    animationFrameId = animateProjectile(velocity, angleRadians, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY, speedFactor);
    drawDashedLinesAndLabels(maxHeight, range, xAtMaxHeight);
}