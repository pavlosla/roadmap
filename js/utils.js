/**
 * Utility functions for the roadmap application
 */

const Utils = {
    // Generate a unique ID for milestones
    generateId() {
        return Math.random().toString(36).substring(2, 11);
    },

    // Get current year
    getCurrentYear() {
        return new Date().getFullYear();
    },

    // Get current week (1-52)
    getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        const week = Math.floor(diff / oneWeek) + 1;
        // Cap at 52 for our simple model
        return Math.min(week, 52);
    },

    // Map month index (0-11) to Quarter (1-4)
    getQuarter(monthIndex) {
        return Math.floor(monthIndex / 3) + 1;
    },

    // Formatting helpers
    formatDateRange(startWeek, endWeek, year) {
        return `Week ${startWeek} - Week ${endWeek}, ${year}`;
    },
    
    // Check if an element is out of viewport bounds
    isElementOutViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.bottom < 0 ||
            rect.right < 0 ||
            rect.left > (window.innerWidth || document.documentElement.clientWidth) ||
            rect.top > (window.innerHeight || document.documentElement.clientHeight)
        );
    }
};

function getActivityColor(type) {
    if (typeof State !== 'undefined' && State.activityTypes) {
        // Initially, activityTypes used the readable name as the ID. Now it's a separate name field.
        const activity = State.activityTypes.find(a => a.name === type || a.id === type);
        return activity ? activity.color : 'var(--text-muted)';
    }
    return 'var(--text-muted)';
}
