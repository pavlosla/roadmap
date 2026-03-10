/**
 * UI Interactions (Modals, Tooltips, Buttons)
 */

const UI = {
    modal: document.getElementById('milestone-modal'),
    form: document.getElementById('milestone-form'),
    tooltip: document.getElementById('milestone-tooltip'),
    deleteBtn: document.getElementById('btn-delete-milestone'),
    
    // State trackers
    tooltipTimeout: null,
    activeMemoMilestoneId: null,

    init() {
        this.populateActivityTypes();
        this.populateLegend();
        this.initClients();
        this.initTheme();
        this.initLegendVisibility();
        this.bindEvents();
    },

    populateActivityTypes() {
        const select = document.getElementById('milestone-type');
        select.innerHTML = '';
        State.activityTypes.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type.name; // Use name as value to keep backward compatible
            opt.textContent = type.name;
            select.appendChild(opt);
        });
    },

    populateLegend() {
        const legendItems = document.getElementById('legend-items');
        legendItems.innerHTML = '';
        State.activityTypes.forEach(type => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = type.color;
            
            const label = document.createElement('span');
            label.textContent = type.name;
            
            item.appendChild(colorBox);
            item.appendChild(label);
            legendItems.appendChild(item);
        });
    },

    initTheme() {
        const isDark = localStorage.getItem('ea_roadmap_dark_theme') === 'true';
        if (isDark) {
            document.body.classList.add('dark-theme');
        }
    },

    initClients() {
        this.populateClients();
        
        // Listen to state changes to update client dropdown if another view adds one
        State.subscribe(() => {
            if (document.getElementById('client-select').value !== State.activeClientId) {
                this.populateClients();
            }
        });
    },

    populateClients() {
        const select = document.getElementById('client-select');
        select.innerHTML = '';
        State.clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
        select.value = State.activeClientId;
    },

    initLegendVisibility() {
        const isHidden = localStorage.getItem('ea_roadmap_legend_hidden') === 'true';
        const legend = document.getElementById('legend-container');
        if (isHidden) {
            legend.classList.add('hidden');
        } else {
            legend.classList.remove('hidden');
        }
    },

    bindEvents() {
        // Year Navigation
        document.getElementById('prev-year').addEventListener('click', () => {
            State.setYear(State.currentYear - 1);
        });
        document.getElementById('next-year').addEventListener('click', () => {
            State.setYear(State.currentYear + 1);
        });

        // Add Milestone Button
        document.getElementById('btn-add-milestone').addEventListener('click', () => {
            this.openModal();
        });

        // Theme and Legend Toggles
        document.getElementById('btn-toggle-theme').addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('ea_roadmap_dark_theme', isDark);
        });

        const legend = document.getElementById('legend-container');
        document.getElementById('btn-toggle-legend').addEventListener('click', () => {
            legend.classList.toggle('hidden');
            localStorage.setItem('ea_roadmap_legend_hidden', legend.classList.contains('hidden'));
        });
        document.getElementById('btn-close-legend').addEventListener('click', () => {
            legend.classList.add('hidden');
            localStorage.setItem('ea_roadmap_legend_hidden', 'true');
        });

        // Client Controls
        document.getElementById('client-select').addEventListener('change', (e) => {
            State.setClient(e.target.value);
        });
        document.getElementById('btn-add-client').addEventListener('click', () => {
            const name = prompt('Enter new client name:');
            if (name && name.trim()) {
                State.addClient(name.trim());
            }
        });
        document.getElementById('btn-edit-client').addEventListener('click', () => {
            const currentName = State.clients.find(c => c.id === State.activeClientId)?.name || '';
            const newName = prompt('Rename client:', currentName);
            if (newName && newName.trim()) {
                State.renameClient(State.activeClientId, newName.trim());
            }
        });

        // Modal Controls
        document.querySelector('.close-modal-btn').addEventListener('click', () => this.closeModal());
        document.querySelector('.cancel-modal-btn').addEventListener('click', () => this.closeModal());
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.deleteBtn.addEventListener('click', this.handleDelete.bind(this));

        // Edit Legend Controls
        const editLegendModal = document.getElementById('edit-legend-modal');
        document.getElementById('btn-edit-legend').addEventListener('click', () => this.openEditLegendModal());
        document.querySelector('.close-legend-modal-btn').addEventListener('click', () => editLegendModal.classList.remove('active'));
        document.querySelector('.cancel-legend-modal-btn').addEventListener('click', () => editLegendModal.classList.remove('active'));
        document.getElementById('btn-add-legend-entry').addEventListener('click', () => this.addEditLegendRow());
        document.getElementById('btn-save-legend').addEventListener('click', () => this.saveEditLegend());

        // Click outside modal to close
        this.modal.addEventListener('mousedown', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        editLegendModal.addEventListener('mousedown', (e) => {
            if (e.target === editLegendModal) editLegendModal.classList.remove('active');
        });

        // Data Management Buttons
        document.getElementById('btn-export-menu').addEventListener('click', () => {
            document.getElementById('export-dropdown').classList.toggle('show');
        });
        document.getElementById('btn-export-json').addEventListener('click', () => {
            this.exportJSON();
            document.getElementById('export-dropdown').classList.remove('show');
        });
        document.getElementById('btn-export-csv').addEventListener('click', () => {
            this.exportCSV();
            document.getElementById('export-dropdown').classList.remove('show');
        });
        
        // Close dropdown if clicked outside
        window.addEventListener('click', (event) => {
            if (!event.target.matches('#btn-export-menu')) {
                const dropdowns = document.getElementsByClassName("dropdown");
                for (let i = 0; i < dropdowns.length; i++) {
                    const openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        });

        
        // Import Data
        const importBtn = document.getElementById('btn-import');
        const fileInput = document.getElementById('import-file');
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.importData.bind(this));

        // Timeline Interactions (Tooltips and Double Click Edit)
        const swimlane = document.getElementById('swimlane-container');
        swimlane.addEventListener('dblclick', (e) => {
            const milestoneEl = e.target.closest('.milestone');
            if (milestoneEl && !e.target.classList.contains('resize-handle')) {
                const id = milestoneEl.dataset.id;
                const m = State.milestones.find(x => x.id === id);
                if (m) this.openModal(m);
            } else if (e.target === swimlane || e.target.classList.contains('timeline-row') || e.target.classList.contains('milestones-layer')) {
                // Clicked on empty grid space, calculate specific week and row
                const rect = swimlane.getBoundingClientRect();
                const mouseX = e.clientX - rect.left + swimlane.scrollLeft;
                const mouseY = e.clientY - rect.top + swimlane.scrollTop;
                
                const pixelsPerWeek = swimlane.clientWidth / 52;
                let clickedWeek = Math.floor(mouseX / pixelsPerWeek) + 1;
                clickedWeek = Math.max(1, Math.min(clickedWeek, 52));
                
                // Allow row assignment too
                const clickedRowIndex = Math.floor(mouseY / 48); // 48 is row height
                
                this.openModal(null, clickedWeek, clickedRowIndex);
            }
        });

        swimlane.addEventListener('click', (e) => {
            // If click inside tooltip memo input or button, ignore
            if (e.target.closest('#milestone-tooltip')) return;

            // Check if clicking a milestone, ignoring resize handles
            const milestoneEl = e.target.closest('.milestone');
            if (milestoneEl && !e.target.classList.contains('resize-handle')) {
                // If it was just dragged, don't trigger
                if (Drag.hasMoved) return; 
                const id = milestoneEl.dataset.id;
                const m = State.milestones.find(x => x.id === id);
                if (m) {
                    // Show tooltip permanently until clicked away
                    this.activeMemoMilestoneId = m.id;
                    this.showTooltip(m, e, true); 
                }
            } else {
                // Clicked away
                if (this.activeMemoMilestoneId) {
                    this.activeMemoMilestoneId = null;
                    this.hideTooltip();
                }
            }
        });

        // Tooltip interaction handling inside the absolute container
        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'btn-add-inline-memo') {
                const input = document.getElementById('new-inline-memo');
                if (input && input.value.trim() && this.activeMemoMilestoneId) {
                    State.addMemo(this.activeMemoMilestoneId, input.value.trim());
                    // re-render the tooltip
                    const m = State.milestones.find(x => x.id === this.activeMemoMilestoneId);
                    if (m) {
                        // find its coordinates to redraw
                        const el = document.getElementById(`milestone-${m.id}`);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            this.showTooltip(m, { clientX: rect.left, clientY: rect.top }, true);
                        }
                    }
                }
            }
        });

        swimlane.addEventListener('mouseover', this.handleMouseOver.bind(this));
        swimlane.addEventListener('mouseout', this.handleMouseOut.bind(this));
        swimlane.addEventListener('mousemove', this.handleMouseMove.bind(this));
    },

    // --- Modal Logic ---

    openModal(milestone = null, defaultWeek = null, defaultRowIndex = null) {
        document.getElementById('modal-title').textContent = milestone ? 'Edit Milestone' : 'Add Milestone';
        
        // Store explicit row index globally on module for new items if we want to save it
        this._pendingRowIndex = defaultRowIndex;
        
        if (milestone) {
            document.getElementById('milestone-id').value = milestone.id;
            document.getElementById('milestone-year').value = milestone.year;
            document.getElementById('milestone-name').value = milestone.name;
            document.getElementById('milestone-type').value = milestone.activityType;
            document.getElementById('milestone-status').value = milestone.status;
            document.getElementById('milestone-start').value = milestone.startWeek;
            document.getElementById('milestone-duration').value = milestone.durationWeeks;
            document.getElementById('milestone-desc').value = milestone.description || '';
            
            this.deleteBtn.classList.remove('hidden');
        } else {
            this.form.reset();
            document.getElementById('milestone-id').value = '';
            // Default to current year view
            document.getElementById('milestone-year').value = State.currentYear;
            // Default start week to clicked week or roughly middle
            const currentWeek = Utils.getCurrentWeek();
            document.getElementById('milestone-start').value = defaultWeek || (State.currentYear === Utils.getCurrentYear() ? currentWeek : 1);
            document.getElementById('milestone-duration').value = 4;
            document.getElementById('milestone-status').value = 'planned';
            
            this.deleteBtn.classList.add('hidden');
        }

        this.modal.classList.add('active');
        document.getElementById('milestone-name').focus();
    },

    closeModal() {
        this.modal.classList.remove('active');
        this.form.reset();
    },

    handleFormSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('milestone-id').value;
        const milestoneData = {
            name: document.getElementById('milestone-name').value.trim(),
            activityType: document.getElementById('milestone-type').value,
            status: document.getElementById('milestone-status').value,
            startWeek: parseInt(document.getElementById('milestone-start').value, 10),
            durationWeeks: parseInt(document.getElementById('milestone-duration').value, 10),
            description: document.getElementById('milestone-desc').value.trim()
        };

        if (id) {
            // Update
            State.updateMilestone(id, milestoneData);
        } else {
            // Create
            milestoneData.id = Utils.generateId();
            milestoneData.year = parseInt(document.getElementById('milestone-year').value, 10);
            if (this._pendingRowIndex !== null && this._pendingRowIndex !== undefined) {
                milestoneData.rowIndex = this._pendingRowIndex;
            }
            State.addMilestone(milestoneData);
        }

        this.closeModal();
    },

    handleDelete() {
        const id = document.getElementById('milestone-id').value;
        if (id && confirm('Are you sure you want to delete this milestone?')) {
            State.deleteMilestone(id);
            this.closeModal();
        }
    },

    // --- Edit Legend Logic ---
    openEditLegendModal() {
        const listContainer = document.getElementById('legend-edit-list');
        listContainer.innerHTML = '';
        
        State.activityTypes.forEach(type => {
            this.addEditLegendRow(type.id, type.name, type.color);
        });

        document.getElementById('edit-legend-modal').classList.add('active');
    },

    addEditLegendRow(id = Utils.generateId(), name = '', color = '#3b82f6') {
        const listContainer = document.getElementById('legend-edit-list');
        const row = document.createElement('div');
        row.className = 'legend-edit-row';
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';
        row.dataset.id = id;

        // Convert var(--color-x) to hex if needed (very basic handling for defaults)
        let hexColor = color;
        if (color.startsWith('var')) {
            // For older defaults that haven't been updated in state yet
            const varName = color.match(/var\((--.*?)\)/);
            if (varName && varName[1]) {
                hexColor = getComputedStyle(document.documentElement).getPropertyValue(varName[1]).trim() || '#3b82f6';
            }
        }

        row.innerHTML = `
            <input type="text" class="legend-name-input" value="${name}" placeholder="Category Name" style="flex-grow: 1;" required>
            <input type="color" class="legend-color-input" value="${hexColor}" style="width: 40px; height: 36px; padding: 2px; cursor: pointer;">
            <button type="button" class="danger-btn icon-btn btn-remove-legend" style="padding: 6px 10px;" title="Remove Category">
                &times;
            </button>
        `;

        row.querySelector('.btn-remove-legend').addEventListener('click', () => {
            row.remove();
        });

        listContainer.appendChild(row);
    },

    saveEditLegend() {
        const rows = document.querySelectorAll('.legend-edit-row');
        const newTypes = [];
        let hasError = false;

        rows.forEach(row => {
            const name = row.querySelector('.legend-name-input').value.trim();
            const color = row.querySelector('.legend-color-input').value;
            const id = row.dataset.id;
            
            if (!name) {
                hasError = true;
                row.querySelector('.legend-name-input').style.borderColor = 'var(--danger-color)';
            } else {
                row.querySelector('.legend-name-input').style.borderColor = '';
                newTypes.push({ id, name, color });
            }
        });

        if (hasError) {
            alert('Please provide a name for all activity categories.');
            return;
        }
        
        if (newTypes.length === 0) {
            alert('You must have at least one activity category.');
            return;
        }

        State.setActivityTypes(newTypes);
        this.populateActivityTypes();
        this.populateLegend();
        Timeline.renderMilestones(); // Re-render to update colors on timeline
        document.getElementById('edit-legend-modal').classList.remove('active');
    },

    // --- Tooltip & Memo Logic ---

    handleMouseOver(e) {
        if (Drag.isDragging || Drag.isResizing || this.activeMemoMilestoneId) return;
        
        const milestoneEl = e.target.closest('.milestone');
        if (!milestoneEl || e.target.classList.contains('resize-handle')) return;

        const id = milestoneEl.dataset.id;
        const m = State.milestones.find(x => x.id === id);
        if (!m) return;

        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(() => {
            this.showTooltip(m, e);
        }, 300); // Small delay to prevent flicker
    },

    handleMouseMove(e) {
        if (this.tooltip.classList.contains('visible') && !this.activeMemoMilestoneId) {
            // Only follow mouse if not pinned via click
            this.positionTooltip(e.clientX, e.clientY);
        }

        const highlight = document.getElementById('cell-highlight');
        if (Drag.isDragging || Drag.isResizing) {
            highlight.classList.remove('active');
            return;
        }

        const swimlane = document.getElementById('swimlane-container');
        if (e.target === swimlane || e.target.classList.contains('timeline-row') || e.target.classList.contains('milestones-layer')) {
            const rect = swimlane.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + swimlane.scrollLeft;
            const mouseY = e.clientY - rect.top + swimlane.scrollTop;
            
            const pixelsPerWeek = swimlane.clientWidth / 52;
            let hoveredWeek = Math.floor(mouseX / pixelsPerWeek) + 1;
            hoveredWeek = Math.max(1, Math.min(hoveredWeek, 52));
            
            const hoveredRowIndex = Math.floor(mouseY / 48); // 48 is row height

            highlight.style.left = `${((hoveredWeek - 1) / 52) * 100}%`;
            highlight.style.width = `${(1 / 52) * 100}%`;
            highlight.style.top = `${hoveredRowIndex * 48}px`;
            highlight.classList.add('active');
        } else {
            highlight.classList.remove('active');
        }
    },

    handleMouseOut(e) {
        if (this.activeMemoMilestoneId) return; // don't hide if pinned

        clearTimeout(this.tooltipTimeout);
        this.hideTooltip();
        document.getElementById('cell-highlight').classList.remove('active');
    },

    showTooltip(m, e, isPinned = false) {
        const color = getActivityColor(m.activityType);
        
        // Memo HTML Generation
        let memoHtml = '';
        if (isPinned) {
            const memoItems = (m.memos || []).map(memo => {
                const date = new Date(memo.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                return `
                    <div style="background: var(--bg-color); padding: 8px; border-radius: 4px; margin-bottom: 8px; border: 1px solid var(--border-color);">
                        <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 4px;">${date}</div>
                        <div style="white-space: pre-wrap;">${memo.text}</div>
                    </div>
                `;
            }).join('');

            memoHtml = `
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 12px 0;">
                <div style="font-weight: 600; margin-bottom: 8px;">Memos</div>
                <div style="max-height: 150px; overflow-y: auto; margin-bottom: 8px; font-size: 12px;">
                    ${memoItems || '<div style="color: var(--text-muted); margin-bottom: 8px;">No comments yet.</div>'}
                </div>
                <div style="display: flex; gap: 4px; align-items: stretch;">
                    <input type="text" id="new-inline-memo" placeholder="Add a comment..." style="flex-grow: 1; min-width: 0; padding: 6px 8px;">
                    <button id="btn-add-inline-memo" class="primary-btn" style="padding: 6px 10px;">Add</button>
                </div>
            `;
        }

        // Adjust Tooltip width based on pinned state
        this.tooltip.style.width = isPinned ? '300px' : 'auto';
        this.tooltip.style.pointerEvents = isPinned ? 'auto' : 'none'; // allow clicking inside if pinned

        this.tooltip.innerHTML = `
            <div class="tooltip-header">${m.name}</div>
            <div class="tooltip-type" style="background-color: ${color}">${m.activityType}</div>
            <div class="tooltip-detail"><span>Status:</span> <span style="text-transform: capitalize;">${m.status}</span></div>
            <div class="tooltip-detail"><span>Date:</span> ${Utils.formatDateRange(m.startWeek, m.startWeek + m.durationWeeks - 1, m.year)}</div>
            <div class="tooltip-detail"><span>Duration:</span> ${m.durationWeeks} week(s)</div>
            ${m.description ? `<div class="tooltip-detail" style="margin-top: 8px;">${m.description}</div>` : ''}
            ${memoHtml}
        `;
        
        this.tooltip.classList.add('visible');
        if (!isPinned || !this.tooltip.style.left) {
            this.positionTooltip(e.clientX, e.clientY);
        }
    },

    positionTooltip(x, y) {
        const padding = 15;
        let pX = x + padding;
        let pY = y + padding;

        this.tooltip.style.left = `${pX}px`;
        this.tooltip.style.top = `${pY}px`;

        // Check overflow
        if (Utils.isElementOutViewport(this.tooltip)) {
            const rect = this.tooltip.getBoundingClientRect();
            // Try flipping
            if (pX + rect.width > window.innerWidth) pX = x - rect.width - padding;
            if (pY + rect.height > window.innerHeight) pY = y - rect.height - padding;
            
            this.tooltip.style.left = `${pX}px`;
            this.tooltip.style.top = `${pY}px`;
        }
    },

    hideTooltip() {
        this.tooltip.classList.remove('visible');
    },

    // --- Data Management ---

    exportJSON() {
        const dataStr = JSON.stringify(State.milestones, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `ea-roadmap-${State.currentYear}.json`;
        
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        linkElement.remove();
    },

    importData(e) {
        if (!e.target.files.length) return;
        
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (State.importData(json)) {
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid file format.');
                }
            } catch (err) {
                alert('Error parsing JSON file.');
            }
            // Reset input
            document.getElementById('import-file').value = '';
        };
        
        reader.readAsText(file);
    },


    exportCSV() {
        const data = State.milestones;
        if (!data || data.length === 0) {
            alert("No data to export");
            return;
        }

        const headers = ["ID", "Name", "Activity Type", "Status", "Start Week", "Duration (Weeks)", "Year", "Client ID", "Description"];
        const rows = [headers.join(",")];

        data.forEach(m => {
            const row = [
                m.id || "",
                `"${(m.name || "").replace(/"/g, '""')}"`,
                `"${(m.activityType || "").replace(/"/g, '""')}"`,
                m.status || "",
                m.startWeek || "",
                m.durationWeeks || "",
                m.year || "",
                m.clientId || "",
                `"${(m.description || "").replace(/"/g, '""')}"`
            ];
            rows.push(row.join(","));
        });

        const csvContent = rows.join("\\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', url);
        linkElement.setAttribute('download', `ea-roadmap-${State.currentYear}.csv`);
        linkElement.style.visibility = 'hidden';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        URL.revokeObjectURL(url);
    }
};
