/**
 * Timeline rendering and logic
 */

const Timeline = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weeksInMonth: 4, // Simplified to 4 weeks per month 12*4 = 48? The prompt says "(W1, W2, W3, W4) under each month - assume 4 weeks per month for simplicity (52 total columns)". 
    // Wait, 12 * 4 = 48. Let's make it 52 columns total as requested, so the last month has an extra few weeks if needed, or we just render 52 weeks across the year.
    // The prompt says "assume 4 weeks per month for simplicity (52 total columns)", which is technically contradictory (12*4 = 48). 
    // Let's stick to 52 grid columns, and distribute them logically across months. 
    // 52 / 12 = 4.33. 
    // We'll just render 12 months in the header, and 52 weeks in the row below it.
    
    init() {
        this.renderHeaders();
        this.renderGrid();
        
        // Ensure to re-render when state changes
        State.subscribe(() => {
            this.renderMilestones();
            this.updateCurrentWeekIndicator();
            this.updateCurrentYearDisplay();
        });
    },

    updateCurrentYearDisplay() {
        document.getElementById('current-year-display').textContent = State.currentYear;
    },

    renderHeaders() {
        const headerContainer = document.getElementById('timeline-header');
        headerContainer.innerHTML = ''; // Clear previous

        // Quarters Row
        const quartersRow = document.createElement('div');
        quartersRow.className = 'header-row quarters';
        for (let i = 1; i <= 4; i++) {
            const el = document.createElement('div');
            el.className = 'header-cell';
            el.textContent = `Q${i}`;
            quartersRow.appendChild(el);
        }
        headerContainer.appendChild(quartersRow);

        // Months Row
        const monthsRow = document.createElement('div');
        monthsRow.className = 'header-row months';
        this.months.forEach(month => {
            const el = document.createElement('div');
            el.className = 'header-cell';
            el.textContent = month;
            monthsRow.appendChild(el);
        });
        headerContainer.appendChild(monthsRow);

        // Weeks Row - 52 columns
        const weeksRow = document.createElement('div');
        weeksRow.className = 'header-row weeks';
        for (let i = 1; i <= 52; i++) {
            const el = document.createElement('div');
            el.className = 'header-cell';
            // Determine W1, W2, W3, W4 or W5
            const weekInMonth = ((i - 1) % 4) + 1; 
            el.textContent = `W${weekInMonth}`;
            el.title = `Week ${i}`;
            weeksRow.appendChild(el);
        }
        headerContainer.appendChild(weeksRow);
    },

    renderGrid() {
        // We just need 52 background grid lines.
        // Handled completely by CSS linear-gradient now!
    },

    updateCurrentWeekIndicator() {
        const indicator = document.getElementById('current-week-indicator');
        if (State.currentYear === Utils.getCurrentYear()) {
            const currentWeek = Utils.getCurrentWeek();
            // Position based on percentage
            const pct = ((currentWeek - 1) / 52) * 100;
            indicator.style.left = `${pct}%`;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    },

    /**
     * Algorithm to assign each milestone to a row such that they don't overlap
     */
    assignRows(milestones) {
        // Find maximum explicit row index
        let maxExplicitRow = -1;
        milestones.forEach(m => {
            if (m.rowIndex !== undefined) {
                maxExplicitRow = Math.max(maxExplicitRow, m.rowIndex);
            }
        });

        // Initialize rows array with endWeeks up to maxExplicitRow
        const rows = new Array(Math.max(0, maxExplicitRow + 1)).fill(0);
        
        // Pre-fill rows with explicit assignments to block out that space
        milestones.forEach(m => {
            if (m.rowIndex !== undefined) {
                rows[m.rowIndex] = Math.max(rows[m.rowIndex] || 0, m.startWeek + m.durationWeeks);
            }
        });
        
        // Sort remaining (unassigned) by start week
        const unassigned = [...milestones].filter(m => m.rowIndex === undefined).sort((a, b) => a.startWeek - b.startWeek);
        
        unassigned.forEach(m => {
            let placed = false;
            // First try to find an existing row where it fits
            for (let i = 0; i < rows.length; i++) {
                if (m.startWeek > rows[i]) {
                    m._autoRowIndex = i;
                    rows[i] = m.startWeek + m.durationWeeks;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                // Add new row
                m._autoRowIndex = rows.length;
                rows.push(m.startWeek + m.durationWeeks);
            }
        });

        return Math.max(rows.length, 5); // At least 5 rows for visual padding
    },

    renderMilestones() {
        const milestones = State.getMilestonesForCurrentYear();
        const numRows = this.assignRows(milestones);
        
        const layer = document.getElementById('milestones-layer');
        layer.innerHTML = '';

        // Create the background striped rows for visual reference
        const swimlane = document.getElementById('swimlane-container');
        // Clear old background rows
        Array.from(swimlane.querySelectorAll('.timeline-row')).forEach(e => e.remove());
        
        for (let i = 0; i < numRows + 1; i++) { // +1 extra padding row
            const r = document.createElement('div');
            r.className = 'timeline-row';
            swimlane.appendChild(r);
        }

        // Now render the milestones on the absolute layer
        milestones.forEach(m => {
            const rowHeight = 48; // from CSS --row-height
            
            const el = document.createElement('div');
            el.className = `milestone ${m.status === 'completed' ? 'status-completed' : ''}`;
            el.id = `milestone-${m.id}`;
            el.dataset.id = m.id;
            
            // Calculate Position
            const leftPct = ((m.startWeek - 1) / 52) * 100;
            const widthPct = (m.durationWeeks / 52) * 100;
            const activeRowIndex = m.rowIndex !== undefined ? m.rowIndex : m._autoRowIndex;
            const topPx = activeRowIndex * rowHeight;

            el.style.left = `${leftPct}%`;
            el.style.width = `${widthPct}%`;
            el.style.top = `${topPx}px`;
            el.style.backgroundColor = getActivityColor(m.activityType);
            
            // Inner text
            el.textContent = m.name;

            // Add resize handles
            const leftHandle = document.createElement('div');
            leftHandle.className = 'resize-handle left';
            leftHandle.dataset.edge = 'left';
            
            const rightHandle = document.createElement('div');
            rightHandle.className = 'resize-handle right';
            rightHandle.dataset.edge = 'right';

            el.appendChild(leftHandle);
            el.appendChild(rightHandle);

            // Events attached in Drag/App
            layer.appendChild(el);
        });
    }
};
