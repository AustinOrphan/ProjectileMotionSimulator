import { resizeCanvas, initializeCanvas } from './canvas.js';
import { setupControls, updateSimulation } from './controls.js';

document.addEventListener("DOMContentLoaded", function () {
    try {
        initializeCanvas();
        resizeCanvas();
        setupControls();
        updateSimulation(); // Initial drawing
    } catch (error) {
        console.error("Error initializing the application:", error);
    }
});