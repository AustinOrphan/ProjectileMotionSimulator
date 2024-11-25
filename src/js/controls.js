import { canvas, ctx, drawAxes, drawDashedLinesAndLabels, resizeCanvas } from './canvas.js';
import { calculateCanvasCoordinates } from './scaling.js';
import { animateProjectile, calculateTrajectory } from './simulation.js';
import { DEG_TO_RAD } from './constants.js';

export let scale = 1;
export let offsetX = 0;
export let offsetY = 0;
let animationFrameId;

const GRAVITY_SELECT_ID = "gravitySelect";
const CUSTOM_GRAVITY_ID = "customGravity";
const ANGLE_ID = "angle";
const ANGLE_INPUT_ID = "angleInput";
const SPEED_CONTROL_ID = "speedControl";
const SPEED_VALUE_ID = "speedValue";
const VELOCITY_ID = "velocity";
const HEIGHT_ID = "height";
let gravitySelect;
let customGravityInput;
let angleInput;
let angleTextInput;
let speedControl;
let speedValue;
let velocityInput;
let heightInput;

export function setupControls() {
    gravitySelect = document.getElementById(GRAVITY_SELECT_ID);
    customGravityInput = document.getElementById(CUSTOM_GRAVITY_ID);
    angleInput = document.getElementById(ANGLE_ID);
    angleTextInput = document.getElementById(ANGLE_INPUT_ID);
    speedControl = document.getElementById(SPEED_CONTROL_ID);
    speedValue = document.getElementById(SPEED_VALUE_ID);
    velocityInput = document.getElementById(VELOCITY_ID);
    heightInput = document.getElementById(HEIGHT_ID);

    gravitySelect.addEventListener("change", () => {
        customGravityInput.style.display = gravitySelect.value === "0" ? "inline" : "none";
    });

    const inputs = document.querySelectorAll(`#${VELOCITY_ID}, #${ANGLE_ID}, #${HEIGHT_ID}, #${GRAVITY_SELECT_ID}, #${CUSTOM_GRAVITY_ID}, #${SPEED_CONTROL_ID}, #${ANGLE_INPUT_ID}`);
    inputs.forEach((input) => {

        input.addEventListener("input", () => {
            switch (input.id) {
                case "angleInput":
                    let angleValue = parseFloat(angleTextInput.value);
                    if (angleValue > 90) {
                        angleTextInput.value = 90;
                    }
                    angleInput.value = angleTextInput.value;
                    break;
                case "angle":
                    angleTextInput.value = angleInput.value;
                    break;
            }

            if (input.value !== "") {
                let minVal = 0;
                switch (input.id) {
                    case "velocity":
                        minVal = 0.1;
                        break;
                    case "angle":
                        minVal = 0.1;
                        break;
                    case "angleInput":
                        minVal = 0.1;
                        break;
                    case "height":
                        minVal = 0;
                        break;
                    case "customGravity":
                        minVal = 0.1;
                        break;
                }
                if (minVal > parseFloat(input.value)) {
                    input.value = minVal;
                }
            }
            updateSimulation();
        });
    });

    speedControl.addEventListener('input', () => {
        speedValue.textContent = speedControl.value + 'x';
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

    canvas.addEventListener("mouseup", () => {
        isPanning = false;
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

    canvas.addEventListener("mouseleave", () => {
        isPanning = false;
    });
}

export function updateSimulation() {
    const { velocity, angle, gravity, initialHeight, speedFactor } = getSimulationParameters();

    if (isInvalidSimulationParameters(velocity, angle, gravity, initialHeight)) {
        clearCanvasAndDrawAxes();
        return;
    }

    cancelExistingAnimation();

    const { angleRadians, timeOfFlight, maxHeight, range, xAtMaxHeight } = calculateSimulationValues(velocity, angle, gravity, initialHeight);

    const trajectoryPoints = calculateTrajectory(velocity, angleRadians, gravity, initialHeight);
    drawAxes(maxHeight, range, scale, offsetX, offsetY);
    animationFrameId = animateProjectile(velocity, angleRadians, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY, speedFactor);
    drawDashedLinesAndLabels(maxHeight, range, xAtMaxHeight);
}

function getSimulationParameters() {
    const velocity = parseFloat(velocityInput.value);
    const angle = parseFloat(angleInput.value);
    let gravity = parseFloat(gravitySelect.value);
    if (gravity === 0) {
        gravity = parseFloat(customGravityInput.value);
    }
    const initialHeight = parseFloat(heightInput.value);
    const speedFactor = parseFloat(speedControl.value);

    angleInput.textContent = angle;
    speedValue.textContent = speedFactor + 'x';

    return { velocity, angle, gravity, initialHeight, speedFactor };
}

function isInvalidSimulationParameters(velocity, angle, gravity, initialHeight) {
    return isNaN(velocity) || isNaN(angle) || isNaN(gravity) || isNaN(initialHeight) || velocity <= 0 || gravity <= 0;
}

function clearCanvasAndDrawAxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes(0, 0); // Keep the grid visible
}

function cancelExistingAnimation() {
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function calculateSimulationValues(velocity, angle, gravity, initialHeight) {
    const angleRadians = angle * DEG_TO_RAD;
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

    return { angleRadians, timeOfFlight, maxHeight, range, xAtMaxHeight };
}


