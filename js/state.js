/**
 * State Management and LocalStorage persistence
 */

const STORAGE_KEY = 'ea_roadmap_data';
const CLIENTS_STORAGE_KEY = 'ea_roadmap_clients';
const ACTIVE_CLIENT_KEY = 'ea_roadmap_active_client';
const ACTIVITY_TYPES_KEY = 'ea_roadmap_activity_types';
const PHASES_STORAGE_KEY = 'ea_roadmap_phases';
const PHASES_VISIBLE_KEY = 'ea_roadmap_phases_visible';

const defaultPhases = [
    { id: 'discover', name: 'Discover', startWeek: 1,  endWeek: 4,  color: '#6366f1' },
    { id: 'prepare',  name: 'Prepare',  startWeek: 5,  endWeek: 10, color: '#0ea5e9' },
    { id: 'explore',  name: 'Explore',  startWeek: 11, endWeek: 18, color: '#14b8a6' },
    { id: 'realize',  name: 'Realize',  startWeek: 19, endWeek: 35, color: '#f97316' },
    { id: 'deploy',   name: 'Deploy',   startWeek: 36, endWeek: 46, color: '#ec4899' },
    { id: 'run',      name: 'Run',      startWeek: 47, endWeek: 52, color: '#22c55e' }
];

const defaultActivityTypes = [
    { id: Utils.generateId(), name: 'Discovery', color: '#3b82f6' },
    { id: Utils.generateId(), name: 'Assessment', color: '#8b5cf6' },
    { id: Utils.generateId(), name: 'Design', color: '#14b8a6' },
    { id: Utils.generateId(), name: 'Implementation', color: '#f97316' },
    { id: Utils.generateId(), name: 'Review', color: '#eab308' },
    { id: Utils.generateId(), name: 'Delivery', color: '#22c55e' },
    { id: Utils.generateId(), name: 'Workshop', color: '#ec4899' },
    { id: Utils.generateId(), name: 'Documentation', color: '#6b7280' }
];

const sampleMilestones = [
    {
      id: "1",
      name: "Current State Assessment",
      activityType: "Assessment",
      startWeek: 2,
      durationWeeks: 4,
      year: new Date().getFullYear(),
      status: "completed",
      description: "Evaluate existing architecture and systems"
    },
    {
      id: "2",
      name: "Stakeholder Workshops",
      activityType: "Workshop",
      startWeek: 5,
      durationWeeks: 2,
      year: new Date().getFullYear(),
      status: "completed",
      description: "Gather requirements from key stakeholders"
    },
    {
      id: "3",
      name: "Target Architecture Design",
      activityType: "Design",
      startWeek: 8,
      durationWeeks: 6,
      year: new Date().getFullYear(),
      status: "in-progress",
      description: "Design future state architecture"
    },
    {
      id: "4",
      name: "Implementation Roadmap",
      activityType: "Documentation",
      startWeek: 14,
      durationWeeks: 3,
      year: new Date().getFullYear(),
      status: "planned",
      description: "Create detailed implementation plan"
    },
    {
      id: "5",
      name: "Phase 1 Implementation",
      activityType: "Implementation",
      startWeek: 18,
      durationWeeks: 12,
      year: new Date().getFullYear(),
      status: "planned",
      description: "Execute first phase of architecture changes"
    }
];

class AppState {
    constructor() {
        this.currentYear = Utils.getCurrentYear();
        this.clients = [{ id: 'default', name: 'Default Client' }];
        this.activeClientId = 'default';
        this.activityTypes = [...defaultActivityTypes];
        this.milestones = [];
        this.phases = defaultPhases.map(p => ({ ...p }));
        this.phasesVisible = true;
        this.listeners = [];
        
        this.loadData();
    }

    // Subscribe to state changes
    subscribe(callback) {
        this.listeners.push(callback);
    }

    // Notify listeners of changes
    notify() {
        this.listeners.forEach(fn => fn(this));
    }

    // Load from LocalStorage
    loadData() {
        // Load Clients
        const storedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (storedClients) {
            try {
                this.clients = JSON.parse(storedClients);
            } catch(e) { console.error(e); }
        }
        
        const storedActiveClient = localStorage.getItem(ACTIVE_CLIENT_KEY);
        if (storedActiveClient && this.clients.some(c => c.id === storedActiveClient)) {
            this.activeClientId = storedActiveClient;
        }

        // Load Activity Types
        const storedActivityTypes = localStorage.getItem(ACTIVITY_TYPES_KEY);
        if (storedActivityTypes) {
            try {
                this.activityTypes = JSON.parse(storedActivityTypes);
            } catch(e) { console.error(e); }
        }

        // Load Phases
        const storedPhases = localStorage.getItem(PHASES_STORAGE_KEY);
        if (storedPhases) {
            try {
                this.phases = JSON.parse(storedPhases);
            } catch(e) { console.error(e); }
        }
        const storedPhasesVisible = localStorage.getItem(PHASES_VISIBLE_KEY);
        if (storedPhasesVisible !== null) {
            this.phasesVisible = storedPhasesVisible === 'true';
        }

        // Load Milestones
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.milestones = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse stored data", e);
                this.milestones = [...sampleMilestones];
            }
        } else {
            // First time load, use samples. Assign default client id to samples
            this.milestones = sampleMilestones.map(m => ({ ...m, clientId: 'default' }));
            this.saveData();
        }
    }

    // Save to LocalStorage
    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.milestones));
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(this.clients));
        localStorage.setItem(ACTIVE_CLIENT_KEY, this.activeClientId);
        localStorage.setItem(ACTIVITY_TYPES_KEY, JSON.stringify(this.activityTypes));
        localStorage.setItem(PHASES_STORAGE_KEY, JSON.stringify(this.phases));
        localStorage.setItem(PHASES_VISIBLE_KEY, this.phasesVisible);
    }

    // Phase Operations
    setPhases(phases) {
        this.phases = phases;
        this.saveData();
        this.notify();
    }

    setPhasesVisible(visible) {
        this.phasesVisible = visible;
        localStorage.setItem(PHASES_VISIBLE_KEY, visible);
        this.notify();
    }

    // Get milestones for current year
    // Get milestones for current year and client
    getMilestonesForCurrentYear() {
        return this.milestones.filter(m => m.year === this.currentYear && (m.clientId === this.activeClientId || (!m.clientId && this.activeClientId === 'default')));
    }

    // Set Year
    setYear(year) {
        this.currentYear = year;
        this.notify();
    }

    // Client Operations
    addClient(name) {
        const id = Utils.generateId();
        this.clients.push({ id, name });
        this.activeClientId = id;
        this.saveData();
        this.notify();
    }

    setClient(id) {
        if (this.clients.some(c => c.id === id)) {
            this.activeClientId = id;
            this.saveData();
            this.notify();
        }
    }

    renameClient(id, newName) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            this.clients[index].name = newName;
            this.saveData();
            this.notify();
        }
    }

    // Legend / Activity Types Operations
    setActivityTypes(types) {
        this.activityTypes = types;
        this.saveData();
        this.notify();
    }

    // Milestone Operations
    addMilestone(milestone) {
        this.milestones.push(milestone);
        this.saveData();
        this.notify();
    }

    updateMilestone(id, updates) {
        const index = this.milestones.findIndex(m => m.id === id);
        if (index !== -1) {
            this.milestones[index] = { ...this.milestones[index], ...updates };
            this.saveData();
            this.notify();
        }
    }

    // Memo Operations
    addMemo(milestoneId, text) {
        const index = this.milestones.findIndex(m => m.id === milestoneId);
        if (index !== -1) {
            const m = this.milestones[index];
            if (!m.memos) m.memos = [];
            m.memos.push({
                id: Utils.generateId(),
                text: text,
                date: new Date().toISOString()
            });
            this.saveData();
            this.notify();
        }
    }

    deleteMilestone(id) {
        this.milestones = this.milestones.filter(m => m.id !== id);
        this.saveData();
        this.notify();
    }

    // Replace all data (for import)
    importData(newData) {
        if (Array.isArray(newData)) {
            this.milestones = newData;
            this.saveData();
            this.notify();
            return true;
        }
        return false;
    }

    clearData() {
        this.milestones = [];
        this.saveData();
        this.notify();
    }
}

// Global instance
const State = new AppState();
