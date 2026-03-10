/**
 * Main Application Initializer
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    UI.init();
    Timeline.init();
    Drag.init();

    // Initial render trigger
    State.notify();
});
