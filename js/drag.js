/**
 * Drag and drop & resizing logic
 */

const Drag = {
    isDragging: false,
    isResizing: false,
    activeEl: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    hasMoved: false,
    resizeEdge: null,
    milestoneObj: null,

    init() {
        const swimlane = document.getElementById('swimlane-container');
        
        // Event delegation
        swimlane.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    },

    onMouseDown(e) {
        // Check if resize handle
        if (e.target.classList.contains('resize-handle')) {
            this.isResizing = true;
            this.resizeEdge = e.target.dataset.edge;
            this.activeEl = e.target.parentElement;
        } 
        // Check if milestone body
        else if (e.target.classList.contains('milestone')) {
            this.isDragging = true;
            this.activeEl = e.target;
        } else {
            return;
        }

        e.preventDefault(); // Prevent text selection
        
        // Get milestone ID and data
        const id = this.activeEl.dataset.id;
        this.milestoneObj = State.milestones.find(m => m.id === id);

        this.startX = e.clientX;
        this.startY = e.clientY;
        this.hasMoved = false;
        this.activeEl.classList.add('dragging');
        
        // Cache initial dimensions
        const rect = this.activeEl.getBoundingClientRect();
        this.startLeft = this.activeEl.offsetLeft;
        this.startTop = this.activeEl.offsetTop;
        this.startWidth = rect.width;
        // Hide tooltip only when actual movement starts (handled in onMouseMove)
    },

    onMouseMove(e) {
        if (!this.isDragging && !this.isResizing) return;

        const deltaX = e.clientX - this.startX;
        const containerWidth = document.getElementById('swimlane-container').clientWidth;
        const pixelsPerWeek = containerWidth / 52;
                if (deltaX === 0 && (e.clientY - this.startY) === 0) return;
        
        if (!this.hasMoved) {
            this.hasMoved = true;
            UI.hideTooltip(); // Hide tooltip once drag actually begins
        }

        if (this.isDragging) {
            // Logic for moving
            let newLeft = this.startLeft + deltaX;
            let newTop = this.startTop + (e.clientY - this.startY);
            
            // Bound left to container
            newLeft = Math.max(0, Math.min(newLeft, containerWidth - this.startWidth));
            this.activeEl.style.left = `${newLeft}px`;
            
            // Bound top relative to container rows (no negative, allow infinite positive to add rows)
            newTop = Math.max(0, newTop);
            this.activeEl.style.top = `${newTop}px`;
            
            // Highlight hover row
            const hoverRowIndex = Math.floor((newTop + 16) / 48); // 48 is row height, 16 is half milestone height
            document.querySelectorAll('.timeline-row').forEach(r => r.classList.remove('drag-over'));
            const rows = document.querySelectorAll('.timeline-row');
            if (rows[hoverRowIndex]) rows[hoverRowIndex].classList.add('drag-over');

        } else if (this.isResizing) {
            // Logic for resizing
            if (this.resizeEdge === 'right') {
                let newWidth = this.startWidth + deltaX;
                // Min width 1 week
                newWidth = Math.max(pixelsPerWeek, Math.min(newWidth, containerWidth - this.startLeft));
                this.activeEl.style.width = `${newWidth}px`;
            } else if (this.resizeEdge === 'left') {
                let newLeft = this.startLeft + deltaX;
                let newWidth = this.startWidth - deltaX;
                
                // Enforce min width
                if (newWidth < pixelsPerWeek) {
                    newWidth = pixelsPerWeek;
                    newLeft = this.startLeft + this.startWidth - pixelsPerWeek;
                }
                
                // Enforce container bounds
                if (newLeft < 0) {
                    newLeft = 0;
                    newWidth = this.startWidth + this.startLeft; // Max width to the left
                }

                this.activeEl.style.left = `${newLeft}px`;
                this.activeEl.style.width = `${newWidth}px`;
            }
        }
    },

    onMouseUp(e) {
        if (!this.isDragging && !this.isResizing) return;
        
        const containerWidth = document.getElementById('swimlane-container').clientWidth;
        const pixelsPerWeek = containerWidth / 52;

        // Calculate new values based on absolute pixel positions
        const currentLeftPx = this.activeEl.offsetLeft;
        const currentWidthPx = this.activeEl.offsetWidth;
        const currentTopPx = this.activeEl.offsetTop;

        // Snap to grid (nearest week)
        let newStartWeek = Math.round(currentLeftPx / pixelsPerWeek) + 1;
        let newDuration = Math.round(currentWidthPx / pixelsPerWeek);
        let newRowIndex = Math.max(0, Math.floor((currentTopPx + 16) / 48));

        // Enforce bounds
        newStartWeek = Math.max(1, Math.min(newStartWeek, 52));
        newDuration = Math.max(1, Math.min(newDuration, 52 - newStartWeek + 1));

        // Update State
        if (this.hasMoved && this.milestoneObj) {
            if (this.milestoneObj.startWeek !== newStartWeek || 
                this.milestoneObj.durationWeeks !== newDuration || 
                this.milestoneObj.rowIndex !== newRowIndex) {
                
                State.updateMilestone(this.milestoneObj.id, {
                    startWeek: newStartWeek,
                    durationWeeks: newDuration,
                    rowIndex: newRowIndex
                });
            } else {
                // If it snapped back to original, re-render to clear temporary inline styles
                Timeline.renderMilestones();
            }
        }

        // Cleanup
        document.querySelectorAll('.timeline-row').forEach(r => r.classList.remove('drag-over'));
        this.activeEl.classList.remove('dragging');
        this.isDragging = false;
        this.isResizing = false;
        this.activeEl = null;
        this.milestoneObj = null;
    }
};
