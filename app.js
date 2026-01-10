// FlowForge UX/UI Generator - Main Application
// Version: 1.0 - Optimized with Security and Performance Features

// ====================
// SECURE STORAGE CLASS
// ====================
class SecureStorage {
    constructor() {
        this.keyMaterial = null;
    }

    async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async encrypt(data, password) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);
        
        const enc = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            enc.encode(JSON.stringify(data))
        );

        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        return btoa(String.fromCharCode.apply(null, result));
    }

    async decrypt(encryptedData, password) {
        try {
            const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            const salt = data.slice(0, 16);
            const iv = data.slice(16, 28);
            const encrypted = data.slice(28);
            
            const key = await this.deriveKey(password, salt);
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );
            
            const dec = new TextDecoder();
            return JSON.parse(dec.decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    async saveSecure(key, value, password = 'flowforge-default-key') {
        try {
            const encrypted = await this.encrypt(value, password);
            localStorage.setItem(key, encrypted);
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }

    async loadSecure(key, password = 'flowforge-default-key') {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            return await this.decrypt(encrypted, password);
        } catch (error) {
            console.error('Load failed:', error);
            return null;
        }
    }
}

// ====================
// DATA COMPRESSOR CLASS
// ====================
class DataCompressor {
    static compress(data) {
        const str = JSON.stringify(data);
        return this.lzCompress(str);
    }

    static decompress(compressed) {
        try {
            const decompressed = this.lzDecompress(compressed);
            return JSON.parse(decompressed);
        } catch (error) {
            console.error('Decompression failed:', error);
            return null;
        }
    }

    static lzCompress(str) {
        if (!str) return '';
        let dict = {};
        let data = (str + '').split('');
        let out = [];
        let currChar;
        let phrase = data[0];
        let code = 256;
        
        for (let i = 1; i < data.length; i++) {
            currChar = data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            } else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase = currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        
        for (let i = 0; i < out.length; i++) {
            out[i] = String.fromCharCode(out[i]);
        }
        return out.join('');
    }

    static lzDecompress(str) {
        if (!str) return '';
        let dict = {};
        let data = (str + '').split('');
        let currChar = data[0];
        let oldPhrase = currChar;
        let out = [currChar];
        let code = 256;
        let phrase;
        
        for (let i = 1; i < data.length; i++) {
            let currCode = data[i].charCodeAt(0);
            if (currCode < 256) {
                phrase = data[i];
            } else {
                phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        return out.join('');
    }

    static saveCompressed(key, data) {
        try {
            const compressed = this.compress(data);
            localStorage.setItem(key, compressed);
            return true;
        } catch (error) {
            console.error('Save compressed failed:', error);
            return false;
        }
    }

    static loadCompressed(key) {
        try {
            const compressed = localStorage.getItem(key);
            if (!compressed) return null;
            return this.decompress(compressed);
        } catch (error) {
            console.error('Load compressed failed:', error);
            return null;
        }
    }
}

// ====================
// DOM CACHE CLASS
// ====================
class DOMCache {
    constructor() {
        this.cache = new Map();
        this.observer = null;
        this.initObserver();
    }

    initObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach(node => {
                        if (node.id) this.cache.delete('#' + node.id);
                        if (node.className) {
                            const classes = Array.from(node.classList || []);
                            classes.forEach(cls => this.cache.delete('.' + cls));
                        }
                    });
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    get(selector) {
        if (!this.cache.has(selector)) {
            const element = document.querySelector(selector);
            if (element) this.cache.set(selector, element);
        }
        return this.cache.get(selector);
    }

    getAll(selector) {
        return document.querySelectorAll(selector);
    }

    clear() {
        this.cache.clear();
    }

    invalidate(selector) {
        this.cache.delete(selector);
    }
}

// ====================
// PERFORMANCE UTILS
// ====================
class PerformanceUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static measurePerformance(name, callback) {
        const start = performance.now();
        const result = callback();
        const end = performance.now();
        console.log(`${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    static requestIdleCallback(callback) {
        if ('requestIdleCallback' in window) {
            return window.requestIdleCallback(callback);
        }
        return setTimeout(callback, 1);
    }
}

// ====================
// MAIN APPLICATION
// ====================
class FlowForgeApp {
    constructor() {
        this.secureStorage = new SecureStorage();
        this.domCache = new DOMCache();
        this.progressBar = new ProgressBar();
        this.tooltipManager = new TooltipManager();
        this.currentProject = null;
        this.currentTab = 'flows';
        this.editingItem = null;
        this.autoSaveTimeout = null;
        this.isDirty = false;
        
        this.flows = [];
        this.tokens = [];
        this.screens = [];
        this.history = [];
        
        // Undo/Redo system
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // Development phase managers
        this.htmlAnalyzer = null;
        this.structureGenerator = null;
        this.promptGenerator = null;
        this.developmentPhaseActive = false;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.initEventListeners();
        this.renderProjectsList();
        this.setupAutoSave();
        this.setupKeyboardShortcuts();
        this.updateUndoRedoButtons();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.currentProject || state.currentProjectId) {
                    // Call the global saveCurrentProject to capture field changes
                    if (typeof saveCurrentProject === 'function') {
                        saveCurrentProject();
                    } else {
                        this.saveData();
                        this.showNotification('Proyecto guardado', 'success', 'Atajo de teclado', 2000);
                    }
                }
            }

            // Ctrl/Cmd + Z: Undo
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }

            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                this.redo();
            }

            // Ctrl/Cmd + N: New project
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                const welcomeScreen = document.getElementById('welcomeScreen');
                if (welcomeScreen && welcomeScreen.style.display !== 'none') {
                    createNewProject();
                }
            }

            // Ctrl/Cmd + E: Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (this.currentProject) {
                    this.exportData();
                }
            }

            // Ctrl/Cmd + K: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const search = this.domCache.get('#projectSearch');
                if (search) search.focus();
            }

            // Ctrl/Cmd + T: Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                toggleTheme();
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal-overlay[style*="flex"]');
                modals.forEach(modal => modal.style.display = 'none');
                
                const openModals = document.querySelectorAll('.modal[style*="flex"]');
                openModals.forEach(modal => modal.style.display = 'none');
                
                // Also clear search on Escape
                const tabSearch = document.getElementById('tabSearch');
                if (tabSearch === document.activeElement) {
                    tabSearch.blur();
                    this.clearSearch();
                }
            }

            // / : Focus search (like modern apps)
            if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    const tabSearch = document.getElementById('tabSearch');
                    if (tabSearch) tabSearch.focus();
                }
            }

            // Ctrl/Cmd + ?: Show shortcuts help
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }

            // Alt + 1-4: Switch tabs
            if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                const tabs = ['flows', 'tokens', 'metrics', 'architecture'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabs[tabIndex]) {
                    this.switchTab(tabs[tabIndex]);
                }
            }
        });
    }

    showKeyboardShortcuts() {
        const shortcuts = [
            { keys: 'Ctrl/Cmd + S', action: 'Guardar proyecto' },
            { keys: 'Ctrl/Cmd + Z', action: 'Deshacer cambio' },
            { keys: 'Ctrl/Cmd + Y', action: 'Rehacer cambio' },
            { keys: 'Ctrl/Cmd + N', action: 'Nuevo proyecto' },
            { keys: 'Ctrl/Cmd + E', action: 'Exportar datos' },
            { keys: 'Ctrl/Cmd + K', action: 'Buscar proyectos' },
            { keys: '/', action: 'Buscar en vista actual' },
            { keys: 'Ctrl/Cmd + T', action: 'Cambiar tema' },
            { keys: 'Escape', action: 'Cerrar modales/búsqueda' },
            { keys: 'Alt + 1-4', action: 'Cambiar entre tabs' },
            { keys: 'Ctrl/Cmd + Shift + ?', action: 'Ver atajos' }
        ];

        const content = `
            <div style="padding: 20px;">
                <h3 style="margin-bottom: 16px; font-size: 1.1rem;">⌨️ Atajos de Teclado</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${shortcuts.map(s => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                            <kbd style="padding: 4px 8px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 0.85rem;">${s.keys}</kbd>
                            <span style="color: var(--text-secondary); font-size: 0.9rem;">${s.action}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Create temporary modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 10000; max-width: 500px; width: 90%;';
        modal.innerHTML = content;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999;';
        
        overlay.addEventListener('click', () => {
            overlay.remove();
            modal.remove();
        });

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        setTimeout(() => {
            overlay.addEventListener('click', () => {
                overlay.remove();
                modal.remove();
            });
        }, 100);
    }

    setupAutoSave() {
        // Auto-save every 30 seconds if there are changes
        setInterval(() => {
            if (this.isDirty && this.currentProject) {
                this.saveData();
                this.isDirty = false;
                console.log('⚡ Auto-guardado realizado');
            }
        }, 30000);

        // Save on visibility change (tab switch, window minimize)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isDirty) {
                this.saveData();
                this.isDirty = false;
            }
        });

        // Save before unload
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                this.saveData();
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    markDirty() {
        this.isDirty = true;
        
        // Visual indicator
        const saveBtn = this.domCache.get('#saveBtn');
        if (saveBtn && !saveBtn.classList.contains('pulsing')) {
            saveBtn.classList.add('pulsing');
            saveBtn.innerHTML = '💾 Guardar*';
        }
    }

    // ====================
    // UNDO/REDO SYSTEM
    // ====================
    
    captureState(actionType = 'edit') {
        const state = {
            timestamp: Date.now(),
            action: actionType,
            data: {
                flows: JSON.parse(JSON.stringify(this.flows)),
                tokens: JSON.parse(JSON.stringify(this.tokens)),
                screens: JSON.parse(JSON.stringify(this.screens)),
                currentProject: this.currentProject ? JSON.parse(JSON.stringify(this.currentProject)) : null
            }
        };
        
        this.undoStack.push(state);
        
        // Limit stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.undoStack.length === 0) {
            this.showNotification('No hay acciones para deshacer', 'warning', 'Undo', 2000);
            return;
        }
        
        // Save current state to redo stack
        const currentState = {
            timestamp: Date.now(),
            action: 'undo',
            data: {
                flows: JSON.parse(JSON.stringify(this.flows)),
                tokens: JSON.parse(JSON.stringify(this.tokens)),
                screens: JSON.parse(JSON.stringify(this.screens)),
                currentProject: this.currentProject ? JSON.parse(JSON.stringify(this.currentProject)) : null
            }
        };
        this.redoStack.push(currentState);
        
        // Restore previous state
        const previousState = this.undoStack.pop();
        this.restoreState(previousState);
        
        this.showNotification('Acción deshecha', 'success', 'Undo', 1500);
        this.updateUndoRedoButtons();
    }
    
    redo() {
        if (this.redoStack.length === 0) {
            this.showNotification('No hay acciones para rehacer', 'warning', 'Redo', 2000);
            return;
        }
        
        // Save current state to undo stack
        const currentState = {
            timestamp: Date.now(),
            action: 'redo',
            data: {
                flows: JSON.parse(JSON.stringify(this.flows)),
                tokens: JSON.parse(JSON.stringify(this.tokens)),
                screens: JSON.parse(JSON.stringify(this.screens)),
                currentProject: this.currentProject ? JSON.parse(JSON.stringify(this.currentProject)) : null
            }
        };
        this.undoStack.push(currentState);
        
        // Restore next state
        const nextState = this.redoStack.pop();
        this.restoreState(nextState);
        
        this.showNotification('Acción rehecha', 'success', 'Redo', 1500);
        this.updateUndoRedoButtons();
    }
    
    restoreState(state) {
        if (!state || !state.data) return;
        
        this.flows = JSON.parse(JSON.stringify(state.data.flows));
        this.tokens = JSON.parse(JSON.stringify(state.data.tokens));
        this.screens = JSON.parse(JSON.stringify(state.data.screens));
        this.currentProject = state.data.currentProject ? JSON.parse(JSON.stringify(state.data.currentProject)) : null;
        
        // Re-render current view
        this.renderCurrentTab();
        this.markDirty();
    }
    
    updateUndoRedoButtons() {
        const undoBtn = this.domCache.get('#undoBtn');
        const redoBtn = this.domCache.get('#redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
            undoBtn.title = this.undoStack.length > 0 
                ? `Deshacer: ${this.undoStack[this.undoStack.length - 1].action} (Ctrl+Z)` 
                : 'No hay acciones para deshacer';
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.title = this.redoStack.length > 0 
                ? `Rehacer: ${this.redoStack[this.redoStack.length - 1].action} (Ctrl+Y)` 
                : 'No hay acciones para rehacer';
        }
    }
    
    renderCurrentTab() {
        // Inject action bar if not present
        this.injectActionsBar();
        
        switch(this.currentTab) {
            case 'flows':
                this.renderFlows();
                break;
            case 'tokens':
                this.renderTokens();
                break;
            case 'screens':
                this.renderScreens();
                break;
            case 'metrics':
                this.renderMetrics();
                break;
        }
    }
    
    injectActionsBar() {
        const mainTabs = document.getElementById('mainTabs');
        if (!mainTabs || document.getElementById('tab-actions-bar')) return;
        
        const tabsHeader = mainTabs.querySelector('.tabs-header');
        if (!tabsHeader) return;
        
        const actionsBar = document.createElement('div');
        actionsBar.id = 'tab-actions-bar';
        actionsBar.className = 'tab-actions-bar';
        actionsBar.innerHTML = `
            <button id="templates-btn" class="action-btn templates-btn" data-tooltip="Usar plantillas pre-diseñadas">
                📋 Plantillas
            </button>
            <button id="import-data" class="action-btn import-btn" data-tooltip="Importar proyecto desde JSON">
                📥 Importar
            </button>
            <button id="export-data" class="action-btn export-btn" data-tooltip="Exportar proyecto">
                📤 Exportar
            </button>
            <button onclick="runValidation()" class="action-btn" data-tooltip="Validar proyecto" style="border-color: var(--success); color: var(--success);">
                ✅ Validar
            </button>
            <button id="clear-data" class="action-btn danger-btn" data-tooltip="Borrar todos los datos">
                🗑️ Limpiar Todo
            </button>
        `;
        
        tabsHeader.after(actionsBar);
    }

    initEventListeners() {
        // Welcome screen
        const startBtn = this.domCache.get('#start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.showMainApp());
        }

        // Project form
        const projectForm = this.domCache.get('#project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleProjectSubmit(e));
        }

        // Tabs
        const tabBtns = this.domCache.getAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Search functionality
        this.initSearchBar();

        // Drag & Drop for file import
        this.initDragAndDrop();

        // Add buttons
        this.setupButton('#add-flow-btn', () => this.showFlowModal());
        this.setupButton('#add-token-btn', () => this.showTokenModal());
        this.setupButton('#add-screen-btn', () => this.showScreenModal());

        // Header buttons
        this.setupButton('#history-btn', () => this.showHistoryModal());
        this.setupButton('#templates-btn', () => this.showTemplatesModal());
        this.setupButton('#settings-btn', () => this.showSettingsModal());

        // Modal forms
        this.setupModalForm('#flow-form', (data) => this.saveFlow(data));
        this.setupModalForm('#token-form', (data) => this.saveToken(data));
        this.setupModalForm('#screen-form', (data) => this.saveScreen(data));

        // Modal close buttons
        const closeButtons = this.domCache.getAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                this.closeModal(modalId);
            });
        });

        // Settings
        this.setupButton('#save-api-key', () => this.saveAPIKey());
        this.setupButton('#export-data', () => this.exportData());
        this.setupButton('#import-data', () => this.importData());
        this.setupButton('#templates-btn', () => this.showTemplatesModal());
        this.setupButton('#clear-data', () => this.clearAllData());

        // Search
        const searchInput = this.domCache.get('#project-search');
        if (searchInput) {
            searchInput.addEventListener('input', PerformanceUtils.debounce((e) => {
                this.searchProjects(e.target.value);
            }, 300));
        }

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    setupButton(selector, handler) {
        const btn = this.domCache.get(selector);
        if (btn) {
            btn.addEventListener('click', handler);
        }
    }

    setupModalForm(formSelector, handler) {
        const form = this.domCache.get(formSelector);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                handler(data);
                form.reset();
            });
        }
    }

    showMainApp() {
        const welcomeScreen = this.domCache.get('#welcome-screen');
        const appContainer = this.domCache.get('#app-container');
        
        if (welcomeScreen) {
            welcomeScreen.style.opacity = '0';
            setTimeout(() => {
                welcomeScreen.style.display = 'none';
                if (appContainer) {
                    appContainer.classList.remove('app-hidden');
                    appContainer.style.opacity = '0';
                    requestAnimationFrame(() => {
                        appContainer.style.opacity = '1';
                    });
                }
            }, 500);
        }
    }

    handleProjectSubmit(e) {
        e.preventDefault();
        
        const name = this.domCache.get('#project-name')?.value;
        const description = this.domCache.get('#project-description')?.value;
        const category = this.domCache.get('#project-category')?.value;
        const platform = this.domCache.get('#project-platform')?.value;

        if (!name) {
            alert('Por favor ingresa un nombre para el proyecto');
            return;
        }

        this.currentProject = {
            id: Date.now(),
            name,
            description,
            category,
            platform,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.flows = [];
        this.tokens = [];
        this.screens = [];

        this.saveData();
        this.addToHistory(this.currentProject);
        this.showNotification('Proyecto creado exitosamente');

        // Clear form
        const form = this.domCache.get('#project-form');
        if (form) form.reset();

        // Show tabs
        const tabsNav = this.domCache.get('#tabs-nav');
        if (tabsNav) tabsNav.style.display = 'flex';

        this.renderCurrentTab();
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        const tabBtns = this.domCache.getAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        const tabContents = this.domCache.getAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        // Clear search when switching tabs
        this.clearSearch();
        
        // Initialize development phase if switching to development tab
        if (tabName === 'development' && !this.developmentPhaseActive) {
            this.initDevelopmentPhase();
        }
        
        this.renderCurrentTab();
    }

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'flows':
                this.renderFlows();
                break;
            case 'tokens':
                this.renderTokens();
                break;
            case 'metrics':
                this.renderMetrics();
                break;
            case 'architecture':
                this.renderArchitecture();
                break;
            case 'development':
                // Development tab rendering is handled by upload handlers
                break;
        }
    }

    // Flow methods
    showFlowModal(flow = null) {
        this.editingItem = flow;
        const modal = this.domCache.get('#flow-modal');
        const title = this.domCache.get('#flow-modal-title');
        
        if (flow) {
            if (title) title.textContent = 'Editar Flujo';
            this.domCache.get('#flow-name').value = flow.name || '';
            this.domCache.get('#flow-description').value = flow.description || '';
            this.domCache.get('#flow-steps').value = flow.steps?.join('\n') || '';
            
            const typeRadio = this.domCache.get(`input[name="flow-type"][value="${flow.type}"]`);
            if (typeRadio) typeRadio.checked = true;
        } else {
            if (title) title.textContent = 'Nuevo Flujo';
        }
        
        if (modal) modal.style.display = 'flex';
    }

    saveFlow(data) {
        this.captureState(this.editingItem ? 'edit-flow' : 'add-flow');
        
        const steps = data['flow-steps'] ? data['flow-steps'].split('\n').filter(s => s.trim()) : [];
        
        const flow = {
            id: this.editingItem?.id || Date.now(),
            name: data['flow-name'],
            description: data['flow-description'],
            type: data['flow-type'] || 'user',
            steps: steps,
            createdAt: this.editingItem?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingItem) {
            const index = this.flows.findIndex(f => f.id === this.editingItem.id);
            if (index !== -1) this.flows[index] = flow;
        } else {
            this.flows.push(flow);
        }

        this.markDirty();
        this.saveData();
        this.renderFlows();
        this.closeModal('flow-modal');
        this.showNotification('Flujo guardado', 'success', null, 3000);
        this.editingItem = null;
    }

    deleteFlow(id) {
        if (confirm('¿Estás seguro de eliminar este flujo?')) {
            this.captureState('delete-flow');
            this.flows = this.flows.filter(f => f.id !== id);
            this.saveData();
            this.renderFlows();
            this.showNotification('Flujo eliminado');
        }
    }

    renderFlows() {
        const container = this.domCache.get('#flows-container');
        if (!container) return;

        if (this.flows.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                        <path d="M32 20V44M20 32H44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>No hay flujos creados</p>
                    <button class="btn-primary" onclick="app.showFlowModal()">Crear Primer Flujo</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.flows.map(flow => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${this.escapeHtml(flow.name)}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="app.showFlowModal(app.flows.find(f => f.id === ${flow.id}))" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11 2L14 5L5 14H2V11L11 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="app.deleteFlow(${flow.id})" title="Eliminar">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4H13M5 4V3H11V4M6 7V11M10 7V11M4 4V13H12V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${flow.description ? `<p class="card-description">${this.escapeHtml(flow.description)}</p>` : ''}
                    <div class="card-meta">
                        <span class="badge badge-${flow.type}">${this.getFlowTypeLabel(flow.type)}</span>
                        <span class="card-meta-item">${flow.steps?.length || 0} pasos</span>
                    </div>
                    ${flow.steps && flow.steps.length > 0 ? `
                        <div class="flow-steps">
                            ${flow.steps.slice(0, 3).map((step, i) => `
                                <div class="flow-step">
                                    <span class="step-number">${i + 1}</span>
                                    <span class="step-text">${this.escapeHtml(step)}</span>
                                </div>
                            `).join('')}
                            ${flow.steps.length > 3 ? `<div class="flow-step-more">+${flow.steps.length - 3} más</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    getFlowTypeLabel(type) {
        const labels = {
            user: 'Usuario',
            task: 'Tarea',
            wireflow: 'Wireflow'
        };
        return labels[type] || type;
    }

    // Token methods
    showTokenModal(token = null) {
        this.editingItem = token;
        const modal = this.domCache.get('#token-modal');
        const title = this.domCache.get('#token-modal-title');
        
        if (token) {
            if (title) title.textContent = 'Editar Token';
            this.domCache.get('#token-name').value = token.name || '';
            this.domCache.get('#token-category').value = token.category || 'color';
            this.domCache.get('#token-value').value = token.value || '';
            this.domCache.get('#token-description').value = token.description || '';
        } else {
            if (title) title.textContent = 'Nuevo Design Token';
        }
        
        if (modal) modal.style.display = 'flex';
    }

    saveToken(data) {
        this.captureState(this.editingItem ? 'edit-token' : 'add-token');
        
        const token = {
            id: this.editingItem?.id || Date.now(),
            name: data['token-name'],
            category: data['token-category'],
            value: data['token-value'],
            description: data['token-description'],
            createdAt: this.editingItem?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingItem) {
            const index = this.tokens.findIndex(t => t.id === this.editingItem.id);
            if (index !== -1) this.tokens[index] = token;
        } else {
            this.tokens.push(token);
        }

        this.saveData();
        this.renderTokens();
        this.closeModal('token-modal');
        this.showNotification(this.editingItem ? 'Token actualizado' : 'Token creado');
        this.editingItem = null;
    }

    deleteToken(id) {
        if (confirm('¿Estás seguro de eliminar este token?')) {
            this.captureState('delete-token');
            this.tokens = this.tokens.filter(t => t.id !== id);
            this.saveData();
            this.renderTokens();
            this.showNotification('Token eliminado');
        }
    }

    renderTokens() {
        const container = this.domCache.get('#tokens-container');
        if (!container) return;

        if (this.tokens.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <rect x="12" y="12" width="18" height="18" stroke="currentColor" stroke-width="2" rx="2"/>
                        <rect x="34" y="12" width="18" height="18" stroke="currentColor" stroke-width="2" rx="2"/>
                        <rect x="12" y="34" width="18" height="18" stroke="currentColor" stroke-width="2" rx="2"/>
                        <rect x="34" y="34" width="18" height="18" stroke="currentColor" stroke-width="2" rx="2"/>
                    </svg>
                    <p>No hay tokens creados</p>
                    <button class="btn-primary" onclick="app.showTokenModal()">Crear Primer Token</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tokens.map(token => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${this.escapeHtml(token.name)}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="app.showTokenModal(app.tokens.find(t => t.id === ${token.id}))" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11 2L14 5L5 14H2V11L11 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="app.deleteToken(${token.id})" title="Eliminar">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4H13M5 4V3H11V4M6 7V11M10 7V11M4 4V13H12V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="token-preview" ${token.category === 'color' ? `style="background: ${token.value}"` : ''}>
                        ${token.category !== 'color' ? this.escapeHtml(token.value) : ''}
                    </div>
                    <div class="card-meta">
                        <span class="badge badge-${token.category}">${token.category}</span>
                        <code class="token-value">${this.escapeHtml(token.value)}</code>
                    </div>
                    ${token.description ? `<p class="card-description">${this.escapeHtml(token.description)}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Screen methods
    showScreenModal(screen = null) {
        this.editingItem = screen;
        const modal = this.domCache.get('#screen-modal');
        const title = this.domCache.get('#screen-modal-title');
        
        if (screen) {
            if (title) title.textContent = 'Editar Pantalla';
            this.domCache.get('#screen-name').value = screen.name || '';
            this.domCache.get('#screen-purpose').value = screen.purpose || '';
            this.domCache.get('#screen-components').value = screen.components?.join(', ') || '';
            this.domCache.get('#screen-flows').value = screen.relatedFlows?.join(', ') || '';
        } else {
            if (title) title.textContent = 'Nueva Pantalla';
        }
        
        if (modal) modal.style.display = 'flex';
    }

    saveScreen(data) {
        const components = data['screen-components'] ? data['screen-components'].split(',').map(c => c.trim()).filter(c => c) : [];
        const relatedFlows = data['screen-flows'] ? data['screen-flows'].split(',').map(f => f.trim()).filter(f => f) : [];
        
        const screen = {
            id: this.editingItem?.id || Date.now(),
            name: data['screen-name'],
            purpose: data['screen-purpose'],
            components: components,
            relatedFlows: relatedFlows,
            createdAt: this.editingItem?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingItem) {
            const index = this.screens.findIndex(s => s.id === this.editingItem.id);
            if (index !== -1) this.screens[index] = screen;
        } else {
            this.screens.push(screen);
        }

        this.saveData();
        this.renderArchitecture();
        this.closeModal('screen-modal');
        this.showNotification(this.editingItem ? 'Pantalla actualizada' : 'Pantalla creada');
        this.editingItem = null;
    }

    deleteScreen(id) {
        if (confirm('¿Estás seguro de eliminar esta pantalla?')) {
            this.screens = this.screens.filter(s => s.id !== id);
            this.saveData();
            this.renderArchitecture();
            this.showNotification('Pantalla eliminada');
        }
    }

    renderArchitecture() {
        const container = this.domCache.get('#architecture-container');
        if (!container) return;

        if (this.screens.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <rect x="8" y="8" width="48" height="48" stroke="currentColor" stroke-width="2" rx="4"/>
                        <line x1="8" y1="20" x2="56" y2="20" stroke="currentColor" stroke-width="2"/>
                        <line x1="20" y1="8" x2="20" y2="56" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>No hay pantallas creadas</p>
                    <button class="btn-primary" onclick="app.showScreenModal()">Crear Primera Pantalla</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.screens.map(screen => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${this.escapeHtml(screen.name)}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="app.showScreenModal(app.screens.find(s => s.id === ${screen.id}))" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11 2L14 5L5 14H2V11L11 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="app.deleteScreen(${screen.id})" title="Eliminar">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4H13M5 4V3H11V4M6 7V11M10 7V11M4 4V13H12V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${screen.purpose ? `<p class="card-description">${this.escapeHtml(screen.purpose)}</p>` : ''}
                    ${screen.components && screen.components.length > 0 ? `
                        <div class="component-list">
                            <strong>Componentes:</strong>
                            <div class="badge-group">
                                ${screen.components.slice(0, 5).map(c => `<span class="badge">${this.escapeHtml(c)}</span>`).join('')}
                                ${screen.components.length > 5 ? `<span class="badge">+${screen.components.length - 5}</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    ${screen.relatedFlows && screen.relatedFlows.length > 0 ? `
                        <div class="flow-list">
                            <strong>Flujos:</strong>
                            <div class="badge-group">
                                ${screen.relatedFlows.map(f => `<span class="badge badge-flow">${this.escapeHtml(f)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Metrics
    renderMetrics() {
        const container = this.domCache.get('#metrics-container');
        if (!container) return;

        const metrics = this.calculateMetrics();

        container.innerHTML = `
            <div class="metric-card">
                <div class="metric-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M4 28L10 16L16 22L28 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3 class="metric-title">Total de Flujos</h3>
                    <p class="metric-value">${metrics.totalFlows}</p>
                    <p class="metric-description">Flujos de usuario creados</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="4" y="4" width="10" height="10" stroke="currentColor" stroke-width="2" rx="2"/>
                        <rect x="18" y="4" width="10" height="10" stroke="currentColor" stroke-width="2" rx="2"/>
                        <rect x="4" y="18" width="10" height="10" stroke="currentColor" stroke-width="2" rx="2"/>
                        <rect x="18" y="18" width="10" height="10" stroke="currentColor" stroke-width="2" rx="2"/>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3 class="metric-title">Design Tokens</h3>
                    <p class="metric-value">${metrics.totalTokens}</p>
                    <p class="metric-description">Tokens de diseño definidos</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="4" y="4" width="24" height="24" stroke="currentColor" stroke-width="2" rx="2"/>
                        <line x1="4" y1="12" x2="28" y2="12" stroke="currentColor" stroke-width="2"/>
                        <line x1="12" y1="4" x2="12" y2="28" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3 class="metric-title">Pantallas</h3>
                    <p class="metric-value">${metrics.totalScreens}</p>
                    <p class="metric-description">Pantallas arquitecturadas</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M16 8V24M10 14L16 8L22 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3 class="metric-title">Pasos Totales</h3>
                    <p class="metric-value">${metrics.totalSteps}</p>
                    <p class="metric-description">Pasos en todos los flujos</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="2"/>
                        <path d="M16 10V16L20 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3 class="metric-title">Última Actualización</h3>
                    <p class="metric-value">${this.formatDate(metrics.lastUpdate)}</p>
                    <p class="metric-description">Última modificación</p>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M4 16H28M16 4V28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3 class="metric-title">Componentes Únicos</h3>
                    <p class="metric-value">${metrics.uniqueComponents}</p>
                    <p class="metric-description">Componentes identificados</p>
                </div>
            </div>
        `;
    }

    calculateMetrics() {
        const allComponents = this.screens.flatMap(s => s.components || []);
        const uniqueComponents = new Set(allComponents);
        
        const lastUpdates = [
            ...this.flows.map(f => f.updatedAt),
            ...this.tokens.map(t => t.updatedAt),
            ...this.screens.map(s => s.updatedAt)
        ].sort().reverse();

        return {
            totalFlows: this.flows.length,
            totalTokens: this.tokens.length,
            totalScreens: this.screens.length,
            totalSteps: this.flows.reduce((sum, f) => sum + (f.steps?.length || 0), 0),
            uniqueComponents: uniqueComponents.size,
            lastUpdate: lastUpdates[0] || new Date().toISOString()
        };
    }

    // History
    addToHistory(project) {
        this.history.unshift({
            ...project,
            timestamp: new Date().toISOString()
        });

        // Keep only last 20
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }

        this.saveHistory();
    }

    showHistoryModal() {
        const modal = this.domCache.get('#history-modal');
        const container = this.domCache.get('#history-container');
        
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay historial disponible</p></div>';
        } else {
            container.innerHTML = this.history.map(item => `
                <div class="history-item">
                    <div class="history-header">
                        <h4>${this.escapeHtml(item.name)}</h4>
                        <span class="history-date">${this.formatDate(item.timestamp)}</span>
                    </div>
                    ${item.description ? `<p>${this.escapeHtml(item.description)}</p>` : ''}
                    <div class="history-meta">
                        ${item.category ? `<span class="badge">${item.category}</span>` : ''}
                        ${item.platform ? `<span class="badge">${item.platform}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }

        if (modal) modal.style.display = 'flex';
    }

    // Templates
    showTemplatesModal() {
        const modal = this.domCache.get('#templates-modal');
        const container = this.domCache.get('#templates-container');
        
        if (!container) return;

        const templates = this.getTemplates();

        container.innerHTML = templates.map(template => `
            <div class="template-card" onclick="app.loadTemplate(${template.id})">
                <div class="template-icon">${template.icon}</div>
                <h4 class="template-title">${template.name}</h4>
                <p class="template-description">${template.description}</p>
                <div class="template-meta">
                    <span class="badge">${template.category}</span>
                    <span class="template-count">${template.flowsCount} flujos</span>
                </div>
            </div>
        `).join('');

        if (modal) modal.style.display = 'flex';
    }

    getTemplates() {
        return [
            {
                id: 1,
                name: 'E-commerce',
                icon: '🛍️',
                description: 'Flujos completos para tienda online',
                category: 'ecommerce',
                flowsCount: 5,
                flows: ['Navegación de productos', 'Proceso de compra', 'Gestión de carrito', 'Pagos', 'Seguimiento de orden']
            },
            {
                id: 2,
                name: 'Red Social',
                icon: '👥',
                description: 'Flujos para aplicación social',
                category: 'social',
                flowsCount: 4,
                flows: ['Registro/Login', 'Creación de posts', 'Interacciones', 'Perfil de usuario']
            },
            {
                id: 3,
                name: 'Dashboard',
                icon: '📊',
                description: 'Panel de administración',
                category: 'productivity',
                flowsCount: 4,
                flows: ['Vista general', 'Reportes', 'Configuración', 'Gestión de usuarios']
            },
            {
                id: 4,
                name: 'App Móvil',
                icon: '📱',
                description: 'Flujos para aplicación móvil',
                category: 'mobile',
                flowsCount: 3,
                flows: ['Onboarding', 'Navegación principal', 'Notificaciones']
            }
        ];
    }

    loadTemplate(templateId) {
        const template = this.getTemplates().find(t => t.id === templateId);
        if (!template) return;

        this.flows = template.flows.map((name, index) => ({
            id: Date.now() + index,
            name: name,
            description: `Flujo predefinido de plantilla ${template.name}`,
            type: 'user',
            steps: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));

        this.saveData();
        this.closeModal('templates-modal');
        this.showNotification(`Plantilla "${template.name}" cargada con ${template.flowsCount} flujos`);
        this.switchTab('flows');
    }

    // Settings
    async saveAPIKey() {
        const apiKeyInput = this.domCache.get('#api-key');
        if (!apiKeyInput) return;

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Por favor ingresa una API key');
            return;
        }

        const success = await this.secureStorage.saveSecure('flowforge-api-key', { key: apiKey }, 'flowforge-encryption-key');
        
        if (success) {
            this.showNotification('API Key guardada de forma segura');
            apiKeyInput.value = '';
        } else {
            alert('Error al guardar la API key');
        }
    }

    exportData() {
        this.showExportModal();
    }

    showExportModal() {
        const stats = {
            flows: this.flows.length,
            tokens: this.tokens.length,
            screens: this.screens.length,
            totalSteps: this.flows.reduce((sum, f) => sum + (f.steps?.length || 0), 0)
        };
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        const content = document.createElement('div');
        content.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 30px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;';
        
        content.innerHTML = `
            <h3 style="margin-bottom: 15px; font-size: 1.3rem;">📥 Exportar Proyecto</h3>
            
            <div style="display: flex; gap: 12px; margin-bottom: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">${stats.flows}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Flujos</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">${stats.tokens}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Tokens</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">${stats.totalSteps}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Pasos</div>
                </div>
            </div>
            
            <p style="color: var(--text-secondary); margin-bottom: 15px; font-size: 0.9rem;">Selecciona el formato de exportación:</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="app.exportAsJSON()" style="padding: 14px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; text-align: left; transition: var(--transition); display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">📄</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">JSON (Completo)</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Incluye todos los datos del proyecto</div>
                    </div>
                </button>
                
                <button onclick="app.exportAsMarkdown()" style="padding: 14px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; text-align: left; transition: var(--transition); display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">📝</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Markdown</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Documentación legible en formato MD</div>
                    </div>
                </button>
                
                <button onclick="app.exportAsHTML()" style="padding: 14px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; text-align: left; transition: var(--transition); display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🌐</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">HTML</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Página web con estilos</div>
                    </div>
                </button>
                
                <button onclick="app.exportAsCSV()" style="padding: 14px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; text-align: left; transition: var(--transition); display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">📊</span>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">CSV</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Flujos en formato de hoja de cálculo</div>
                    </div>
                </button>
            </div>
            
            <button onclick="this.closest('[style*=fixed]').remove()" style="margin-top: 20px; width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; color: var(--text-primary);">
                Cancelar
            </button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    exportAsJSON() {
        const data = {
            project: this.currentProject,
            flows: this.flows,
            tokens: this.tokens,
            screens: this.screens,
            history: this.history,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const content = JSON.stringify(data, null, 2);
        
        this.showExportOptions(
            content,
            `${this.currentProject?.name || 'flowforge'}-export.json`,
            'application/json',
            'JSON'
        );
    }

    showExportOptions(content, filename, mimeType, formatName) {
        // Close previous modal
        document.querySelector('[style*="fixed"][style*="10000"]')?.remove();
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001;';
        
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 30px; max-width: 400px; width: 90%;';
        
        contentDiv.innerHTML = `
            <h3 style="margin-bottom: 20px; font-size: 1.2rem;">✅ ${formatName} Listo</h3>
            <p style="color: var(--text-secondary); margin-bottom: 25px;">¿Qué deseas hacer?</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button id="downloadBtn" style="padding: 14px 20px; background: var(--accent-gradient); border: none; border-radius: var(--radius-md); cursor: pointer; color: white; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>⬇️</span> Descargar Archivo
                </button>
                
                <button id="copyBtn" style="padding: 14px 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; color: var(--text-primary); font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>📋</span> Copiar al Portapapeles
                </button>
                
                <button id="cancelBtn" style="padding: 12px 20px; background: transparent; border: none; cursor: pointer; color: var(--text-secondary);">
                    Cancelar
                </button>
            </div>
        `;
        
        modal.appendChild(contentDiv);
        document.body.appendChild(modal);
        
        contentDiv.querySelector('#downloadBtn').addEventListener('click', () => {
            this.downloadFile(content, filename, mimeType);
            this.showNotification(`${formatName} descargado`, 'success', 'Exportación', 2000);
            modal.remove();
        });
        
        contentDiv.querySelector('#copyBtn').addEventListener('click', () => {
            this.copyToClipboard(content, formatName);
            modal.remove();
        });
        
        contentDiv.querySelector('#cancelBtn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    exportAsMarkdown() {
        const project = this.currentProject;
        let md = `# ${project?.name || 'Proyecto FlowForge'}\n\n`;
        md += `**Categoría:** ${project?.category || 'N/A'}  \n`;
        md += `**Fecha:** ${new Date().toLocaleDateString()}  \n`;
        md += `**Exportado desde:** FlowForge UX/UI Generator\n\n`;
        
        if (project?.description) {
            md += `## Descripción\n\n${project.description}\n\n`;
        }
        
        if (project?.expandedDescription) {
            md += `## Descripción Expandida\n\n${project.expandedDescription}\n\n`;
        }
        
        if (this.flows.length > 0) {
            md += `## Flujos de Usuario (${this.flows.length})\n\n`;
            this.flows.forEach((flow, i) => {
                md += `### ${i + 1}. ${flow.name}\n\n`;
                md += `**Tipo:** ${flow.type || 'user'}  \n`;
                if (flow.description) md += `**Descripción:** ${flow.description}  \n`;
                if (flow.steps && flow.steps.length > 0) {
                    md += `\n**Pasos:**\n`;
                    flow.steps.forEach((step, j) => {
                        md += `${j + 1}. ${step}\n`;
                    });
                }
                md += `\n`;
            });
        }
        
        if (this.tokens.length > 0) {
            md += `## Design Tokens (${this.tokens.length})\n\n`;
            md += `| Nombre | Categoría | Valor | Descripción |\n`;
            md += `|--------|-----------|-------|-------------|\n`;
            this.tokens.forEach(token => {
                md += `| ${token.name} | ${token.category} | \`${token.value}\` | ${token.description || '-'} |\n`;
            });
            md += `\n`;
        }
        
        if (this.screens.length > 0) {
            md += `## Arquitectura de Pantallas (${this.screens.length})\n\n`;
            this.screens.forEach((screen, i) => {
                md += `### ${i + 1}. ${screen.name}\n\n`;
                if (screen.description) md += `${screen.description}\n\n`;
            });
        }
        
        md += `---\n\n*Generado con FlowForge UX/UI Generator*`;
        
        this.showExportOptions(
            md,
            `${project?.name || 'flowforge'}-documentation.md`,
            'text/markdown',
            'Markdown'
        );
    }

    exportAsHTML() {
        const project = this.currentProject;
        let html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project?.name || 'Proyecto FlowForge'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 40px 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #6366f1; margin-bottom: 20px; font-size: 2.5rem; }
        h2 { color: #4f46e5; margin-top: 40px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
        h3 { color: #6366f1; margin-top: 30px; margin-bottom: 15px; }
        .meta { color: #6b7280; margin-bottom: 30px; }
        .flow-card { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6366f1; }
        .token-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .token-table th { background: #6366f1; color: white; padding: 12px; text-align: left; }
        .token-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .token-value { font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; }
        ol { margin-left: 20px; margin-top: 10px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${project?.name || 'Proyecto FlowForge'}</h1>
        <div class="meta">
            <strong>Categoría:</strong> ${project?.category || 'N/A'} | 
            <strong>Fecha:</strong> ${new Date().toLocaleDateString()} | 
            <strong>Flujos:</strong> ${this.flows.length} | 
            <strong>Tokens:</strong> ${this.tokens.length}
        </div>`;
        
        if (project?.description) {
            html += `<h2>Descripción</h2><p>${project.description}</p>`;
        }
        
        if (project?.expandedDescription) {
            html += `<h2>Descripción Expandida</h2><p>${project.expandedDescription.replace(/\n/g, '<br>')}</p>`;
        }
        
        if (this.flows.length > 0) {
            html += `<h2>Flujos de Usuario</h2>`;
            this.flows.forEach((flow, i) => {
                html += `<div class="flow-card">
                    <h3>${i + 1}. ${flow.name}</h3>
                    <p><strong>Tipo:</strong> ${flow.type || 'user'}</p>`;
                if (flow.description) html += `<p>${flow.description}</p>`;
                if (flow.steps && flow.steps.length > 0) {
                    html += `<ol>`;
                    flow.steps.forEach(step => html += `<li>${step}</li>`);
                    html += `</ol>`;
                }
                html += `</div>`;
            });
        }
        
        if (this.tokens.length > 0) {
            html += `<h2>Design Tokens</h2>
                <table class="token-table">
                    <thead><tr><th>Nombre</th><th>Categoría</th><th>Valor</th><th>Descripción</th></tr></thead>
                    <tbody>`;
            this.tokens.forEach(token => {
                html += `<tr>
                    <td><strong>${token.name}</strong></td>
                    <td>${token.category}</td>
                    <td><span class="token-value">${token.value}</span></td>
                    <td>${token.description || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }
        
        html += `<div class="footer">Generado con FlowForge UX/UI Generator</div>
    </div>
</body>
</html>`;
        
        this.showExportOptions(
            html,
            `${project?.name || 'flowforge'}-documentation.html`,
            'text/html',
            'HTML'
        );
    }

    exportAsCSV() {
        let csv = 'Flujo,Tipo,Descripción,Pasos\n';
        
        this.flows.forEach(flow => {
            const steps = flow.steps ? flow.steps.join('; ') : '';
            const desc = flow.description || '';
            csv += `"${flow.name}","${flow.type || 'user'}","${desc}","${steps}"\n`;
        });
        
        this.showExportOptions(
            csv,
            `${this.currentProject?.name || 'flowforge'}-flows.csv`,
            'text/csv',
            'CSV'
        );
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async copyToClipboard(text, format = 'texto') {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification(`${format} copiado al portapapeles`, 'success', 'Clipboard', 1500);
            document.querySelector('[style*="fixed"][style*="10000"]')?.remove();
        } catch (err) {
            this.showNotification('Error al copiar', 'error', 'Clipboard', 2000);
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        
        input.click();
    }

    validateImportData(data) {
        const errors = [];
        const warnings = [];
        const stats = {
            flows: 0,
            tokens: 0,
            screens: 0,
            hasProject: false
        };

        // Check structure
        if (typeof data !== 'object' || data === null) {
            errors.push('El archivo no contiene un objeto JSON válido');
            return { valid: false, errors, warnings, stats };
        }

        // Validate project
        if (data.project) {
            stats.hasProject = true;
            if (!data.project.name) {
                warnings.push('El proyecto no tiene nombre');
            }
        } else {
            warnings.push('No se encontró información del proyecto');
        }

        // Validate flows
        if (data.flows) {
            if (!Array.isArray(data.flows)) {
                errors.push('Los flujos no son un array válido');
            } else {
                stats.flows = data.flows.length;
                data.flows.forEach((flow, i) => {
                    if (!flow.name) warnings.push(`Flujo #${i + 1} sin nombre`);
                    if (!flow.id) warnings.push(`Flujo #${i + 1} sin ID`);
                });
            }
        }

        // Validate tokens
        if (data.tokens) {
            if (!Array.isArray(data.tokens)) {
                errors.push('Los tokens no son un array válido');
            } else {
                stats.tokens = data.tokens.length;
                data.tokens.forEach((token, i) => {
                    if (!token.name) warnings.push(`Token #${i + 1} sin nombre`);
                    if (!token.value) warnings.push(`Token #${i + 1} sin valor`);
                });
            }
        }

        // Validate screens
        if (data.screens) {
            if (!Array.isArray(data.screens)) {
                errors.push('Las pantallas no son un array válido');
            } else {
                stats.screens = data.screens.length;
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            stats
        };
    }

    showImportError(errors) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        const content = document.createElement('div');
        content.style.cssText = 'background: var(--bg-card); border: 1px solid var(--error); border-radius: var(--radius-lg); padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;';
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">❌</div>
                <h3 style="font-size: 1.3rem; color: var(--error);">Error en el archivo</h3>
            </div>
            
            <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
                <strong style="color: var(--error);">Problemas encontrados:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    ${errors.map(err => `<li style="margin: 8px 0; color: var(--text-secondary);">${err}</li>`).join('')}
                </ul>
            </div>
            
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Por favor, verifica que el archivo sea un JSON válido exportado desde FlowForge.
            </p>
            
            <button onclick="this.closest('[style*=fixed]').remove()" style="width: 100%; padding: 12px; background: var(--error); border: none; border-radius: var(--radius-md); cursor: pointer; color: white; font-weight: 600;">
                Cerrar
            </button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    showImportPreview(data, stats) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        const content = document.createElement('div');
        content.style.cssText = 'background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;';
        
        const currentStats = {
            flows: this.flows.length,
            tokens: this.tokens.length,
            screens: this.screens.length,
            hasProject: !!this.currentProject
        };
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📥</div>
                <h3 style="font-size: 1.3rem;">Vista Previa de Importación</h3>
            </div>
            
            ${stats.hasProject ? `
                <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
                    <strong>Proyecto:</strong> ${this.escapeHtml(data.project?.name || 'Sin nombre')}
                    ${data.project?.category ? `<br><span style="color: var(--text-secondary);">Categoría: ${data.project.category}</span>` : ''}
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 25px;">
                <div style="text-align: center; padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-primary);">${stats.flows}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Flujos</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-primary);">${stats.tokens}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Tokens</div>
                </div>
            </div>
            
            ${currentStats.hasProject || currentStats.flows > 0 || currentStats.tokens > 0 ? `
                <div style="background: var(--warning); color: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); margin-bottom: 20px;">
                    <strong>⚠️ Atención:</strong> Actualmente tienes ${currentStats.flows} flujos y ${currentStats.tokens} tokens.
                </div>
            ` : ''}
            
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">
                Selecciona cómo deseas importar los datos:
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button id="replaceBtn" style="padding: 14px 20px; background: var(--error); border: none; border-radius: var(--radius-md); cursor: pointer; color: white; font-weight: 600;">
                    Reemplazar Todo
                </button>
                
                <button id="mergeBtn" style="padding: 14px 20px; background: var(--accent-gradient); border: none; border-radius: var(--radius-md); cursor: pointer; color: white; font-weight: 600;">
                    Combinar (Agregar a lo existente)
                </button>
                
                <button id="cancelBtn" style="padding: 12px 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; color: var(--text-primary);">
                    Cancelar
                </button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        content.querySelector('#replaceBtn').addEventListener('click', () => {
            this.performImport(data, 'replace');
            modal.remove();
        });
        
        content.querySelector('#mergeBtn').addEventListener('click', () => {
            this.performImport(data, 'merge');
            modal.remove();
        });
        
        content.querySelector('#cancelBtn').addEventListener('click', () => {
            modal.remove();
            this.showNotification('Importación cancelada', 'info', 'Importación', 2000);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.showNotification('Importación cancelada', 'info', 'Importación', 2000);
            }
        });
    }

    performImport(data, mode) {
        this.captureState('import');
        
        if (mode === 'replace') {
            this.currentProject = data.project || null;
            this.flows = data.flows || [];
            this.tokens = data.tokens || [];
            this.screens = data.screens || [];
            this.history = data.history || [];
        } else if (mode === 'merge') {
            // Merge flows with unique IDs
            if (data.flows) {
                const maxId = Math.max(0, ...this.flows.map(f => f.id || 0));
                data.flows.forEach((flow, i) => {
                    flow.id = maxId + i + 1;
                    this.flows.push(flow);
                });
            }
            
            // Merge tokens
            if (data.tokens) {
                const maxId = Math.max(0, ...this.tokens.map(t => t.id || 0));
                data.tokens.forEach((token, i) => {
                    token.id = maxId + i + 1;
                    this.tokens.push(token);
                });
            }
            
            // Merge screens
            if (data.screens) {
                this.screens.push(...data.screens);
            }
            
            // Keep current project if exists, otherwise use imported
            if (!this.currentProject && data.project) {
                this.currentProject = data.project;
            }
        }
        
        this.saveData();
        this.saveHistory();
        this.renderCurrentTab();
        this.updateSearchBarVisibility();
        
        const modeText = mode === 'replace' ? 'reemplazados' : 'combinados';
        this.showNotification(`Datos ${modeText} exitosamente`, 'success', 'Importación', 3000);
    }

    clearAllData() {
        if (confirm('¿Estás seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            if (confirm('¿REALMENTE estás seguro? Se perderán todos los proyectos, flujos, tokens y pantallas.')) {
                localStorage.clear();
                this.currentProject = null;
                this.flows = [];
                this.tokens = [];
                this.screens = [];
                this.history = [];
                
                this.renderCurrentTab();
                this.closeModal('settings-modal');
                this.showNotification('Todos los datos han sido eliminados');
                
                // Reload to reset state
                setTimeout(() => location.reload(), 1000);
            }
        }
    }

    // Utility methods
    closeModal(modalId) {
        const modal = this.domCache.get(`#${modalId}`);
        if (modal) modal.style.display = 'none';
        this.editingItem = null;
    }

    showNotification(message, type = 'success', title = null, duration = 4000) {
        // Get or create notification container
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        // Icon mapping
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        // Build notification HTML
        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || 'ℹ'}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${this.escapeHtml(title)}</div>` : ''}
                <div class="notification-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="notification-close">×</button>
        `;

        // Add to container
        container.appendChild(notification);

        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Show animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        return notification;
    }

    removeNotification(notification) {
        notification.classList.add('removing');
        setTimeout(() => {
            notification.remove();
            
            // Remove container if empty
            const container = document.querySelector('.notification-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }

    searchProjects(query) {
        if (!query || query.trim() === '') {
            this.renderFlows();
            this.renderTokens();
            this.renderScreens();
            return;
        }
        
        this.performSearch(query.toLowerCase());
    }

    performSearch(query) {
        // Search in current tab
        switch(this.currentTab) {
            case 'flows':
                this.searchFlows(query);
                break;
            case 'tokens':
                this.searchTokens(query);
                break;
            case 'screens':
                this.searchScreens(query);
                break;
            case 'metrics':
                this.renderMetrics();
                break;
        }
    }

    searchFlows(query) {
        const filtered = this.flows.filter(flow => 
            flow.name.toLowerCase().includes(query) ||
            flow.description?.toLowerCase().includes(query) ||
            flow.type?.toLowerCase().includes(query) ||
            flow.steps?.some(step => step.toLowerCase().includes(query))
        );

        this.renderFilteredFlows(filtered, query);
    }

    searchTokens(query) {
        const filtered = this.tokens.filter(token =>
            token.name.toLowerCase().includes(query) ||
            token.category?.toLowerCase().includes(query) ||
            token.value?.toLowerCase().includes(query) ||
            token.description?.toLowerCase().includes(query)
        );

        this.renderFilteredTokens(filtered, query);
    }

    searchScreens(query) {
        const filtered = this.screens.filter(screen =>
            screen.name.toLowerCase().includes(query) ||
            screen.description?.toLowerCase().includes(query)
        );

        this.renderFilteredScreens(filtered, query);
    }

    renderFilteredFlows(flows, query) {
        const container = this.domCache.get('#flows-container');
        if (!container) return;

        if (flows.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
                    <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No se encontraron flujos</h3>
                    <p>No hay coincidencias para "${this.escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 20px;">
                <strong>${flows.length}</strong> resultado${flows.length !== 1 ? 's' : ''} para "<em>${this.escapeHtml(query)}</em>"
            </div>
        ` + flows.map(flow => `
            <div class="flow-card">
                <div class="flow-card-header">
                    <div>
                        <h3 class="flow-card-title">${this.highlightText(flow.name, query)}</h3>
                        <span class="flow-card-type">${flow.type || 'user'}</span>
                    </div>
                    <div class="flow-card-actions">
                        <button class="btn-icon" onclick="app.editFlow(${flow.id})" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="app.deleteFlow(${flow.id})" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="flow-card-description">${this.highlightText(flow.description || '', query)}</p>
                ${flow.steps && flow.steps.length > 0 ? `
                    <div class="flow-card-steps">
                        <strong>Pasos (${flow.steps.length}):</strong>
                        <ol>
                            ${flow.steps.slice(0, 3).map(step => `<li>${this.highlightText(step, query)}</li>`).join('')}
                            ${flow.steps.length > 3 ? `<li style="color: var(--text-secondary);">+${flow.steps.length - 3} más...</li>` : ''}
                        </ol>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderFilteredTokens(tokens, query) {
        const container = this.domCache.get('#tokens-container');
        if (!container) return;

        if (tokens.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
                    <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No se encontraron tokens</h3>
                    <p>No hay coincidencias para "${this.escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 20px;">
                <strong>${tokens.length}</strong> resultado${tokens.length !== 1 ? 's' : ''} para "<em>${this.escapeHtml(query)}</em>"
            </div>
        ` + tokens.map(token => `
            <div class="flow-card">
                <div class="flow-card-header">
                    <div>
                        <h3 class="flow-card-title">${this.highlightText(token.name, query)}</h3>
                        <span class="flow-card-type">${this.highlightText(token.category, query)}</span>
                    </div>
                    <div class="flow-card-actions">
                        <button class="btn-icon" onclick="app.editToken(${token.id})" title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" onclick="app.deleteToken(${token.id})" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div style="margin-top: 12px;">
                    <code style="background: var(--bg-tertiary); padding: 8px 12px; border-radius: var(--radius-sm); display: inline-block; font-family: monospace;">
                        ${this.highlightText(token.value, query)}
                    </code>
                </div>
                ${token.description ? `<p class="flow-card-description">${this.highlightText(token.description, query)}</p>` : ''}
            </div>
        `).join('');
    }

    renderFilteredScreens(screens, query) {
        const container = this.domCache.get('#screens-container');
        if (!container) return;

        if (screens.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
                    <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No se encontraron pantallas</h3>
                    <p>No hay coincidencias para "${this.escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 20px;">
                <strong>${screens.length}</strong> resultado${screens.length !== 1 ? 's' : ''} para "<em>${this.escapeHtml(query)}</em>"
            </div>
        ` + screens.map(screen => `
            <div class="flow-card">
                <h3 class="flow-card-title">${this.highlightText(screen.name, query)}</h3>
                ${screen.description ? `<p class="flow-card-description">${this.highlightText(screen.description, query)}</p>` : ''}
            </div>
        `).join('');
    }

    highlightText(text, query) {
        if (!text || !query) return this.escapeHtml(text);
        
        const escaped = this.escapeHtml(text);
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escaped.replace(regex, '<mark style="background: var(--warning); color: var(--bg-primary); padding: 2px 4px; border-radius: 3px; font-weight: 600;">$1</mark>');
    }

    initSearchBar() {
        // Create floating search bar
        const searchBar = document.createElement('div');
        searchBar.id = 'floatingSearch';
        searchBar.style.cssText = 'position: fixed; top: 80px; right: 350px; z-index: 1000; display: none;';
        searchBar.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px 12px; box-shadow: var(--shadow-md); display: flex; align-items: center; gap: 8px; min-width: 300px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" id="tabSearch" placeholder="Buscar en esta vista..." style="flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 0.95rem;" />
                <button onclick="app.clearSearch()" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px;" title="Limpiar búsqueda">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(searchBar);
        
        const input = searchBar.querySelector('#tabSearch');
        input.addEventListener('input', PerformanceUtils.debounce((e) => {
            this.performSearch(e.target.value.toLowerCase());
        }, 300));
        
        // Show/hide based on current project
        this.updateSearchBarVisibility();
    }

    updateSearchBarVisibility() {
        const searchBar = document.getElementById('floatingSearch');
        if (searchBar) {
            searchBar.style.display = this.currentProject ? 'block' : 'none';
        }
    }

    clearSearch() {
        const input = document.getElementById('tabSearch');
        if (input) {
            input.value = '';
            this.performSearch('');
        }
    }

    // ============================================
    // Mejora 13: Sistema de Plantillas
    // ============================================
    
    getTemplates() {
        return [
            {
                id: 'login-register',
                name: 'Login y Registro',
                description: 'Flujo completo de autenticación con login, registro, recuperación de contraseña y verificación por email',
                icon: '🔐',
                category: 'Autenticación',
                flows: 4,
                screens: 12,
                data: {
                    flows: [
                        { id: 1, name: 'Login', description: 'Iniciar sesión en la aplicación', steps: ['Pantalla de login', 'Validar credenciales', 'Mostrar dashboard'] },
                        { id: 2, name: 'Registro', description: 'Crear nueva cuenta', steps: ['Formulario de registro', 'Validar datos', 'Enviar email verificación', 'Confirmar cuenta'] },
                        { id: 3, name: 'Recuperar Contraseña', description: 'Reset de contraseña olvidada', steps: ['Solicitar email', 'Enviar link', 'Crear nueva contraseña'] },
                        { id: 4, name: 'Verificación Email', description: 'Verificar correo electrónico', steps: ['Click en link', 'Validar token', 'Activar cuenta'] }
                    ],
                    tokens: [
                        { id: 1, name: 'Primary Color', value: '#6366f1' },
                        { id: 2, name: 'Error Color', value: '#ef4444' },
                        { id: 3, name: 'Success Color', value: '#10b981' }
                    ],
                    screens: [
                        { id: 1, name: 'Login Screen', description: 'Pantalla principal de login' },
                        { id: 2, name: 'Register Screen', description: 'Formulario de registro' },
                        { id: 3, name: 'Forgot Password', description: 'Recuperación de contraseña' }
                    ]
                }
            },
            {
                id: 'onboarding',
                name: 'Onboarding',
                description: 'Experiencia de bienvenida para nuevos usuarios con tutorial interactivo y configuración inicial',
                icon: '👋',
                category: 'Onboarding',
                flows: 3,
                screens: 8,
                data: {
                    flows: [
                        { id: 1, name: 'Bienvenida', description: 'Introducción a la app', steps: ['Splash screen', 'Mostrar beneficios', 'Solicitar permisos'] },
                        { id: 2, name: 'Tutorial', description: 'Guía de funciones principales', steps: ['Paso 1: Navegación', 'Paso 2: Crear contenido', 'Paso 3: Compartir'] },
                        { id: 3, name: 'Configuración Inicial', description: 'Personalizar preferencias', steps: ['Seleccionar intereses', 'Configurar notificaciones', 'Completar perfil'] }
                    ],
                    tokens: [
                        { id: 1, name: 'Primary Color', value: '#8b5cf6' },
                        { id: 2, name: 'Accent Color', value: '#ec4899' }
                    ],
                    screens: [
                        { id: 1, name: 'Welcome Screen', description: 'Pantalla de bienvenida' },
                        { id: 2, name: 'Tutorial Step 1', description: 'Primera pantalla del tutorial' },
                        { id: 3, name: 'Interests Selection', description: 'Selección de intereses' }
                    ]
                }
            },
            {
                id: 'ecommerce',
                name: 'E-commerce',
                description: 'Flujo completo de compra online: búsqueda, carrito, checkout y seguimiento de pedido',
                icon: '🛒',
                category: 'E-commerce',
                flows: 5,
                screens: 15,
                data: {
                    flows: [
                        { id: 1, name: 'Buscar Productos', description: 'Búsqueda y filtrado', steps: ['Buscar', 'Aplicar filtros', 'Ver resultados', 'Seleccionar producto'] },
                        { id: 2, name: 'Detalle de Producto', description: 'Ver información del producto', steps: ['Mostrar detalles', 'Ver imágenes', 'Leer reseñas', 'Agregar al carrito'] },
                        { id: 3, name: 'Carrito de Compras', description: 'Gestionar carrito', steps: ['Ver carrito', 'Modificar cantidades', 'Aplicar cupón', 'Proceder al pago'] },
                        { id: 4, name: 'Checkout', description: 'Proceso de pago', steps: ['Datos de envío', 'Método de pago', 'Confirmar orden', 'Procesar pago'] },
                        { id: 5, name: 'Seguimiento', description: 'Rastrear pedido', steps: ['Ver estado', 'Tracking en tiempo real', 'Notificaciones'] }
                    ],
                    tokens: [
                        { id: 1, name: 'Primary Color', value: '#f59e0b' },
                        { id: 2, name: 'Success Color', value: '#10b981' },
                        { id: 3, name: 'Price Color', value: '#059669' }
                    ],
                    screens: [
                        { id: 1, name: 'Product List', description: 'Lista de productos' },
                        { id: 2, name: 'Product Detail', description: 'Detalle del producto' },
                        { id: 3, name: 'Shopping Cart', description: 'Carrito de compras' },
                        { id: 4, name: 'Checkout', description: 'Proceso de pago' }
                    ]
                }
            },
            {
                id: 'dashboard',
                name: 'Dashboard',
                description: 'Panel de control con métricas, gráficos, notificaciones y accesos rápidos a funciones principales',
                icon: '📊',
                category: 'Dashboard',
                flows: 4,
                screens: 10,
                data: {
                    flows: [
                        { id: 1, name: 'Vista General', description: 'Dashboard principal', steps: ['Cargar métricas', 'Mostrar gráficos', 'Listar actividad reciente'] },
                        { id: 2, name: 'Análisis Detallado', description: 'Ver detalles de métricas', steps: ['Seleccionar métrica', 'Ver histórico', 'Comparar períodos', 'Exportar datos'] },
                        { id: 3, name: 'Notificaciones', description: 'Centro de notificaciones', steps: ['Ver notificaciones', 'Marcar como leídas', 'Filtrar por tipo'] },
                        { id: 4, name: 'Acciones Rápidas', description: 'Shortcuts principales', steps: ['Crear nuevo', 'Buscar', 'Compartir'] }
                    ],
                    tokens: [
                        { id: 1, name: 'Primary Color', value: '#3b82f6' },
                        { id: 2, name: 'Chart Color 1', value: '#8b5cf6' },
                        { id: 3, name: 'Chart Color 2', value: '#06b6d4' }
                    ],
                    screens: [
                        { id: 1, name: 'Main Dashboard', description: 'Dashboard principal' },
                        { id: 2, name: 'Analytics', description: 'Análisis detallado' },
                        { id: 3, name: 'Notifications', description: 'Centro de notificaciones' }
                    ]
                }
            },
            {
                id: 'profile',
                name: 'Perfil de Usuario',
                description: 'Gestión completa de perfil: edición de datos, foto, preferencias y configuración de privacidad',
                icon: '👤',
                category: 'Usuario',
                flows: 3,
                screens: 9,
                data: {
                    flows: [
                        { id: 1, name: 'Ver Perfil', description: 'Visualizar información del usuario', steps: ['Cargar datos', 'Mostrar estadísticas', 'Ver actividad'] },
                        { id: 2, name: 'Editar Perfil', description: 'Modificar información personal', steps: ['Editar campos', 'Subir foto', 'Validar cambios', 'Guardar'] },
                        { id: 3, name: 'Configuración de Privacidad', description: 'Ajustar preferencias de privacidad', steps: ['Ver opciones', 'Modificar permisos', 'Actualizar preferencias'] }
                    ],
                    tokens: [
                        { id: 1, name: 'Primary Color', value: '#06b6d4' },
                        { id: 2, name: 'Accent Color', value: '#8b5cf6' }
                    ],
                    screens: [
                        { id: 1, name: 'Profile View', description: 'Vista del perfil' },
                        { id: 2, name: 'Edit Profile', description: 'Edición de perfil' },
                        { id: 3, name: 'Privacy Settings', description: 'Configuración de privacidad' }
                    ]
                }
            },
            {
                id: 'settings',
                name: 'Configuración',
                description: 'Panel de configuración completo: cuenta, notificaciones, apariencia, seguridad y soporte',
                icon: '⚙️',
                category: 'Configuración',
                flows: 5,
                screens: 12,
                data: {
                    flows: [
                        { id: 1, name: 'Configuración de Cuenta', description: 'Gestionar cuenta', steps: ['Ver datos de cuenta', 'Cambiar email', 'Cambiar contraseña'] },
                        { id: 2, name: 'Notificaciones', description: 'Preferencias de notificaciones', steps: ['Ver tipos', 'Activar/Desactivar', 'Configurar frecuencia'] },
                        { id: 3, name: 'Apariencia', description: 'Personalizar interfaz', steps: ['Seleccionar tema', 'Ajustar tamaño de fuente', 'Preferencias de idioma'] },
                        { id: 4, name: 'Seguridad', description: 'Opciones de seguridad', steps: ['Autenticación 2FA', 'Dispositivos conectados', 'Historial de sesiones'] },
                        { id: 5, name: 'Soporte', description: 'Ayuda y contacto', steps: ['FAQ', 'Contactar soporte', 'Reportar problema'] }
                    ],
                    tokens: [
                        { id: 1, name: 'Primary Color', value: '#6366f1' },
                        { id: 2, name: 'Warning Color', value: '#f59e0b' },
                        { id: 3, name: 'Danger Color', value: '#ef4444' }
                    ],
                    screens: [
                        { id: 1, name: 'Settings Main', description: 'Menú principal de configuración' },
                        { id: 2, name: 'Account Settings', description: 'Configuración de cuenta' },
                        { id: 3, name: 'Notifications', description: 'Preferencias de notificaciones' },
                        { id: 4, name: 'Security', description: 'Opciones de seguridad' }
                    ]
                }
            }
        ];
    }

    showTemplatesModal() {
        const templates = this.getTemplates();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'templates-modal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>📋 Plantillas de Flujos UX</h2>
                    <button class="modal-close" onclick="document.getElementById('templates-modal').remove()">
                        <span>×</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; color: var(--text-secondary);">
                        Selecciona una plantilla para comenzar rápidamente con flujos pre-diseñados
                    </p>
                    <div class="templates-grid">
                        ${templates.map(template => `
                            <div class="template-card" data-template-id="${template.id}">
                                <div class="template-icon">${template.icon}</div>
                                <div class="template-info">
                                    <h3>${template.name}</h3>
                                    <span class="template-category">${template.category}</span>
                                    <p>${template.description}</p>
                                    <div class="template-stats">
                                        <span>📊 ${template.flows} flujos</span>
                                        <span>🖼️ ${template.screens} screens</span>
                                    </div>
                                </div>
                                <div class="template-actions">
                                    <button class="btn btn-secondary" onclick="window.app.previewTemplate('${template.id}')">
                                        👁️ Preview
                                    </button>
                                    <button class="btn btn-primary" onclick="window.app.useTemplate('${template.id}', 'add')">
                                        ➕ Agregar
                                    </button>
                                    <button class="btn btn-accent" onclick="window.app.useTemplate('${template.id}', 'replace')">
                                        🔄 Reemplazar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    previewTemplate(templateId) {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === templateId);
        
        if (!template) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'template-preview-modal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>${template.icon} ${template.name}</h2>
                    <button class="modal-close" onclick="document.getElementById('template-preview-modal').remove()">
                        <span>×</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="template-preview-header">
                        <span class="badge">${template.category}</span>
                        <p style="margin: 10px 0;">${template.description}</p>
                    </div>
                    
                    <div class="template-preview-section">
                        <h3>📊 Flujos incluidos (${template.flows})</h3>
                        <div class="flow-list">
                            ${template.data.flows.map(flow => `
                                <div class="flow-preview-item">
                                    <strong>${flow.name}</strong>
                                    <p>${flow.description}</p>
                                    <div class="flow-steps">
                                        ${flow.steps.map((step, i) => `
                                            <span class="step-badge">${i + 1}. ${step}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="template-preview-section">
                        <h3>🎨 Tokens de diseño (${template.data.tokens.length})</h3>
                        <div class="tokens-preview">
                            ${template.data.tokens.map(token => `
                                <div class="token-preview">
                                    <span class="color-swatch" style="background: ${token.value};"></span>
                                    <span>${token.name}: ${token.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="template-preview-section">
                        <h3>🖼️ Screens (${template.data.screens.length})</h3>
                        <div class="screens-list">
                            ${template.data.screens.map(screen => `
                                <div class="screen-preview-item">
                                    <strong>${screen.name}</strong>
                                    <p>${screen.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="template-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('template-preview-modal').remove()">
                            Cerrar
                        </button>
                        <button class="btn btn-primary" onclick="window.app.useTemplate('${templateId}', 'add'); document.getElementById('template-preview-modal').remove();">
                            ➕ Agregar al Proyecto
                        </button>
                        <button class="btn btn-accent" onclick="window.app.useTemplate('${templateId}', 'replace'); document.getElementById('template-preview-modal').remove();">
                            🔄 Reemplazar Todo
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    useTemplate(templateId, mode) {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === templateId);
        
        if (!template) return;
        
        this.progressBar.show();
        this.progressBar.update(30);
        
        // Close templates modal if open
        const templatesModal = document.getElementById('templates-modal');
        if (templatesModal) {
            templatesModal.remove();
        }
        
        setTimeout(() => {
            this.progressBar.update(60);
            
            if (mode === 'replace') {
                // Replace all data
                this.captureState('template-replace');
                this.flows = [...template.data.flows];
                this.tokens = [...template.data.tokens];
                this.screens = [...template.data.screens];
                
                // Update project info
                if (!this.projectInfo) {
                    this.projectInfo = { name: '', category: '' };
                }
                this.projectInfo.name = template.name;
                this.projectInfo.category = template.category;
                
                this.progressBar.update(90);
                this.saveData();
                this.renderCurrentTab();
                
                this.showNotification(
                    `Plantilla "${template.name}" aplicada correctamente`,
                    'success',
                    'Plantilla',
                    3000
                );
            } else {
                // Add to existing data
                this.captureState('template-add');
                
                const maxFlowId = this.flows.length > 0 ? Math.max(...this.flows.map(f => f.id)) : 0;
                const maxTokenId = this.tokens.length > 0 ? Math.max(...this.tokens.map(t => t.id)) : 0;
                const maxScreenId = this.screens.length > 0 ? Math.max(...this.screens.map(s => s.id)) : 0;
                
                // Add flows with new IDs
                template.data.flows.forEach((flow, i) => {
                    this.flows.push({
                        ...flow,
                        id: maxFlowId + i + 1,
                        name: `${flow.name} (${template.name})`
                    });
                });
                
                // Add tokens with new IDs
                template.data.tokens.forEach((token, i) => {
                    this.tokens.push({
                        ...token,
                        id: maxTokenId + i + 1
                    });
                });
                
                // Add screens with new IDs
                template.data.screens.forEach((screen, i) => {
                    this.screens.push({
                        ...screen,
                        id: maxScreenId + i + 1
                    });
                });
                
                this.progressBar.update(90);
                this.saveData();
                this.renderCurrentTab();
                
                this.showNotification(
                    `Se agregaron ${template.flows} flujos de la plantilla "${template.name}"`,
                    'success',
                    'Plantilla',
                    3000
                );
            }
            
            this.progressBar.update(100);
            setTimeout(() => this.progressBar.hide(), 300);
        }, 500);
    }

    initDragAndDrop() {
        const dropZone = document.body;
        let dragCounter = 0;
        
        const showDropOverlay = () => {
            let overlay = document.getElementById('dropOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'dropOverlay';
                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: rgba(99, 102, 241, 0.95);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                `;
                overlay.innerHTML = `
                    <div style="text-align: center; color: white;">
                        <div style="font-size: 5rem; margin-bottom: 20px;">📥</div>
                        <h2 style="font-size: 2rem; margin-bottom: 10px;">Suelta el archivo aquí</h2>
                        <p style="font-size: 1.1rem; opacity: 0.9;">Archivos JSON compatibles</p>
                    </div>
                `;
                document.body.appendChild(overlay);
            }
        };
        
        const hideDropOverlay = () => {
            const overlay = document.getElementById('dropOverlay');
            if (overlay) overlay.remove();
        };
        
        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if (dragCounter === 1) {
                showDropOverlay();
            }
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                hideDropOverlay();
            }
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            hideDropOverlay();
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                
                if (!file.name.endsWith('.json')) {
                    this.showNotification('Solo se aceptan archivos JSON', 'error', 'Importación', 3000);
                    return;
                }
                
                this.processImportFile(file);
            }
        });
    }

    processImportFile(file) {
        this.progressBar.show();
        this.progressBar.update(20);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                this.progressBar.update(50);
                const data = JSON.parse(event.target.result);
                
                const validation = this.validateImportData(data);
                this.progressBar.update(70);
                
                if (!validation.valid) {
                    this.progressBar.hide();
                    this.showImportError(validation.errors);
                    return;
                }
                
                this.progressBar.update(90);
                this.showImportPreview(data, validation.stats);
                this.progressBar.update(100);
                
                setTimeout(() => this.progressBar.hide(), 300);
                
            } catch (error) {
                this.progressBar.hide();
                this.showNotification('Error al leer archivo: ' + error.message, 'error', 'Importación', 5000);
            }
        };
        
        reader.onerror = () => {
            this.progressBar.hide();
            this.showNotification('Error al leer el archivo', 'error', 'Importación', 5000);
        };
        
        reader.readAsText(file);
    }

    renderProjectsList() {
        // Would render list of projects if we supported multiple
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // Data persistence
    async saveData() {
        const data = {
            project: this.currentProject,
            flows: this.flows,
            tokens: this.tokens,
            screens: this.screens
        };

        // Use compression for large data
        DataCompressor.saveCompressed('flowforge-data', data);
        
        // Update UI
        const saveBtn = this.domCache.get('#saveBtn');
        if (saveBtn) {
            saveBtn.classList.remove('pulsing');
            saveBtn.innerHTML = '💾 Guardado';
            
            setTimeout(() => {
                saveBtn.innerHTML = '💾 Guardar';
            }, 2000);
        }
        
        this.isDirty = false;
    }

    async loadData() {
        const data = DataCompressor.loadCompressed('flowforge-data');
        
        if (data) {
            this.currentProject = data.project || null;
            this.flows = data.flows || [];
            this.tokens = data.tokens || [];
            this.screens = data.screens || [];
        }

        this.loadHistory();
    }

    saveHistory() {
        DataCompressor.saveCompressed('flowforge-history', this.history);
    }

    loadHistory() {
        const history = DataCompressor.loadCompressed('flowforge-history');
        if (history) {
            this.history = history;
        }
    }
}

// ============================================
// HTML SCREEN ANALYZER
// ============================================
class HTMLScreenAnalyzer {
    constructor(app) {
        this.app = app;
        this.uploadedScreens = [];
        this.analysisResults = null;
    }

    async analyzeScreens(htmlFiles) {
        this.uploadedScreens = [];
        const results = {
            totalScreens: htmlFiles.length,
            validatedScreens: [],
            issues: [],
            navigation: {},
            components: new Set(),
            appType: null,
            timestamp: new Date().toISOString()
        };

        // Parse each HTML file
        for (const file of htmlFiles) {
            const content = await this.readFileContent(file);
            const parsed = this.parseHTML(content, file.name);
            this.uploadedScreens.push(parsed);
        }

        // Validate against flow specifications
        results.validatedScreens = this.validateAgainstFlows(this.uploadedScreens);
        
        // Analyze navigation patterns
        results.navigation = this.analyzeNavigation(this.uploadedScreens);
        
        // Extract components
        results.components = this.extractComponents(this.uploadedScreens);
        
        // Detect app type
        results.appType = this.detectAppType(this.uploadedScreens, results.components);
        
        // Find issues
        results.issues = this.findIssues(results);

        this.analysisResults = results;
        return results;
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    parseHTML(content, filename) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        return {
            filename,
            title: doc.querySelector('title')?.textContent || filename,
            content,
            doc,
            links: this.extractLinks(doc),
            forms: this.extractForms(doc),
            components: this.extractComponentsFromDoc(doc),
            scripts: this.extractScripts(doc),
            styles: this.extractStyles(doc)
        };
    }

    extractLinks(doc) {
        const links = [];
        doc.querySelectorAll('a[href]').forEach(a => {
            links.push({
                href: a.getAttribute('href'),
                text: a.textContent.trim(),
                external: a.getAttribute('href')?.startsWith('http')
            });
        });
        return links;
    }

    extractForms(doc) {
        const forms = [];
        doc.querySelectorAll('form').forEach(form => {
            const fields = [];
            form.querySelectorAll('input, textarea, select').forEach(field => {
                fields.push({
                    type: field.type || field.tagName.toLowerCase(),
                    name: field.name || field.id,
                    required: field.hasAttribute('required')
                });
            });
            forms.push({ fields, action: form.action, method: form.method });
        });
        return forms;
    }

    extractComponentsFromDoc(doc) {
        const components = [];
        const selectors = [
            'button', 'input', 'select', 'textarea', 'nav', 'header', 
            'footer', 'aside', 'section', 'article', 'form', 'table',
            '[class*="card"]', '[class*="modal"]', '[class*="dropdown"]',
            '[class*="menu"]', '[class*="navbar"]', '[class*="sidebar"]'
        ];
        
        selectors.forEach(selector => {
            const elements = doc.querySelectorAll(selector);
            if (elements.length > 0) {
                components.push({ type: selector, count: elements.length });
            }
        });
        
        return components;
    }

    extractScripts(doc) {
        const scripts = [];
        doc.querySelectorAll('script[src]').forEach(script => {
            scripts.push(script.getAttribute('src'));
        });
        return scripts;
    }

    extractStyles(doc) {
        const styles = [];
        doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            styles.push(link.getAttribute('href'));
        });
        return styles;
    }

    validateAgainstFlows(screens) {
        const specifiedFlows = this.app.flows || [];
        const validated = [];

        screens.forEach(screen => {
            const matchedFlow = specifiedFlows.find(flow => 
                flow.name.toLowerCase().includes(screen.title.toLowerCase()) ||
                screen.title.toLowerCase().includes(flow.name.toLowerCase())
            );

            validated.push({
                screen: screen.filename,
                title: screen.title,
                matched: !!matchedFlow,
                flow: matchedFlow?.name,
                complete: this.checkScreenCompleteness(screen, matchedFlow)
            });
        });

        return validated;
    }

    checkScreenCompleteness(screen, flow) {
        if (!flow) return 50; // Base score if no flow match
        
        let score = 100;
        
        // Check if screen has navigation
        if (screen.links.length === 0) score -= 20;
        
        // Check if screen has forms when flow mentions input
        const flowText = flow.steps?.join(' ').toLowerCase() || '';
        if ((flowText.includes('formulario') || flowText.includes('input')) && screen.forms.length === 0) {
            score -= 30;
        }
        
        // Check if screen has buttons
        const hasButtons = screen.components.some(c => c.type === 'button');
        if (!hasButtons) score -= 15;
        
        return Math.max(0, score);
    }

    analyzeNavigation(screens) {
        const navigation = {
            internal: [],
            external: [],
            orphans: [],
            flows: []
        };

        const screenNames = screens.map(s => s.filename);
        
        screens.forEach(screen => {
            screen.links.forEach(link => {
                if (link.external) {
                    navigation.external.push({ from: screen.filename, to: link.href });
                } else {
                    const target = link.href.replace('.html', '').replace('./', '').replace('#', '');
                    const exists = screenNames.some(name => name.includes(target));
                    
                    if (exists) {
                        navigation.internal.push({ from: screen.filename, to: link.href, label: link.text });
                    } else if (link.href !== '#' && link.href !== '') {
                        navigation.orphans.push({ from: screen.filename, to: link.href });
                    }
                }
            });
        });

        // Detect navigation flows
        const visited = new Set();
        screens.forEach(screen => {
            if (!visited.has(screen.filename)) {
                const flow = this.traceFlow(screen, screens, visited);
                if (flow.length > 1) {
                    navigation.flows.push(flow);
                }
            }
        });

        return navigation;
    }

    traceFlow(startScreen, allScreens, visited) {
        const flow = [startScreen.filename];
        visited.add(startScreen.filename);
        
        startScreen.links.forEach(link => {
            const targetName = link.href.replace('.html', '').replace('./', '');
            const targetScreen = allScreens.find(s => s.filename.includes(targetName));
            
            if (targetScreen && !visited.has(targetScreen.filename)) {
                const subFlow = this.traceFlow(targetScreen, allScreens, visited);
                flow.push(...subFlow);
            }
        });
        
        return flow;
    }

    extractComponents(screens) {
        const allComponents = new Set();
        
        screens.forEach(screen => {
            screen.components.forEach(comp => {
                allComponents.add(comp.type);
            });
        });
        
        return Array.from(allComponents);
    }

    detectAppType(screens, components) {
        const indicators = {
            spa: 0,
            mpa: 0,
            dashboard: 0,
            ecommerce: 0,
            social: 0,
            auth: 0
        };

        // SPA indicators
        if (screens.some(s => s.scripts.some(src => src.includes('react') || src.includes('vue') || src.includes('angular')))) {
            indicators.spa += 50;
        }

        // MPA indicators
        if (screens.length > 5 && screens.every(s => s.links.some(l => l.href.endsWith('.html')))) {
            indicators.mpa += 30;
        }

        // Dashboard indicators
        if (components.includes('table') && (components.includes('[class*="card"]') || components.includes('aside'))) {
            indicators.dashboard += 40;
        }

        // E-commerce indicators
        const ecommerceKeywords = ['cart', 'checkout', 'product', 'price', 'payment'];
        screens.forEach(s => {
            const content = s.content.toLowerCase();
            if (ecommerceKeywords.some(kw => content.includes(kw))) {
                indicators.ecommerce += 20;
            }
        });

        // Social indicators
        const socialKeywords = ['profile', 'post', 'comment', 'like', 'share', 'follow'];
        screens.forEach(s => {
            const content = s.content.toLowerCase();
            if (socialKeywords.some(kw => content.includes(kw))) {
                indicators.social += 20;
            }
        });

        // Auth indicators
        if (screens.some(s => s.forms.some(f => f.fields.some(field => 
            field.name?.includes('password') || field.type === 'password'
        )))) {
            indicators.auth += 30;
        }

        // Determine primary type
        const maxScore = Math.max(...Object.values(indicators));
        const primaryType = Object.keys(indicators).find(key => indicators[key] === maxScore);

        return {
            primary: primaryType,
            confidence: maxScore,
            indicators,
            needsDatabase: indicators.ecommerce > 20 || indicators.social > 20 || indicators.auth > 20,
            suggestedFramework: indicators.spa > indicators.mpa ? 'React/Vue/Angular' : 'Node.js/Express'
        };
    }

    findIssues(results) {
        const issues = [];

        // Check for orphan links
        if (results.navigation.orphans.length > 0) {
            issues.push({
                type: 'warning',
                category: 'Navegación',
                message: `${results.navigation.orphans.length} enlaces rotos o incompletos detectados`,
                details: results.navigation.orphans
            });
        }

        // Check for unmatched screens
        const unmatched = results.validatedScreens.filter(v => !v.matched);
        if (unmatched.length > 0) {
            issues.push({
                type: 'info',
                category: 'Validación',
                message: `${unmatched.length} pantallas no coinciden con flujos especificados`,
                details: unmatched.map(u => u.screen)
            });
        }

        // Check for incomplete screens
        const incomplete = results.validatedScreens.filter(v => v.complete < 70);
        if (incomplete.length > 0) {
            issues.push({
                type: 'warning',
                category: 'Completitud',
                message: `${incomplete.length} pantallas están incompletas (< 70%)`,
                details: incomplete.map(i => ({ screen: i.screen, score: i.complete }))
            });
        }

        // Check for missing navigation
        if (results.navigation.internal.length === 0) {
            issues.push({
                type: 'error',
                category: 'Navegación',
                message: 'No se detectó navegación entre pantallas',
                details: 'Las pantallas no están conectadas entre sí'
            });
        }

        return issues;
    }
}

// ============================================
// PROJECT STRUCTURE GENERATOR
// ============================================
class ProjectStructureGenerator {
    constructor(app, analyzer) {
        this.app = app;
        this.analyzer = analyzer;
        this.structure = null;
    }

    generateStructure() {
        const analysis = this.analyzer.analysisResults;
        const appType = analysis.appType.primary;
        const project = this.app.currentProject;

        const structure = {
            projectName: this.sanitizeProjectName(project.name),
            type: appType,
            folders: [],
            files: [],
            dependencies: [],
            scripts: {},
            config: {}
        };

        // Generate structure based on app type
        switch (appType) {
            case 'spa':
                this.generateSPAStructure(structure, analysis);
                break;
            case 'dashboard':
                this.generateDashboardStructure(structure, analysis);
                break;
            case 'ecommerce':
                this.generateEcommerceStructure(structure, analysis);
                break;
            default:
                this.generateMPAStructure(structure, analysis);
        }

        // Add common files
        this.addCommonFiles(structure, analysis);
        
        // Add database config if needed
        if (analysis.appType.needsDatabase) {
            this.addDatabaseConfig(structure);
        }

        this.structure = structure;
        return structure;
    }

    sanitizeProjectName(name) {
        return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    generateSPAStructure(structure, analysis) {
        structure.folders = [
            'src',
            'src/components',
            'src/pages',
            'src/assets',
            'src/assets/css',
            'src/assets/img',
            'src/hooks',
            'src/utils',
            'src/services',
            'public'
        ];

        structure.files = [
            { path: 'src/App.jsx', content: this.generateAppComponent() },
            { path: 'src/main.jsx', content: this.generateMainFile() },
            { path: 'src/index.css', content: this.generateBaseStyles() },
            { path: 'public/index.html', content: this.generateIndexHTML() },
            { path: '.gitignore', content: this.generateGitignore() },
            { path: 'vite.config.js', content: this.generateViteConfig() }
        ];

        structure.dependencies = [
            'react',
            'react-dom',
            'react-router-dom',
            '@vitejs/plugin-react'
        ];

        if (analysis.appType.needsDatabase) {
            structure.dependencies.push('axios');
        }

        structure.scripts = {
            'dev': 'vite',
            'build': 'vite build',
            'preview': 'vite preview'
        };
    }

    generateDashboardStructure(structure, analysis) {
        this.generateSPAStructure(structure, analysis);
        
        structure.folders.push(
            'src/layouts',
            'src/components/charts',
            'src/components/tables',
            'src/components/widgets'
        );

        structure.dependencies.push('recharts', '@tanstack/react-table');
    }

    generateEcommerceStructure(structure, analysis) {
        this.generateSPAStructure(structure, analysis);
        
        structure.folders.push(
            'src/context',
            'src/components/product',
            'src/components/cart',
            'src/pages/checkout'
        );

        structure.dependencies.push('zustand', 'stripe');
        structure.files.push(
            { path: 'src/context/CartContext.jsx', content: this.generateCartContext() }
        );
    }

    generateMPAStructure(structure, analysis) {
        structure.folders = [
            'public',
            'public/css',
            'public/js',
            'public/img',
            'server',
            'server/routes',
            'server/controllers',
            'server/models',
            'views'
        ];

        structure.files = [
            { path: 'server/index.js', content: this.generateServerFile() },
            { path: 'public/css/styles.css', content: this.generateBaseStyles() },
            { path: '.env.example', content: this.generateEnvExample() },
            { path: '.gitignore', content: this.generateGitignore() }
        ];

        structure.dependencies = ['express', 'ejs', 'dotenv'];

        if (analysis.appType.needsDatabase) {
            structure.dependencies.push('mysql2', 'sequelize');
        }

        structure.scripts = {
            'start': 'node server/index.js',
            'dev': 'nodemon server/index.js'
        };
    }

    addCommonFiles(structure, analysis) {
        structure.files.push(
            { path: 'README.md', content: this.generateReadme(analysis) },
            { path: 'package.json', content: JSON.stringify(this.generatePackageJson(structure), null, 2) }
        );
    }

    addDatabaseConfig(structure) {
        structure.files.push(
            { path: 'server/config/database.js', content: this.generateDatabaseConfig() },
            { path: 'server/models/index.js', content: this.generateModelsIndex() },
            { path: 'database/schema.sql', content: this.generateDatabaseSchema() }
        );

        if (!structure.folders.includes('server/config')) {
            structure.folders.push('server/config');
        }
        if (!structure.folders.includes('database')) {
            structure.folders.push('database');
        }
    }

    generatePackageJson(structure) {
        return {
            name: structure.projectName,
            version: '1.0.0',
            description: this.app.currentProject.description || '',
            scripts: structure.scripts,
            dependencies: structure.dependencies.reduce((acc, dep) => {
                acc[dep] = 'latest';
                return acc;
            }, {}),
            devDependencies: {
                'nodemon': 'latest'
            }
        };
    }

    generateAppComponent() {
        return `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<h1>Página Principal</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`;
    }

    generateMainFile() {
        return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    }

    generateBaseStyles() {
        const tokens = this.app.tokens || [];
        let css = `:root {\n`;
        
        tokens.forEach(token => {
            if (token.category === 'color') {
                css += `  --${token.name}: ${token.value};\n`;
            }
        });
        
        css += `}\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n  line-height: 1.6;\n}`;
        
        return css;
    }

    generateIndexHTML() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.app.currentProject.name}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;
    }

    generateServerFile() {
        return `const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: '${this.app.currentProject.name}' });
});

app.listen(PORT, () => {
  console.log(\`Servidor corriendo en http://localhost:\${PORT}\`);
});`;
    }

    generateDatabaseConfig() {
        return `const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '${this.sanitizeProjectName(this.app.currentProject.name)}_db'
};

async function getConnection() {
  return await mysql.createConnection(config);
}

module.exports = { getConnection, config };`;
    }

    generateDatabaseSchema() {
        return `-- Esquema de base de datos para ${this.app.currentProject.name}
-- Creado automáticamente por FlowForge

CREATE DATABASE IF NOT EXISTS ${this.sanitizeProjectName(this.app.currentProject.name)}_db;
USE ${this.sanitizeProjectName(this.app.currentProject.name)}_db;

-- Tabla de usuarios (ejemplo)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agrega más tablas según las necesidades de tu aplicación`;
    }

    generateModelsIndex() {
        return `// Exporta todos los modelos de la base de datos
const { getConnection } = require('../config/database');

module.exports = {
  getConnection
};`;
    }

    generateEnvExample() {
        return `PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=${this.sanitizeProjectName(this.app.currentProject.name)}_db
NODE_ENV=development`;
    }

    generateGitignore() {
        return `node_modules/
.env
dist/
build/
.DS_Store
*.log
.vscode/
.idea/`;
    }

    generateViteConfig() {
        return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});`;
    }

    generateCartContext() {
        return `import { create } from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({ 
    items: state.items.filter(item => item.id !== id) 
  })),
  clearCart: () => set({ items: [] })
}));`;
    }

    generateReadme(analysis) {
        const project = this.app.currentProject;
        return `# ${project.name}

${project.description || ''}

## Tipo de Aplicación
**${analysis.appType.primary}** (Confianza: ${analysis.appType.confidence}%)

## Tecnologías Sugeridas
- Framework: ${analysis.appType.suggestedFramework}
${analysis.appType.needsDatabase ? '- Base de datos: MySQL' : ''}

## Pantallas Generadas
${analysis.validatedScreens.map(s => `- ${s.title} (${s.complete}% completa)`).join('\n')}

## Instalación

\`\`\`bash
npm install
\`\`\`

## Configuración

${analysis.appType.needsDatabase ? `
### Base de Datos

1. Asegúrate de tener MySQL instalado y corriendo
2. Crea la base de datos:
\`\`\`bash
mysql -u root -p < database/schema.sql
\`\`\`
3. Configura las variables de entorno en \`.env\`
` : ''}

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Producción

\`\`\`bash
npm run build
npm start
\`\`\`

---
Generado con FlowForge UX/UI Generator`;
    }
}

// ============================================
// TECHNICAL PROMPT GENERATOR
// ============================================
class TechnicalPromptGenerator {
    constructor(app, analyzer, structureGenerator) {
        this.app = app;
        this.analyzer = analyzer;
        this.structureGenerator = structureGenerator;
    }

    generate() {
        const analysis = this.analyzer.analysisResults;
        const structure = this.structureGenerator.structure;
        const project = this.app.currentProject;

        let prompt = this.generateHeader(project, analysis);
        prompt += this.generateProjectContext(project, analysis);
        prompt += this.generateStructureOverview(structure);
        prompt += this.generateSetupInstructions(structure, analysis);
        prompt += this.generateDevelopmentSteps(structure, analysis);
        prompt += this.generateScreensImplementation(analysis);
        prompt += this.generateNavigationImplementation(analysis);
        prompt += this.generateStylingGuidelines();
        prompt += this.generateTestingGuidelines();
        prompt += this.generateFinalChecklist();

        return prompt;
    }

    generateHeader(project, analysis) {
        return `# 🚀 INSTRUCCIONES TÉCNICAS DE DESARROLLO
# Proyecto: ${project.name}
# Tipo: ${analysis.appType.primary.toUpperCase()}
# Generado: ${new Date().toLocaleDateString()}

---

`;
    }

    generateProjectContext(project, analysis) {
        return `## 📋 CONTEXTO DEL PROYECTO

**Nombre:** ${project.name}
**Categoría:** ${project.category || 'N/A'}
**Descripción:** ${project.description || 'N/A'}

**Análisis de Pantallas:**
- Total de pantallas: ${analysis.totalScreens}
- Pantallas validadas: ${analysis.validatedScreens.filter(v => v.matched).length}
- Componentes detectados: ${analysis.components.length}
- Tipo de aplicación: ${analysis.appType.primary} (${analysis.appType.confidence}% confianza)
${analysis.appType.needsDatabase ? '- **Requiere base de datos:** Sí (MySQL)' : '- **Requiere base de datos:** No'}

---

`;
    }

    generateStructureOverview(structure) {
        return `## 📁 ESTRUCTURA DEL PROYECTO

El workspace ya contiene la siguiente estructura:

\`\`\`
${structure.projectName}/
${structure.folders.map(f => `├── ${f}/`).join('\n')}
${structure.files.map(f => `├── ${f.path}`).join('\n')}
\`\`\`

---

`;
    }

    generateSetupInstructions(structure, analysis) {
        let instructions = `## ⚙️ CONFIGURACIÓN INICIAL

### Paso 1: Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

**Dependencias instaladas:**
${structure.dependencies.map(d => `- ${d}`).join('\n')}

`;

        if (analysis.appType.needsDatabase) {
            instructions += `### Paso 2: Configurar Base de Datos

**IMPORTANTE:** Antes de continuar, solicita al usuario la configuración de MySQL:

1. Pregunta: "¿Tienes MySQL instalado? (Sí/No)"
2. Si NO: Indica cómo instalar MySQL para su sistema operativo
3. Si SÍ: Solicita credenciales:
   - Host (por defecto: localhost)
   - Usuario (por defecto: root)
   - Contraseña
   - Nombre de base de datos (sugerido: ${structure.projectName}_db)

4. Ejecuta el schema:
\`\`\`bash
mysql -u [usuario] -p < database/schema.sql
\`\`\`

5. Actualiza el archivo \`.env\` con las credenciales proporcionadas

`;
        }

        instructions += `### ${analysis.appType.needsDatabase ? 'Paso 3' : 'Paso 2'}: Verificar Configuración

Ejecuta el servidor de desarrollo para verificar que todo está configurado:

\`\`\`bash
npm run dev
\`\`\`

---

`;
        return instructions;
    }

    generateDevelopmentSteps(structure, analysis) {
        const screens = this.analyzer.uploadedScreens;
        
        return `## 🛠️ PASOS DE DESARROLLO

### Fase 1: Integración de Pantallas HTML

El usuario ha subido ${screens.length} pantallas HTML. Tu tarea es integrarlas en la estructura del proyecto:

${screens.map((screen, i) => `
#### ${i + 1}. ${screen.title} (\`${screen.filename}\`)

**Acciones:**
1. Analiza el HTML de \`${screen.filename}\`
2. Extrae componentes reutilizables (botones, formularios, cards, etc.)
${structure.type === 'spa' ? `3. Crea un componente React en \`src/pages/${screen.title.replace(/\s+/g, '')}.jsx\`
4. Convierte el HTML a JSX siguiendo las convenciones de React` : `3. Crea una vista EJS en \`views/${screen.filename.replace('.html', '.ejs')}\`
4. Crea la ruta correspondiente en \`server/routes/\``}
5. Aplica los estilos extraídos a ${structure.type === 'spa' ? 'CSS modules o styled-components' : '\`public/css/\`'}

**Componentes detectados:**
${screen.components.map(c => `- ${c.type} (${c.count})`).join('\n')}

${screen.forms.length > 0 ? `**Formularios encontrados:**
${screen.forms.map((f, fi) => `- Formulario ${fi + 1}: ${f.fields.length} campos (${f.method || 'GET'} ${f.action || '/'})`).join('\n')}

**Importante:** Implementa validación client-side y server-side para estos formularios.` : ''}

`).join('')}

### Fase 2: Implementar Navegación

${this.generateNavigationInstructions(analysis)}

### Fase 3: Conectar con Backend ${analysis.appType.needsDatabase ? '(Base de Datos)' : ''}

${analysis.appType.needsDatabase ? this.generateDatabaseInstructions(analysis, screens) : 'Esta aplicación no requiere base de datos. Puedes usar estado local o LocalStorage para persistencia.'}

---

`;
    }

    generateNavigationInstructions(analysis) {
        const nav = analysis.navigation;
        
        let instructions = `Se detectaron los siguientes patrones de navegación:

`;

        if (nav.flows.length > 0) {
            instructions += `**Flujos de navegación detectados:**
${nav.flows.map((flow, i) => `${i + 1}. ${flow.join(' → ')}`).join('\n')}

`;
        }

        if (nav.internal.length > 0) {
            instructions += `**Enlaces internos (${nav.internal.length}):**
${nav.internal.slice(0, 5).map(l => `- ${l.from} → ${l.to} (${l.label})`).join('\n')}
${nav.internal.length > 5 ? `... y ${nav.internal.length - 5} más` : ''}

`;
        }

        if (nav.orphans.length > 0) {
            instructions += `**⚠️ Enlaces rotos detectados (${nav.orphans.length}):**
${nav.orphans.map(o => `- ${o.from} → ${o.to} (FALTA CREAR)`).join('\n')}

**Acción requerida:** Crea las pantallas faltantes o actualiza los enlaces.

`;
        }

        instructions += `
**Instrucciones de implementación:**
${this.structureGenerator.structure.type === 'spa' ? `
1. Usa React Router para manejar la navegación
2. Crea rutas en \`App.jsx\` para cada pantalla
3. Implementa navegación programática con \`useNavigate\`
4. Agrega un componente de navegación global (Navbar)` : `
1. Define rutas en \`server/routes/\` para cada pantalla
2. Renderiza las vistas EJS correspondientes
3. Implementa navegación con enlaces \`<a href="">\`
4. Crea un layout compartido para header/footer`}

`;
        return instructions;
    }

    generateDatabaseInstructions(analysis, screens) {
        const hasForms = screens.some(s => s.forms.length > 0);
        
        return `
**Modelos a crear:**

Basándote en los formularios y funcionalidad detectada, crea los siguientes modelos:

${hasForms ? screens.filter(s => s.forms.length > 0).map(screen => `
- **${screen.title}:** 
  ${screen.forms.map(f => `Campos: ${f.fields.map(field => field.name).join(', ')}`).join('\n  ')}
`).join('') : '- Usuarios (ejemplo en schema.sql)'}

**Operaciones CRUD requeridas:**

1. **CREATE:** Implementa endpoints POST para formularios
2. **READ:** Implementa endpoints GET para listar/mostrar datos
3. **UPDATE:** Implementa endpoints PUT/PATCH para edición
4. **DELETE:** Implementa endpoints DELETE si es necesario

**Ejemplo de modelo (Sequelize):**

\`\`\`javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: DataTypes.STRING
  });
};
\`\`\`

**Seguridad:**
- Usa bcrypt para hashear contraseñas
- Implementa JWT para autenticación si es necesario
- Valida y sanitiza todas las entradas
`;
    }

    generateScreensImplementation(analysis) {
        return `## 🎨 IMPLEMENTACIÓN DE PANTALLAS

Para cada pantalla, sigue este checklist:

### Checklist por Pantalla:

- [ ] HTML/JSX estructurado correctamente
- [ ] Componentes reutilizables extraídos
- [ ] Estilos aplicados (responsive)
- [ ] Formularios con validación
- [ ] Navegación funcional
- [ ] Estados de carga implementados
- [ ] Manejo de errores
- [ ] Accesibilidad (ARIA labels, teclado)
- [ ] SEO básico (meta tags, títulos)
- [ ] Testing básico

### Pantallas por Prioridad:

${analysis.validatedScreens
  .sort((a, b) => b.complete - a.complete)
  .map((screen, i) => `${i + 1}. **${screen.title}** - ${screen.complete}% completa ${screen.matched ? '✓' : '(sin match con flujo)'}`)
  .join('\n')}

**Estrategia:** Implementa primero las pantallas más completas y críticas para el flujo.

---

`;
    }

    generateNavigationImplementation(analysis) {
        return `## 🧭 IMPLEMENTACIÓN DE NAVEGACIÓN

### Rutas a Implementar:

${analysis.validatedScreens.map(screen => {
    const route = screen.title.toLowerCase().replace(/\s+/g, '-');
    return `- \`/${route}\` → ${screen.title}`;
}).join('\n')}

### Protección de Rutas:

Si la aplicación requiere autenticación:

${this.structureGenerator.structure.type === 'spa' ? `
\`\`\`jsx
// src/components/ProtectedRoute.jsx
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = // tu lógica de autenticación
  return isAuthenticated ? children : <Navigate to="/login" />;
};
\`\`\`
` : `
\`\`\`javascript
// server/middleware/auth.js
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}
\`\`\`
`}

---

`;
    }

    generateStylingGuidelines() {
        const tokens = this.app.tokens || [];
        
        return `## 🎨 GUÍA DE ESTILOS

### Design Tokens Definidos:

${tokens.length > 0 ? tokens.map(token => `
- **${token.name}:** \`${token.value}\` (${token.category})
  ${token.description ? `  ${token.description}` : ''}`).join('\n') : 'No se definieron design tokens. Usa valores por defecto.'}

### Principios de Diseño:

1. **Responsive First:** Mobile → Tablet → Desktop
2. **Consistencia:** Usa los design tokens en toda la aplicación
3. **Accesibilidad:** Contraste mínimo WCAG AA
4. **Performance:** Optimiza imágenes y CSS

### Breakpoints Sugeridos:

\`\`\`css
/* Mobile: 320px - 767px */
/* Tablet: 768px - 1023px */
/* Desktop: 1024px+ */
\`\`\`

---

`;
    }

    generateTestingGuidelines() {
        return `## 🧪 TESTING

### Tests Mínimos Requeridos:

1. **Unit Tests:**
   - Funciones utilitarias
   - Validación de formularios
   - Lógica de negocio

2. **Integration Tests:**
   - Rutas de API
   - Conexiones a base de datos
   - Flujos de autenticación

3. **E2E Tests (opcional):**
   - Flujos críticos del usuario
   - Formularios completos
   - Navegación entre pantallas

### Herramientas Sugeridas:

${this.structureGenerator.structure.type === 'spa' ? '- Jest + React Testing Library' : '- Jest + Supertest'}
- ESLint para linting
- Prettier para formateo

---

`;
    }

    generateFinalChecklist() {
        return `## ✅ CHECKLIST FINAL

Antes de considerar la aplicación completa, verifica:

### Funcionalidad:
- [ ] Todas las pantallas están implementadas
- [ ] La navegación funciona correctamente
- [ ] Los formularios validan y envían datos
${this.analyzer.analysisResults.appType.needsDatabase ? '- [ ] La base de datos está conectada y funcional' : ''}
- [ ] No hay enlaces rotos
- [ ] Los estados de carga se muestran apropiadamente
- [ ] Los errores se manejan gracefully

### Calidad:
- [ ] El código está limpio y comentado
- [ ] No hay console.errors en producción
- [ ] Las variables de entorno están documentadas
- [ ] El README está actualizado
- [ ] Los tests pasan exitosamente

### Deployment:
- [ ] El build de producción funciona
- [ ] Las variables de entorno están configuradas
- [ ] Los assets estáticos se sirven correctamente
${this.analyzer.analysisResults.appType.needsDatabase ? '- [ ] Las migraciones de BD están documentadas' : ''}

---

## 🎯 OBJETIVO FINAL

Dejar una aplicación completamente funcional que:

1. Cargue sin errores
2. Permita navegar entre todas las pantallas
3. Procese formularios correctamente
4. Tenga estilos responsive
5. Esté lista para deploy

**¡Mucho éxito con el desarrollo!** 🚀

---
*Generado automáticamente por FlowForge UX/UI Generator*
*Fecha: ${new Date().toLocaleString()}*
`;
    }
}

// ====================
// VALIDATION SYSTEM
// ====================

class ValidationManager {
    constructor(app) {
        this.app = app;
        this.rules = this.initializeRules();
    }

    initializeRules() {
        return {
            flows: [
                {
                    id: 'flow-empty-steps',
                    name: 'Flujos sin pasos',
                    severity: 'error',
                    check: (flow) => !flow.steps || flow.steps.length === 0,
                    message: (flow) => `El flujo "${flow.name}" no tiene pasos definidos`
                },
                {
                    id: 'flow-few-steps',
                    name: 'Flujos con pocos pasos',
                    severity: 'warning',
                    check: (flow) => flow.steps && flow.steps.length < 3,
                    message: (flow) => `El flujo "${flow.name}" tiene solo ${flow.steps.length} pasos (recomendado: 3+)`
                },
                {
                    id: 'flow-no-description',
                    name: 'Flujos sin descripción',
                    severity: 'info',
                    check: (flow) => !flow.description || flow.description.trim() === '',
                    message: (flow) => `El flujo "${flow.name}" no tiene descripción`
                },
                {
                    id: 'flow-long-steps',
                    name: 'Pasos muy largos',
                    severity: 'warning',
                    check: (flow) => flow.steps && flow.steps.some(s => s.length > 100),
                    message: (flow) => `El flujo "${flow.name}" tiene pasos demasiado largos (recomendado: <100 caracteres)`
                }
            ],
            tokens: [
                {
                    id: 'token-duplicate-names',
                    name: 'Tokens duplicados',
                    severity: 'error',
                    check: (token, allTokens) => allTokens.filter(t => t.name === token.name).length > 1,
                    message: (token) => `El token "${token.name}" está duplicado`
                },
                {
                    id: 'token-no-description',
                    name: 'Tokens sin descripción',
                    severity: 'info',
                    check: (token) => !token.description || token.description.trim() === '',
                    message: (token) => `El token "${token.name}" no tiene descripción`
                },
                {
                    id: 'token-invalid-color',
                    name: 'Colores inválidos',
                    severity: 'error',
                    check: (token) => {
                        if (token.category !== 'color') return false;
                        const colorRegex = /^(#[0-9A-Fa-f]{3,8}|rgb|rgba|hsl|hsla)/;
                        return !colorRegex.test(token.value);
                    },
                    message: (token) => `El token de color "${token.name}" tiene un valor inválido: ${token.value}`
                },
                {
                    id: 'token-naming-convention',
                    name: 'Convención de nombres',
                    severity: 'warning',
                    check: (token) => {
                        // Check if follows kebab-case or camelCase
                        const hasSpaces = token.name.includes(' ');
                        const hasSpecialChars = /[^a-zA-Z0-9-_]/.test(token.name);
                        return hasSpaces || hasSpecialChars;
                    },
                    message: (token) => `El token "${token.name}" no sigue convenciones de nomenclatura (usa kebab-case o camelCase)`
                }
            ],
            screens: [
                {
                    id: 'screen-no-components',
                    name: 'Pantallas sin componentes',
                    severity: 'warning',
                    check: (screen) => !screen.components || screen.components.length === 0,
                    message: (screen) => `La pantalla "${screen.name}" no tiene componentes definidos`
                },
                {
                    id: 'screen-no-purpose',
                    name: 'Pantallas sin propósito',
                    severity: 'warning',
                    check: (screen) => !screen.purpose || screen.purpose.trim() === '',
                    message: (screen) => `La pantalla "${screen.name}" no tiene propósito definido`
                },
                {
                    id: 'screen-no-flows',
                    name: 'Pantallas sin flujos',
                    severity: 'info',
                    check: (screen) => !screen.relatedFlows || screen.relatedFlows.length === 0,
                    message: (screen) => `La pantalla "${screen.name}" no está asociada a ningún flujo`
                },
                {
                    id: 'screen-orphan-flow',
                    name: 'Flujos huérfanos',
                    severity: 'warning',
                    check: (screen, allScreens, allFlows) => {
                        if (!screen.relatedFlows || screen.relatedFlows.length === 0) return false;
                        return screen.relatedFlows.some(flowName => 
                            !allFlows.some(f => f.name.toLowerCase().includes(flowName.toLowerCase()))
                        );
                    },
                    message: (screen) => `La pantalla "${screen.name}" referencia flujos que no existen`
                }
            ],
            project: [
                {
                    id: 'project-no-flows',
                    name: 'Proyecto sin flujos',
                    severity: 'error',
                    check: (project, data) => data.flows.length === 0,
                    message: () => 'El proyecto no tiene flujos definidos'
                },
                {
                    id: 'project-unbalanced',
                    name: 'Proyecto desbalanceado',
                    severity: 'warning',
                    check: (project, data) => {
                        const hasFlows = data.flows.length > 0;
                        const hasTokens = data.tokens.length > 0;
                        const hasScreens = data.screens.length > 0;
                        const count = [hasFlows, hasTokens, hasScreens].filter(Boolean).length;
                        return count === 1;
                    },
                    message: () => 'El proyecto solo tiene un tipo de elemento (considere agregar tokens y pantallas)'
                },
                {
                    id: 'project-naming-consistency',
                    name: 'Consistencia en nomenclatura',
                    severity: 'info',
                    check: (project, data) => {
                        const allNames = [
                            ...data.flows.map(f => f.name),
                            ...data.tokens.map(t => t.name),
                            ...data.screens.map(s => s.name)
                        ];
                        const hasInconsistency = allNames.some(name => 
                            name.toLowerCase() !== name && name.toUpperCase() !== name
                        );
                        return !hasInconsistency && allNames.length > 3;
                    },
                    message: () => 'Considere establecer una convención de nomenclatura consistente'
                }
            ]
        };
    }

    validate() {
        const results = {
            timestamp: new Date().toISOString(),
            errors: [],
            warnings: [],
            info: [],
            score: 0,
            maxScore: 0
        };

        const data = {
            flows: this.app.flows,
            tokens: this.app.tokens,
            screens: this.app.screens,
            project: this.app.currentProject
        };

        // Validate flows
        data.flows.forEach(flow => {
            this.rules.flows.forEach(rule => {
                if (rule.check(flow, data.flows)) {
                    this.addIssue(results, rule, flow);
                } else {
                    results.maxScore += this.getScoreWeight(rule.severity);
                    results.score += this.getScoreWeight(rule.severity);
                }
            });
        });

        // Validate tokens
        data.tokens.forEach(token => {
            this.rules.tokens.forEach(rule => {
                if (rule.check(token, data.tokens)) {
                    this.addIssue(results, rule, token);
                } else {
                    results.maxScore += this.getScoreWeight(rule.severity);
                    results.score += this.getScoreWeight(rule.severity);
                }
            });
        });

        // Validate screens
        data.screens.forEach(screen => {
            this.rules.screens.forEach(rule => {
                if (rule.check(screen, data.screens, data.flows)) {
                    this.addIssue(results, rule, screen);
                } else {
                    results.maxScore += this.getScoreWeight(rule.severity);
                    results.score += this.getScoreWeight(rule.severity);
                }
            });
        });

        // Validate project
        this.rules.project.forEach(rule => {
            if (rule.check(data.project, data)) {
                this.addIssue(results, rule, data.project);
            } else {
                results.maxScore += this.getScoreWeight(rule.severity);
                results.score += this.getScoreWeight(rule.severity);
            }
        });

        // Calculate percentage
        results.percentage = results.maxScore > 0 
            ? Math.round((results.score / results.maxScore) * 100) 
            : 100;

        return results;
    }

    addIssue(results, rule, item) {
        const issue = {
            id: rule.id,
            name: rule.name,
            severity: rule.severity,
            message: rule.message(item),
            item: item.name || 'Proyecto'
        };

        results.maxScore += this.getScoreWeight(rule.severity);

        switch (rule.severity) {
            case 'error':
                results.errors.push(issue);
                break;
            case 'warning':
                results.warnings.push(issue);
                results.score += this.getScoreWeight(rule.severity) * 0.5; // 50% credit
                break;
            case 'info':
                results.info.push(issue);
                results.score += this.getScoreWeight(rule.severity) * 0.8; // 80% credit
                break;
        }
    }

    getScoreWeight(severity) {
        const weights = {
            error: 10,
            warning: 5,
            info: 2
        };
        return weights[severity] || 1;
    }

    getSuggestions(results) {
        const suggestions = [];

        if (results.errors.length > 0) {
            suggestions.push({
                type: 'error',
                title: 'Errores críticos detectados',
                description: `Hay ${results.errors.length} errores que deben corregirse inmediatamente`,
                action: 'Revisar errores'
            });
        }

        if (results.warnings.length > 5) {
            suggestions.push({
                type: 'warning',
                title: 'Múltiples advertencias',
                description: 'Considere revisar las advertencias para mejorar la calidad del proyecto',
                action: 'Ver advertencias'
            });
        }

        if (results.percentage < 70) {
            suggestions.push({
                type: 'improvement',
                title: 'Score bajo',
                description: 'El proyecto necesita mejoras significativas para alcanzar buenas prácticas',
                action: 'Ver recomendaciones'
            });
        } else if (results.percentage >= 90) {
            suggestions.push({
                type: 'success',
                title: '¡Excelente trabajo!',
                description: 'El proyecto cumple con la mayoría de las buenas prácticas',
                action: null
            });
        }

        // Best practices suggestions
        const totalItems = this.app.flows.length + this.app.tokens.length + this.app.screens.length;
        if (totalItems < 5) {
            suggestions.push({
                type: 'info',
                title: 'Proyecto pequeño',
                description: 'Considere agregar más elementos para un proyecto más completo',
                action: null
            });
        }

        return suggestions;
    }

    exportReport(results) {
        const report = {
            project: this.app.currentProject?.name || 'Sin nombre',
            date: new Date().toLocaleString('es-ES'),
            score: `${results.percentage}%`,
            summary: {
                errors: results.errors.length,
                warnings: results.warnings.length,
                info: results.info.length
            },
            details: {
                errors: results.errors,
                warnings: results.warnings,
                info: results.info
            },
            suggestions: this.getSuggestions(results)
        };

        return JSON.stringify(report, null, 2);
    }
}

// ====================
// PWA & SERVICE WORKER
// ====================

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.init();
    }

    async init() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
                
                console.log('[PWA] Service Worker registrado:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[PWA] Nueva versión encontrada');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
                // Listen for messages from SW
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleSWMessage(event.data);
                });
                
            } catch (error) {
                console.error('[PWA] Error al registrar Service Worker:', error);
            }
        }

        // Setup install prompt
        this.setupInstallPrompt();
        
        // Setup online/offline detection
        this.setupOnlineDetection();
        
        // Setup background sync
        this.setupBackgroundSync();
        
        // Check if already installed
        this.checkIfInstalled();
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('[PWA] Install prompt disponible');
            
            // Show install banner
            setTimeout(() => this.showInstallBanner(), 3000);
        });

        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App instalada exitosamente');
            this.hideInstallBanner();
            this.showNotification('¡FlowForge instalado! Ahora puedes trabajar offline', 'success');
            this.deferredPrompt = null;
        });

        // Install button handler
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.addEventListener('click', () => this.installApp());
        }

        const installClose = document.getElementById('install-close');
        if (installClose) {
            installClose.addEventListener('click', () => this.hideInstallBanner());
        }
    }

    showInstallBanner() {
        if (!this.deferredPrompt) return;
        if (localStorage.getItem('install-banner-dismissed')) return;
        
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.style.display = 'flex';
            setTimeout(() => banner.classList.add('show'), 100);
        }
    }

    hideInstallBanner() {
        const banner = document.getElementById('install-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.style.display = 'none', 300);
        }
        localStorage.setItem('install-banner-dismissed', 'true');
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log('[PWA] User choice:', outcome);
        
        if (outcome === 'accepted') {
            console.log('[PWA] Usuario aceptó instalar');
        } else {
            console.log('[PWA] Usuario rechazó instalar');
        }
        
        this.deferredPrompt = null;
        this.hideInstallBanner();
    }

    setupOnlineDetection() {
        const updateOnlineStatus = () => {
            this.isOnline = navigator.onLine;
            const indicator = document.getElementById('offline-indicator');
            
            if (!this.isOnline) {
                console.log('[PWA] Modo offline');
                if (indicator) {
                    indicator.style.display = 'flex';
                    setTimeout(() => indicator.classList.add('show'), 100);
                }
                this.showNotification('Sin conexión - Trabajando en modo offline', 'warning', '📡 Offline', 0);
            } else {
                console.log('[PWA] Conexión restaurada');
                if (indicator) {
                    indicator.classList.remove('show');
                    setTimeout(() => indicator.style.display = 'none', 300);
                }
                this.showNotification('Conexión restaurada', 'success', '✅ Online', 3000);
                this.syncPendingChanges();
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Initial check
        updateOnlineStatus();
    }

    async setupBackgroundSync() {
        // Background sync solo funciona dentro de un Service Worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if ('sync' in registration) {
                    await registration.sync.register('sync-data');
                    console.log('[PWA] Background sync registrado');
                }
            } catch (error) {
                console.log('[PWA] Background sync no soportado:', error);
            }
        }
    }

    async syncPendingChanges() {
        if (!this.isOnline || this.syncQueue.length === 0) return;

        console.log('[PWA] Sincronizando cambios pendientes:', this.syncQueue.length);
        
        const queue = [...this.syncQueue];
        this.syncQueue = [];
        
        for (const item of queue) {
            try {
                await item.action();
                console.log('[PWA] Cambio sincronizado:', item.id);
            } catch (error) {
                console.error('[PWA] Error al sincronizar:', error);
                this.syncQueue.push(item);
            }
        }
        
        if (this.syncQueue.length === 0) {
            this.showNotification('Todos los cambios sincronizados', 'success', '✅ Sync', 2000);
        }
    }

    queueForSync(id, action) {
        this.syncQueue.push({ id, action, timestamp: Date.now() });
        console.log('[PWA] Agregado a cola de sincronización:', id);
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--accent-primary);
            border-radius: var(--radius-lg);
            padding: 20px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            max-width: 350px;
        `;
        
        notification.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: var(--accent-primary);">🎉 Nueva versión disponible</h4>
            <p style="margin: 0 0 15px 0; font-size: 0.9rem; color: var(--text-secondary);">
                Hay una actualización de FlowForge disponible
            </p>
            <div style="display: flex; gap: 10px;">
                <button id="update-now-btn" style="flex: 1; padding: 10px; background: var(--accent-gradient); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">
                    Actualizar ahora
                </button>
                <button id="update-later-btn" style="padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer;">
                    Después
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        document.getElementById('update-now-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        document.getElementById('update-later-btn').addEventListener('click', () => {
            notification.remove();
        });
    }

    handleSWMessage(data) {
        console.log('[PWA] Mensaje del SW:', data);
        
        if (data.type === 'SYNC_COMPLETE') {
            this.showNotification(`Sincronizados ${data.count} elementos`, 'success', '✅ Sync', 2000);
        }
    }

    showNotification(message, type, title, duration) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type, title, duration);
        }
    }

    checkIfInstalled() {
        // Check if running as PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                             window.navigator.standalone ||
                             document.referrer.includes('android-app://');
        
        if (isStandalone) {
            console.log('[PWA] Corriendo como app instalada');
            // Don't show install banner
            localStorage.setItem('install-banner-dismissed', 'true');
        }
    }

    async clearCache() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            
            return new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                navigator.serviceWorker.controller.postMessage(
                    { type: 'CLEAR_CACHE' },
                    [messageChannel.port2]
                );
            });
        }
    }

    async cacheUrls(urls) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_URLS',
                urls: urls
            });
        }
    }

    // ============================================
    // DEVELOPMENT PHASE METHODS
    // ============================================

    initDevelopmentPhase() {
        this.htmlAnalyzer = new HTMLScreenAnalyzer(this);
        this.developmentPhaseActive = true;
        
        // Enable development tab
        const devTab = document.querySelector('[data-tab="development"]');
        if (devTab) {
            devTab.disabled = false;
            devTab.title = 'Fase de desarrollo técnico';
        }
        
        // Setup file upload handlers
        this.setupHTMLUpload();
    }

    setupHTMLUpload() {
        const uploadZone = document.getElementById('htmlUploadZone');
        const fileInput = document.getElementById('htmlFilesInput');
        
        if (!uploadZone || !fileInput) return;

        // Drag & Drop handlers
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.html'));
            if (files.length > 0) {
                await this.handleHTMLFiles(files);
            }
        });

        // File input handler
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                await this.handleHTMLFiles(files);
            }
        });

        // Click to upload
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    async handleHTMLFiles(files) {
        try {
            this.showNotification(`Analizando ${files.length} archivos HTML...`, 'info', 'Desarrollo', 3000);
            
            // Show uploaded files list
            const filesList = document.getElementById('uploadedFilesList');
            const filesContainer = document.getElementById('filesListContainer');
            
            if (filesList && filesContainer) {
                filesList.style.display = 'block';
                filesContainer.innerHTML = files.map((f, i) => `
                    <div class="uploaded-file-item">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${f.name}</span>
                        <span class="file-size">${(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                `).join('');
            }

            // Analyze screens
            const analysis = await this.htmlAnalyzer.analyzeScreens(files);
            
            // Show analysis results
            this.renderAnalysisResults(analysis);
            
            // Generate project structure
            this.structureGenerator = new ProjectStructureGenerator(this, this.htmlAnalyzer);
            const structure = this.structureGenerator.generateStructure();
            
            // Show project structure
            this.renderProjectStructure(structure);
            
            // Generate technical prompt
            this.promptGenerator = new TechnicalPromptGenerator(this, this.htmlAnalyzer, this.structureGenerator);
            const technicalPrompt = this.promptGenerator.generate();
            
            // Show technical prompt
            this.renderTechnicalPrompt(technicalPrompt);
            
            // Show all steps
            document.getElementById('devStep2').style.display = 'block';
            document.getElementById('devStep3').style.display = 'block';
            document.getElementById('devStep4').style.display = 'block';
            
            this.showNotification('Análisis completado exitosamente', 'success', 'Desarrollo', 3000);
            
        } catch (error) {
            console.error('Error analyzing HTML files:', error);
            this.showNotification('Error al analizar archivos HTML', 'error', 'Desarrollo', 5000);
        }
    }

    renderAnalysisResults(analysis) {
        const container = document.getElementById('analysisResults');
        if (!container) return;

        const issuesByType = {
            error: analysis.issues.filter(i => i.type === 'error'),
            warning: analysis.issues.filter(i => i.type === 'warning'),
            info: analysis.issues.filter(i => i.type === 'info')
        };

        container.innerHTML = `
            <div class="analysis-summary">
                <div class="summary-card">
                    <h4>📊 Resumen del Análisis</h4>
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-label">Pantallas totales:</span>
                            <span class="stat-value">${analysis.totalScreens}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Validadas:</span>
                            <span class="stat-value">${analysis.validatedScreens.filter(v => v.matched).length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Componentes detectados:</span>
                            <span class="stat-value">${analysis.components.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Tipo de app:</span>
                            <span class="stat-value">${analysis.appType.primary}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Requiere BD:</span>
                            <span class="stat-value">${analysis.appType.needsDatabase ? '✅ Sí' : '❌ No'}</span>
                        </div>
                    </div>
                </div>

                <div class="issues-summary">
                    <h4>🔍 Problemas Detectados</h4>
                    ${issuesByType.error.length > 0 ? `
                        <div class="issue-group error">
                            <h5>❌ Errores (${issuesByType.error.length})</h5>
                            ${issuesByType.error.map(issue => `
                                <div class="issue-item">
                                    <strong>${issue.category}:</strong> ${issue.message}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${issuesByType.warning.length > 0 ? `
                        <div class="issue-group warning">
                            <h5>⚠️ Advertencias (${issuesByType.warning.length})</h5>
                            ${issuesByType.warning.map(issue => `
                                <div class="issue-item">
                                    <strong>${issue.category}:</strong> ${issue.message}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${analysis.issues.length === 0 ? '<p style="color: var(--success);">✅ No se detectaron problemas</p>' : ''}
                </div>

                <div class="validated-screens">
                    <h4>✓ Pantallas Validadas</h4>
                    <div class="screens-grid">
                        ${analysis.validatedScreens.map(screen => `
                            <div class="screen-card ${screen.matched ? 'matched' : 'unmatched'}">
                                <h5>${screen.title}</h5>
                                <p class="screen-file">${screen.screen}</p>
                                <div class="screen-meta">
                                    <span class="${screen.matched ? 'badge-success' : 'badge-warning'}">
                                        ${screen.matched ? '✓ Validada' : '⚠ Sin match'}
                                    </span>
                                    <span class="completeness-badge" style="background: ${this.getCompletenessColor(screen.complete)};">
                                        ${screen.complete}% completa
                                    </span>
                                </div>
                                ${screen.flow ? `<p class="matched-flow">Flujo: ${screen.flow}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getCompletenessColor(score) {
        if (score >= 90) return '#10b981';
        if (score >= 70) return '#3b82f6';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    }

    renderProjectStructure(structure) {
        const container = document.getElementById('projectStructure');
        if (!container) return;

        container.innerHTML = `
            <div class="structure-overview">
                <h4>📦 ${structure.projectName}</h4>
                <p class="structure-type">Tipo: ${structure.type.toUpperCase()}</p>
                
                <div class="structure-tree">
                    <div class="tree-item folder">
                        <span class="tree-icon">📁</span>
                        <span class="tree-name">${structure.projectName}/</span>
                    </div>
                    ${structure.folders.map(folder => `
                        <div class="tree-item folder">
                            <span class="tree-icon" style="margin-left: 20px;">📂</span>
                            <span class="tree-name">${folder}/</span>
                        </div>
                    `).join('')}
                    ${structure.files.slice(0, 10).map(file => `
                        <div class="tree-item file">
                            <span class="tree-icon" style="margin-left: 20px;">📄</span>
                            <span class="tree-name">${file.path}</span>
                        </div>
                    `).join('')}
                    ${structure.files.length > 10 ? `
                        <div class="tree-item">
                            <span style="margin-left: 20px; color: var(--text-secondary);">
                                ... y ${structure.files.length - 10} archivos más
                            </span>
                        </div>
                    ` : ''}
                </div>

                <div class="dependencies-list">
                    <h5>📦 Dependencias (${structure.dependencies.length})</h5>
                    <div class="deps-grid">
                        ${structure.dependencies.map(dep => `
                            <span class="dep-badge">${dep}</span>
                        `).join('')}
                    </div>
                </div>

                <div class="scripts-list">
                    <h5>⚡ Scripts Disponibles</h5>
                    ${Object.entries(structure.scripts).map(([name, cmd]) => `
                        <div class="script-item">
                            <code>npm run ${name}</code>
                            <span class="script-desc">${cmd}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTechnicalPrompt(prompt) {
        const container = document.getElementById('technicalPromptContent');
        if (!container) return;

        // Store prompt for copy/download
        window.technicalPrompt = prompt;

        // Convert markdown-style prompt to HTML
        const htmlPrompt = prompt
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^\*\*(.+?):\*\*/gm, '<strong>$1:</strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code class="language-$1">$2</code></pre>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/^---$/gm, '<hr>');

        container.innerHTML = `<div class="prompt-formatted">${htmlPrompt}</div>`;
    }

    async downloadProjectZip() {
        if (!this.structureGenerator || !this.structureGenerator.structure) {
            this.showNotification('No hay estructura de proyecto generada', 'warning', 'Desarrollo', 3000);
            return;
        }

        try {
            this.showNotification('Generando archivo ZIP...', 'info', 'Desarrollo', 2000);

            // Dynamically load JSZip from CDN
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }

            const zip = new JSZip();
            const structure = this.structureGenerator.structure;

            // Add folders
            structure.folders.forEach(folder => {
                zip.folder(folder);
            });

            // Add files
            structure.files.forEach(file => {
                zip.file(file.path, file.content);
            });

            // Add HTML screens
            if (this.htmlAnalyzer && this.htmlAnalyzer.uploadedScreens) {
                const screensFolder = structure.type === 'spa' ? 'public/screens' : 'views/screens';
                zip.folder(screensFolder);
                
                this.htmlAnalyzer.uploadedScreens.forEach(screen => {
                    zip.file(`${screensFolder}/${screen.filename}`, screen.content);
                });
            }

            // Generate ZIP
            const content = await zip.generateAsync({ type: 'blob' });
            
            // Download
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${structure.projectName}-starter.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Estructura de proyecto descargada', 'success', 'Desarrollo', 3000);

        } catch (error) {
            console.error('Error generating ZIP:', error);
            this.showNotification('Error al generar archivo ZIP', 'error', 'Desarrollo', 5000);
        }
    }

    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    copyTechnicalPrompt() {
        if (window.technicalPrompt) {
            navigator.clipboard.writeText(window.technicalPrompt)
                .then(() => {
                    this.showNotification('Prompt copiado al portapapeles', 'success', 'Desarrollo', 2000);
                })
                .catch(() => {
                    this.showNotification('Error al copiar prompt', 'error', 'Desarrollo', 3000);
                });
        }
    }

    downloadTechnicalPrompt() {
        if (window.technicalPrompt) {
            const blob = new Blob([window.technicalPrompt], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentProject.name}-desarrollo-prompt.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Prompt descargado', 'success', 'Desarrollo', 2000);
        }
    }
}

// ====================
// GLOBAL STATE - Compatible with origen file structure
// ====================
let state = {
    projects: [],
    currentProjectId: null,
    projectToDelete: null,
    currentFlowTier: 'mvp',
    selectedPromptSections: ['whatIs', 'targetAudience', 'needsSolved', 'appType', 'flowsMvp', 'tokens'],
    searchQuery: '',
    activeFilter: 'all',
    isLoadingProject: false
};

// Initialize app
let app;
let pwaManager;

document.addEventListener('DOMContentLoaded', () => {
    app = new FlowForgeApp();
    pwaManager = new PWAManager();
    window.app = app;
    window.pwaManager = pwaManager;
    window.state = state;
    
    // Load saved projects
    loadProjects();
    loadSavedAPIKey();
    setupAPIKeyAutosave();
    setupGlobalEventListeners();
});

function loadProjects() {
    try {
        const saved = localStorage.getItem('flowforge-projects');
        if (saved) {
            state.projects = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        state.projects = [];
    }
}

function saveProjects() {
    try {
        localStorage.setItem('flowforge-projects', JSON.stringify(state.projects));
    } catch (error) {
        console.error('Error saving projects:', error);
    }
}

function setupGlobalEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Tier buttons for flows
    document.querySelectorAll('.tier-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTier(btn.dataset.tier));
    });

    // Prompt section toggles - sync state with HTML active buttons
    state.selectedPromptSections = [];
    document.querySelectorAll('.prompt-section-toggle').forEach(btn => {
        btn.addEventListener('click', () => togglePromptSection(btn));
        // Sync initial state from HTML
        if (btn.classList.contains('active')) {
            state.selectedPromptSections.push(btn.dataset.section);
        }
    });
    
    // Initial prompt update if project exists
    setTimeout(() => {
        if (app && app.currentProject) {
            updatePromptOutput();
        }
    }, 100);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
}

function switchTier(tier) {
    state.currentFlowTier = tier;
    document.querySelectorAll('.tier-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tier === tier);
    });
    
    // Re-render flows with new tier
    if (app && app.currentProject && app.currentProject.data && app.currentProject.data.flows) {
        renderFlows(app.currentProject.data.flows);
    }
}

function togglePromptSection(btn) {
    btn.classList.toggle('active');
    const section = btn.dataset.section;
    
    if (btn.classList.contains('active')) {
        if (!state.selectedPromptSections.includes(section)) {
            state.selectedPromptSections.push(section);
        }
    } else {
        state.selectedPromptSections = state.selectedPromptSections.filter(s => s !== section);
    }
    
    updatePromptOutput();
}

function updatePromptOutput() {
    const promptOutput = document.getElementById('promptOutput');
    if (!promptOutput) return;
    
    // Get current project
    let project = null;
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
    }
    if (!project) {
        promptOutput.textContent = 'No hay proyecto seleccionado';
        return;
    }

    let prompt = `# Brief de Diseño UX/UI para ${project.name}\n\n`;
    prompt += `## Contexto del Proyecto\n`;
    prompt += `Categoría: ${project.category || 'General'}\n\n`;

    const sections = {
        whatIs: { title: 'Qué es y qué hace', content: project.data?.whatIs },
        targetAudience: { title: 'Público Objetivo', content: project.data?.targetAudience },
        needsSolved: { title: 'Necesidades que Resuelve', content: project.data?.needsSolved },
        differentiators: { title: 'Diferenciadores', content: project.data?.differentiators },
        elevatorPitch: { title: 'Elevator Pitch', content: project.data?.elevatorPitch },
        appType: { title: 'Tipo de Aplicación', content: project.data?.appType },
        flowsMvp: { title: 'Flujos MVP', content: formatFlowsForPrompt(project.data?.flows, 'mvp') },
        flowsIntermediate: { title: 'Flujos Intermediate', content: formatFlowsForPrompt(project.data?.flows, 'intermediate') },
        flowsComplete: { title: 'Flujos Complete', content: formatFlowsForPrompt(project.data?.flows, 'complete') },
        generalRules: { title: 'Reglas Generales de la Aplicación', content: formatGeneralRulesForPrompt(project.data?.flows?._architecture?.generalRules) },
        architecture: { title: 'Arquitectura de Pantallas', content: formatArchitectureForPrompt(project.data?.flows?._architecture) },
        consistency: { title: 'Guía de Consistencia', content: formatConsistencyForPrompt(project.data?.flows?._architecture?.consistencyRules) },
        tokens: { title: 'Design Tokens', content: formatTokensForPrompt(project.data?.tokens) },
        uiComponents: { title: 'Componentes UI', content: project.data?.uiComponents },
        metrics: { title: 'Métricas de Éxito', content: project.data?.metricsDetail }
    };

    state.selectedPromptSections.forEach(sectionKey => {
        const section = sections[sectionKey];
        if (section && section.content) {
            prompt += `## ${section.title}\n${section.content}\n\n`;
        }
    });

    prompt += `---\n\nCon base en este brief, genera los diseños de alta fidelidad para ${project.name}, respetando los design tokens y flujos especificados.`;

    promptOutput.textContent = prompt;
}

function formatFlowsForPrompt(flows, tier = null) {
    if (!flows) return '';
    
    let result = '';
    const tiers = tier ? [tier] : ['mvp', 'intermediate', 'complete'];
    
    tiers.forEach(t => {
        if (flows[t] && flows[t].length > 0) {
            if (!tier) {
                result += `\n### ${t.toUpperCase()}\n`;
            }
            flows[t].forEach((flow, i) => {
                result += `\n${i + 1}. ${flow.screen}\n`;
                result += `   Descripción: ${flow.description}\n`;
                if (flow.context) {
                    result += `   Contexto: ${flow.context}\n`;
                }
                
                // Elementos UI
                result += `   \n   🎨 Elementos UI:\n`;
                flow.elements.forEach(el => {
                    result += `      • ${el}\n`;
                });
                
                // Elementos Globales
                if (flow.globalElements) {
                    result += `   \n   🏗️ Elementos Globales:\n`;
                    result += `      ${flow.globalElements.header ? '✓ Header' : '✗ Header'} | `;
                    result += `${flow.globalElements.bottomNav ? '✓ Bottom Nav' : '✗ Bottom Nav'} | `;
                    result += `${flow.globalElements.sidebar ? '✓ Sidebar' : '✗ Sidebar'}\n`;
                    if (flow.globalElements.note) {
                        result += `      Nota: ${flow.globalElements.note}\n`;
                    }
                }
                
                // Layout
                if (flow.layout) {
                    result += `   \n   📐 Layout:\n`;
                    result += `      Patrón: ${flow.layout.pattern}\n`;
                    result += `      Recomendación: ${flow.layout.recommendation}\n`;
                }
                
                // Navegación
                if (flow.navigation) {
                    result += `   \n   🧭 Navegación:\n`;
                    result += `      Nivel: ${flow.navigation.level}\n`;
                    result += `      Acceso: ${flow.navigation.accessFrom}\n`;
                }
                
                result += `\n`;
            });
        }
    });
    return result;
}

function formatTokensForPrompt(tokens) {
    if (!tokens) return '';
    
    let result = '';
    if (tokens.colors) {
        result += '\n### Colores\n';
        Object.entries(tokens.colors).forEach(([k, v]) => {
            result += `- ${k}: ${v}\n`;
        });
    }
    if (tokens.typography) {
        result += '\n### Tipografía\n';
        Object.entries(tokens.typography).forEach(([k, v]) => {
            result += `- ${k}: ${v}\n`;
        });
    }
    if (tokens.spacing) {
        result += '\n### Espaciado\n';
        Object.entries(tokens.spacing).forEach(([k, v]) => {
            result += `- ${k}: ${v}\n`;
        });
    }
    if (tokens.borderRadius) {
        result += '\n### Border Radius\n';
        Object.entries(tokens.borderRadius).forEach(([k, v]) => {
            result += `- ${k}: ${v}\n`;
        });
    }
    return result;
}

function formatGeneralRulesForPrompt(generalRules) {
    if (!generalRules) return '';
    
    let result = '';
    
    // Idioma
    if (generalRules.language) {
        result += '\n### 🌍 Idioma Oficial\n';
        result += `Principal: ${generalRules.language.primary}\n`;
        if (generalRules.language.localization) {
            result += `Formato fechas: ${generalRules.language.localization.dateFormat}\n`;
            result += `Formato números: ${generalRules.language.localization.numberFormat}\n`;
        }
        if (generalRules.language.rules) {
            result += '\nReglas de idioma:\n';
            generalRules.language.rules.forEach(rule => {
                result += `   • ${rule}\n`;
            });
        }
    }
    
    // Branding
    if (generalRules.branding) {
        result += '\n### 🎨 Branding y Nombre Comercial\n';
        if (generalRules.branding.naming) {
            result += `Regla: ${generalRules.branding.naming.rule}\n`;
            if (generalRules.branding.naming.formats) {
                result += '\nFormatos de nombre:\n';
                result += `   • Completo: ${generalRules.branding.naming.formats.full}\n`;
                result += `   • Corto: ${generalRules.branding.naming.formats.short}\n`;
                result += `   • Tagline: ${generalRules.branding.naming.formats.tagline}\n`;
                result += `   • Dominio: ${generalRules.branding.naming.formats.domain}\n`;
            }
        }
    }
    
    return result;
}

function formatArchitectureForPrompt(architecture) {
    if (!architecture) return '';
    
    let result = '';
    
    // Elementos globales
    if (architecture.globalElements && architecture.globalElements.persistent) {
        result += '\n### Elementos Globales Persistentes\n';
        const persistent = architecture.globalElements.persistent;
        if (persistent.header) {
            result += `Header: ${persistent.header.always ? 'Siempre visible' : 'Condicional'}\n`;
        }
        if (persistent.bottomNavigation) {
            result += `Bottom Navigation: ${persistent.bottomNavigation.screens} pantallas\n`;
        }
    }
    
    // Tipos de pantallas
    if (architecture.screenTypes) {
        result += '\n### Tipos de Pantallas\n';
        Object.entries(architecture.screenTypes).forEach(([key, type]) => {
            result += `- ${type.types?.join(', ') || key}: ${type.characteristics || ''}\n`;
        });
    }
    
    return result;
}

function formatConsistencyForPrompt(consistencyRules) {
    if (!consistencyRules) return '';
    
    let result = '';
    
    if (consistencyRules.spacing) {
        result += `\n### Espaciado\n${consistencyRules.spacing.rule}\nEscala: ${consistencyRules.spacing.scale}\n`;
    }
    if (consistencyRules.typography) {
        result += `\n### Tipografía\n${consistencyRules.typography.rule}\n`;
    }
    if (consistencyRules.colors) {
        result += `\n### Colores\n${consistencyRules.colors.rule}\n`;
    }
    if (consistencyRules.components) {
        result += `\n### Componentes\n${consistencyRules.components.principle}\n`;
    }
    if (consistencyRules.animations) {
        result += `\n### Animaciones\n${consistencyRules.animations.rule}\n`;
    }
    
    return result;
}

function copyPrompt() {
    const promptOutput = document.getElementById('promptOutput');
    if (!promptOutput) return;
    
    const text = promptOutput.textContent;
    if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).then(() => {
            if (app) app.showNotification('Prompt copiado al portapapeles', 'success');
        }).catch(err => {
            console.error('Error copying:', err);
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            if (app) app.showNotification('Prompt copiado', 'success');
        });
    }
}

function regeneratePrompt() {
    updatePromptOutput();
    if (app) app.showNotification('Prompt regenerado', 'success');
}

async function loadSavedAPIKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (!apiKeyInput || !app) return;
    
    try {
        const savedKey = await app.secureStorage.loadSecure('flowforge-api-key', 'flowforge-encryption-key');
        if (savedKey && savedKey.key) {
            apiKeyInput.value = savedKey.key;
            apiKeyInput.style.borderColor = 'var(--success)';
        }
    } catch (error) {
        console.log('No saved API key found');
    }
}

function setupAPIKeyAutosave() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (!apiKeyInput || !app) return;
    
    // Debounced auto-save
    let saveTimeout;
    apiKeyInput.addEventListener('input', (e) => {
        clearTimeout(saveTimeout);
        const value = e.target.value.trim();
        
        if (value.length > 10) {
            apiKeyInput.style.borderColor = 'var(--warning)';
            
            saveTimeout = setTimeout(async () => {
                if (value) {
                    const success = await app.secureStorage.saveSecure(
                        'flowforge-api-key',
                        { key: value },
                        'flowforge-encryption-key'
                    );
                    
                    if (success) {
                        apiKeyInput.style.borderColor = 'var(--success)';
                        console.log('✓ API Key guardada automáticamente');
                    }
                }
            }, 1000);
        }
    });
}

// Global functions for HTML onclick handlers
function createNewProject() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const projectForm = document.getElementById('projectForm');
    
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (projectForm) projectForm.style.display = 'block';
    
    // Setup real-time validation
    setupFormValidation();
}

function runValidation() {
    if (!window.app) return;
    
    const validator = new ValidationManager(window.app);
    const results = validator.validate();
    showValidationModal(results, validator);
}

function showValidationModal(results, validator) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.2s ease;';
    
    const suggestions = validator.getSuggestions(results);
    
    const scoreClass = results.percentage >= 90 ? 'excellent' : 
                       results.percentage >= 70 ? 'good' : 
                       results.percentage >= 50 ? 'fair' : 'poor';
    
    modal.innerHTML = `
        <div class="validation-modal" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 0; max-width: 900px; width: 90%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="validation-header" style="padding: 30px; border-bottom: 1px solid var(--border-color); background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%); color: white;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h2 style="margin: 0 0 8px 0; font-size: 1.5rem;">✅ Validación del Proyecto</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">Análisis completo de buenas prácticas y consistencia</p>
                    </div>
                    <button onclick="this.closest('.modal-overlay').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.3rem; display: flex; align-items: center; justify-content: center; transition: var(--transition);">×</button>
                </div>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 30px;">
                <!-- Score Section -->
                <div class="validation-score ${scoreClass}" style="text-align: center; padding: 30px; background: var(--bg-tertiary); border-radius: var(--radius-lg); margin-bottom: 30px;">
                    <div class="score-circle" style="width: 150px; height: 150px; margin: 0 auto 20px; position: relative;">
                        <svg width="150" height="150" style="transform: rotate(-90deg);">
                            <circle cx="75" cy="75" r="65" fill="none" stroke="var(--border-color)" stroke-width="12"/>
                            <circle cx="75" cy="75" r="65" fill="none" stroke="var(--accent-primary)" stroke-width="12" 
                                    stroke-dasharray="${2 * Math.PI * 65}" 
                                    stroke-dashoffset="${2 * Math.PI * 65 * (1 - results.percentage / 100)}"
                                    style="transition: stroke-dashoffset 1s ease;"/>
                        </svg>
                        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                            <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-primary);">${results.percentage}%</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Score</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--error);">${results.errors.length}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">Errores</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">${results.warnings.length}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">Advertencias</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--info);">${results.info.length}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">Info</div>
                        </div>
                    </div>
                </div>
                
                <!-- Suggestions -->
                ${suggestions.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; color: var(--text-primary);">💡 Sugerencias</h3>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${suggestions.map(s => `
                                <div class="suggestion-${s.type}" style="padding: 15px; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 4px solid var(--${s.type === 'error' ? 'error' : s.type === 'warning' ? 'warning' : s.type === 'success' ? 'success' : 'info'});">
                                    <div style="font-weight: 600; margin-bottom: 4px;">${s.title}</div>
                                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${s.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Errors -->
                ${results.errors.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; color: var(--error); display: flex; align-items: center; gap: 8px;">
                            <span>🔴</span> Errores (${results.errors.length})
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${results.errors.map(e => `
                                <div class="issue-item error" style="padding: 12px 15px; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--error);">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                                        <strong style="font-size: 0.95rem;">${e.name}</strong>
                                        <span class="badge" style="font-size: 0.75rem; padding: 2px 8px; background: var(--error); color: white; border-radius: 12px;">ERROR</span>
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${e.message}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Warnings -->
                ${results.warnings.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; color: var(--warning); display: flex; align-items: center; gap: 8px;">
                            <span>⚠️</span> Advertencias (${results.warnings.length})
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${results.warnings.map(w => `
                                <div class="issue-item warning" style="padding: 12px 15px; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--warning);">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                                        <strong style="font-size: 0.95rem;">${w.name}</strong>
                                        <span class="badge" style="font-size: 0.75rem; padding: 2px 8px; background: var(--warning); color: white; border-radius: 12px;">WARNING</span>
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${w.message}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Info -->
                ${results.info.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; color: var(--info); display: flex; align-items: center; gap: 8px;">
                            <span>ℹ️</span> Información (${results.info.length})
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${results.info.map(i => `
                                <div class="issue-item info" style="padding: 12px 15px; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--info);">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                                        <strong style="font-size: 0.95rem;">${i.name}</strong>
                                        <span class="badge" style="font-size: 0.75rem; padding: 2px 8px; background: var(--info); color: white; border-radius: 12px;">INFO</span>
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${i.message}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${results.errors.length === 0 && results.warnings.length === 0 && results.info.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: var(--success);">
                        <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
                        <h3 style="margin: 0 0 10px 0; color: var(--success);">¡Proyecto impecable!</h3>
                        <p style="margin: 0; color: var(--text-secondary);">No se encontraron problemas. Excelente trabajo.</p>
                    </div>
                ` : ''}
            </div>
            
            <div style="padding: 20px; border-top: 1px solid var(--border-color); display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="exportValidationReport()" style="padding: 12px 24px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; color: var(--text-primary); font-weight: 500; transition: var(--transition);">
                    📄 Exportar Reporte
                </button>
                <button onclick="this.closest('.modal-overlay').remove()" style="padding: 12px 24px; background: var(--accent-gradient); border: none; border-radius: var(--radius-md); cursor: pointer; color: white; font-weight: 600; transition: var(--transition);">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    // Store results for export
    window.lastValidationResults = { results, validator };
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function exportValidationReport() {
    if (!window.lastValidationResults) return;
    
    const { results, validator } = window.lastValidationResults;
    const report = validator.exportReport(results);
    
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    if (window.app) {
        window.app.showNotification('Reporte exportado', 'success', 'Validación', 2000);
    }
}

function setupFormValidation() {
    const nameInput = document.getElementById('projectName');
    const descInput = document.getElementById('projectDescription');
    const categorySelect = document.getElementById('projectCategory');
    const expandBtn = document.getElementById('expandBtn');
    
    const validateField = (input, errorId, validationFn, errorMsg) => {
        const errorSpan = document.getElementById(errorId);
        const isValid = validationFn(input.value);
        
        if (input.value && !isValid) {
            input.style.borderColor = 'var(--error)';
            if (errorSpan) {
                errorSpan.textContent = errorMsg;
                errorSpan.style.display = 'block';
            }
            return false;
        } else {
            input.style.borderColor = input.value ? 'var(--success)' : 'var(--border-color)';
            if (errorSpan) {
                errorSpan.textContent = '';
                errorSpan.style.display = 'none';
            }
            return true;
        }
    };
    
    const validateForm = () => {
        const hasName = nameInput && nameInput.value.trim().length >= 3;
        const hasDesc = descInput && descInput.value.trim().length >= 10;
        const hasCategory = categorySelect && categorySelect.value !== '';
        
        const isValid = hasName && hasDesc;
        
        if (expandBtn) {
            expandBtn.disabled = !isValid;
            expandBtn.style.opacity = isValid ? '1' : '0.5';
            expandBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
        }
        
        return isValid;
    };
    
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            validateField(
                e.target,
                'projectNameError',
                (val) => val.trim().length >= 3,
                'El nombre debe tener al menos 3 caracteres'
            );
            validateForm();
        });
        
        nameInput.addEventListener('blur', (e) => {
            if (!e.target.value.trim()) {
                e.target.style.borderColor = 'var(--error)';
                const errorSpan = document.getElementById('projectNameError');
                if (errorSpan) {
                    errorSpan.textContent = 'El nombre es requerido';
                    errorSpan.style.display = 'block';
                }
            }
        });
    }
    
    if (descInput) {
        descInput.addEventListener('input', (e) => {
            validateField(
                e.target,
                'projectDescriptionError',
                (val) => val.trim().length >= 10,
                'La descripción debe tener al menos 10 caracteres'
            );
            validateForm();
            
            // Show character count
            const charCount = e.target.value.length;
            const errorSpan = document.getElementById('projectDescriptionError');
            if (errorSpan && charCount > 0 && charCount < 10) {
                errorSpan.textContent = `${10 - charCount} caracteres más`;
                errorSpan.style.color = 'var(--text-secondary)';
            }
        });
        
        descInput.addEventListener('blur', (e) => {
            if (!e.target.value.trim()) {
                e.target.style.borderColor = 'var(--error)';
                const errorSpan = document.getElementById('projectDescriptionError');
                if (errorSpan) {
                    errorSpan.textContent = 'La descripción es requerida';
                    errorSpan.style.display = 'block';
                    errorSpan.style.color = 'var(--error)';
                }
            }
        });
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', validateForm);
    }
    
    // Initial validation
    validateForm();
}

function filterProjects(category) {
    console.log('Filter:', category);
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.category === category));
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

function undoChange() {
    if (app) app.undo();
}

function redoChange() {
    if (app) app.redo();
}

function showVersions() {
    if (app) app.showHistoryModal();
}

function showShareDialog() {
    if (app) app.showNotification('Función de compartir próximamente');
}

function exportProject() {
    if (app) app.exportData();
}

// saveCurrentProject is defined below with full implementation

// ====================
// THEME SYSTEM
// ====================
function initTheme() {
    const savedTheme = localStorage.getItem('flowforge-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('flowforge-theme', newTheme);
    
    if (app) {
        const themeName = newTheme === 'dark' ? 'oscuro' : 'claro';
        app.showNotification(`Tema ${themeName} activado`, 'success', 'Tema', 1500);
    }
}

// Initialize theme on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

function regenerateExpandedDescription() {
    const btn = document.getElementById('regenerateExpandedBtn');
    const textarea = document.getElementById('expandedDescription');
    
    if (btn) {
        btn.innerHTML = '⏳ Regenerando...';
        btn.disabled = true;
    }
    
    // Call expand again
    expandDescription().finally(() => {
        if (btn) {
            btn.innerHTML = '↻ Regenerar';
            btn.disabled = false;
        }
    });
}

function editExpandedDescription() {
    const textarea = document.getElementById('expandedDescription');
    const btn = document.getElementById('editExpandedBtn');
    
    if (textarea) {
        if (textarea.readOnly) {
            textarea.readOnly = false;
            textarea.style.background = 'var(--bg-secondary)';
            textarea.style.borderColor = 'var(--accent-primary)';
            textarea.focus();
            if (btn) btn.innerHTML = '💾 Guardar';
        } else {
            textarea.readOnly = true;
            textarea.style.background = 'var(--bg-primary)';
            textarea.style.borderColor = 'var(--border-color)';
            if (btn) btn.innerHTML = '✎ Editar';
            if (app) app.showNotification('✓ Cambios guardados');
        }
    }
}

async function expandDescription() {
    const group = document.getElementById('expandedDescriptionGroup');
    const btn = document.getElementById('expandBtn');
    const generateBtn = document.getElementById('generateBtn');
    const generateHint = document.getElementById('generateHint');
    const textarea = document.getElementById('expandedDescription');
    const regenerateBtn = document.getElementById('regenerateExpandedBtn');
    const editBtn = document.getElementById('editExpandedBtn');
    
    if (!group || !btn) return;
    
    const shortDesc = document.getElementById('projectDescription')?.value || '';
    const projectName = document.getElementById('projectName')?.value || '';
    const category = document.getElementById('projectCategory')?.value || '';
    
    if (!shortDesc || !projectName) {
        alert('Por favor completa el nombre y la descripción del proyecto');
        return;
    }
    
    // Show expanded group and loading state
    group.style.display = 'block';
    btn.innerHTML = '<span>⏳</span> Expandiendo...';
    btn.disabled = true;
    
    if (textarea) {
        textarea.value = 'Generando descripción expandida con IA...';
    }
    
    try {
        const apiKey = document.getElementById('apiKeyInput')?.value;
        const expandedDesc = await expandWithAI(projectName, shortDesc, category, apiKey);
        
        if (textarea) {
            textarea.value = expandedDesc;
        }
        
        // Hide expand button, show regenerate and edit
        btn.style.display = 'none';
        if (regenerateBtn) regenerateBtn.style.display = 'inline-flex';
        if (editBtn) editBtn.style.display = 'inline-flex';
        
        // Enable generate button
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
        }
        if (generateHint) {
            generateHint.textContent = '✓ Listo para generar el flujo completo';
            generateHint.style.color = 'var(--success)';
        }
        
        if (app) app.showNotification('✓ Descripción expandida generada con IA', 'success', 'Claude API', 3000);
        
    } catch (error) {
        console.error('Error expanding description:', error);
        
        // Mostrar mensaje de error específico si viene de la API
        const isAPIError = error.message.includes('API') || error.message.includes('🔑') || error.message.includes('❌');
        
        // Fallback to local expansion
        if (textarea) {
            textarea.value = generateLocalExpansion(projectName, shortDesc, category);
        }
        
        btn.style.display = 'none';
        if (regenerateBtn) regenerateBtn.style.display = 'inline-flex';
        if (editBtn) editBtn.style.display = 'inline-flex';
        
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            generateBtn.style.cursor = 'pointer';
        }
        if (generateHint) {
            generateHint.textContent = isAPIError 
                ? '⚠️ Error de API - Usando modo local' 
                : '✓ Listo para generar (modo local)';
            generateHint.style.color = 'var(--warning)';
        }
        
        // Solo mostrar notificación si no es un error de API (ya se mostró antes)
        if (!isAPIError && app) {
            app.showNotification('⚠️ Usando expansión local (sin API)', 'warning', null, 3000);
        }
    }
}

async function expandWithAI(projectName, shortDesc, category, apiKey) {
    // If no API key, use local expansion
    if (!apiKey || apiKey.trim() === '') {
        if (app) app.showNotification('ℹ️ Sin API Key - Usando generación local', 'info', null, 3000);
        return generateLocalExpansion(projectName, shortDesc, category);
    }
    
    // Validar formato de API key
    const trimmedKey = apiKey.trim();
    if (!trimmedKey.startsWith('sk-ant-')) {
        if (app) app.showNotification('⚠️ API Key debe comenzar con "sk-ant-"', 'warning', 'Validación', 4000);
        return generateLocalExpansion(projectName, shortDesc, category);
    }
    
    if (trimmedKey.length < 50) {
        if (app) app.showNotification('⚠️ API Key parece incompleta', 'warning', 'Validación', 4000);
        return generateLocalExpansion(projectName, shortDesc, category);
    }
    
    // Show progress bar
    if (window.app && app.progressBar) {
        app.progressBar.show();
        app.progressBar.update(30);
    }
    
    try {
        const prompt = `Eres un experto en diseño UX/UI y producto. Dado el siguiente proyecto, expande y refina la descripción de manera profesional y detallada.

Proyecto: ${projectName}
Categoría: ${category || 'General'}
Descripción breve: ${shortDesc}

Genera una descripción expandida que incluya:
1. Visión general del proyecto
2. Objetivos principales
3. Público objetivo
4. Problemas que resuelve
5. Propuesta de valor
6. Características clave

La descripción debe ser clara, profesional y enfocada en UX/UI.`;

        if (app && app.progressBar) app.progressBar.update(50);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });
        
        if (app && app.progressBar) app.progressBar.update(80);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = `Error ${response.status}`;
            
            // Mensajes específicos según el código de error
            switch (response.status) {
                case 400:
                    errorMessage = '❌ Solicitud inválida. Verifica los datos del proyecto.';
                    break;
                case 401:
                    errorMessage = '🔑 API Key inválida o expirada. Verifica tu clave de Anthropic.';
                    break;
                case 403:
                    errorMessage = '🚫 Acceso denegado. Tu API Key no tiene permisos suficientes.';
                    break;
                case 404:
                    errorMessage = '📭 Modelo no encontrado. Verifica la configuración.';
                    break;
                case 429:
                    errorMessage = '⏳ Límite de solicitudes excedido. Espera un momento e intenta de nuevo.';
                    break;
                case 500:
                case 502:
                case 503:
                    errorMessage = '🔧 Servidor de Anthropic no disponible. Intenta más tarde.';
                    break;
                case 529:
                    errorMessage = '📊 API sobrecargada. Intenta en unos minutos.';
                    break;
                default:
                    errorMessage = `❌ Error de API: ${response.status} - ${errorData.error?.message || 'Error desconocido'}`;
            }
            
            if (app) app.showNotification(errorMessage, 'error', 'API Claude', 5000);
            console.error('API Error Details:', errorData);
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (app && app.progressBar) app.progressBar.update(100);
        
        return data.content[0].text;
    } catch (error) {
        console.error('Error expanding with AI:', error);
        if (app && app.progressBar) app.progressBar.hide();
        throw error;
    } finally {
        if (app && app.progressBar) {
            setTimeout(() => app.progressBar.hide(), 500);
        }
    }
}

function generateLocalExpansion(projectName, shortDesc, category) {
    const categoryInfo = {
        fintech: 'en el sector financiero y tecnológico',
        healthtech: 'en el sector de salud y bienestar',
        edtech: 'en el sector educativo',
        ecommerce: 'en el comercio electrónico',
        social: 'en redes sociales y comunidades',
        productivity: 'en productividad y gestión',
        entertainment: 'en entretenimiento',
        travel: 'en viajes y turismo',
        food: 'en food delivery y gastronomía'
    };
    
    const sector = categoryInfo[category] || 'en su sector';
    
    return `PROYECTO: ${projectName}

VISIÓN GENERAL:
${shortDesc}

Este proyecto ${sector} busca crear una solución innovadora que mejore significativamente la experiencia del usuario a través de un diseño intuitivo y funcionalidades bien pensadas.

OBJETIVOS PRINCIPALES:
• Ofrecer una interfaz de usuario clara y accesible
• Optimizar los flujos de trabajo clave
• Garantizar una experiencia fluida y sin fricciones
• Implementar las mejores prácticas de UX/UI

PÚBLICO OBJETIVO:
Usuarios que buscan una solución eficiente, moderna y fácil de usar ${sector}.

PROBLEMAS QUE RESUELVE:
• Complejidad en procesos actuales
• Falta de herramientas especializadas
• Experiencia de usuario deficiente en alternativas existentes
• Necesidad de una solución integrada

PROPUESTA DE VALOR:
Una aplicación diseñada desde cero con enfoque en la experiencia del usuario, que combina funcionalidad, estética y usabilidad para crear una solución que destaque en el mercado.

CARACTERÍSTICAS CLAVE:
• Diseño responsive y adaptativo
• Navegación intuitiva
• Flujos de usuario optimizados
• Arquitectura de información clara
• Componentes UI consistentes`;
}

// ====================
// CONTENT GENERATION SYSTEM
// ====================

const CATEGORY_DATA = {
    fintech: {
        colors: { primary: '#0066FF', secondary: '#00D4AA', accent: '#FFB800', background: '#0A0F1E', surface: '#151B2E', text: '#FFFFFF', textSecondary: '#8892A6' },
        targetAudience: 'profesionales y personas que buscan gestionar sus finanzas de manera eficiente',
        needsBase: ['Control financiero', 'Ahorro automatizado', 'Visualización de gastos', 'Seguridad de datos'],
        categoryName: 'servicios financieros',
        fontFamily: 'Inter, SF Pro Display'
    },
    healthtech: {
        colors: { primary: '#00C9A7', secondary: '#845EF7', accent: '#FF6B6B', background: '#0D1117', surface: '#161B22', text: '#F0F6FC', textSecondary: '#8B949E' },
        targetAudience: 'usuarios conscientes de su salud que buscan herramientas digitales para mejorar su bienestar',
        needsBase: ['Seguimiento de salud', 'Recordatorios médicos', 'Conexión con profesionales', 'Datos de bienestar'],
        categoryName: 'salud y bienestar',
        fontFamily: 'Nunito, Open Sans'
    },
    edtech: {
        colors: { primary: '#6366F1', secondary: '#22D3EE', accent: '#F59E0B', background: '#0F0F23', surface: '#1A1A2E', text: '#E2E8F0', textSecondary: '#94A3B8' },
        targetAudience: 'estudiantes y profesionales que buscan aprender nuevas habilidades de forma efectiva',
        needsBase: ['Aprendizaje personalizado', 'Seguimiento de progreso', 'Contenido interactivo', 'Certificaciones'],
        categoryName: 'educación',
        fontFamily: 'Poppins, Lato'
    },
    ecommerce: {
        colors: { primary: '#FF6B35', secondary: '#004E89', accent: '#FFD600', background: '#0C0C0C', surface: '#1A1A1A', text: '#FAFAFA', textSecondary: '#A3A3A3' },
        targetAudience: 'consumidores digitales que valoran la conveniencia y experiencia de compra',
        needsBase: ['Compra fácil', 'Comparación de productos', 'Pagos seguros', 'Seguimiento de pedidos'],
        categoryName: 'comercio electrónico',
        fontFamily: 'DM Sans, Roboto'
    },
    social: {
        colors: { primary: '#E91E63', secondary: '#9C27B0', accent: '#00BCD4', background: '#121212', surface: '#1E1E1E', text: '#FFFFFF', textSecondary: '#B0B0B0' },
        targetAudience: 'usuarios que buscan conectar con comunidades afines y compartir experiencias',
        needsBase: ['Conexión social', 'Contenido relevante', 'Privacidad', 'Expresión personal'],
        categoryName: 'redes sociales',
        fontFamily: 'Circular, SF Pro'
    },
    productivity: {
        colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', background: '#09090B', surface: '#18181B', text: '#FAFAFA', textSecondary: '#A1A1AA' },
        targetAudience: 'profesionales y equipos que buscan optimizar su tiempo y flujos de trabajo',
        needsBase: ['Gestión de tareas', 'Colaboración', 'Automatización', 'Análisis de productividad'],
        categoryName: 'productividad',
        fontFamily: 'Inter, System UI'
    },
    entertainment: {
        colors: { primary: '#E50914', secondary: '#FFD700', accent: '#00D9FF', background: '#141414', surface: '#232323', text: '#FFFFFF', textSecondary: '#808080' },
        targetAudience: 'usuarios que buscan contenido de entretenimiento personalizado y de calidad',
        needsBase: ['Contenido personalizado', 'Streaming fluido', 'Descubrimiento', 'Social viewing'],
        categoryName: 'entretenimiento',
        fontFamily: 'Netflix Sans, Helvetica Neue'
    },
    travel: {
        colors: { primary: '#00A699', secondary: '#FF5A5F', accent: '#FFB400', background: '#0B1120', surface: '#162032', text: '#F7F7F7', textSecondary: '#B4B4B4' },
        targetAudience: 'viajeros que buscan experiencias únicas y planificación simplificada',
        needsBase: ['Reservas fáciles', 'Inspiración de destinos', 'Planificación de viaje', 'Reviews confiables'],
        categoryName: 'viajes',
        fontFamily: 'Airbnb Cereal, Circular'
    },
    food: {
        colors: { primary: '#FF5722', secondary: '#4CAF50', accent: '#FFC107', background: '#1A1A1A', surface: '#2D2D2D', text: '#FFFFFF', textSecondary: '#9E9E9E' },
        targetAudience: 'usuarios que valoran la conveniencia y variedad en sus opciones de alimentación',
        needsBase: ['Pedidos rápidos', 'Variedad de opciones', 'Seguimiento en tiempo real', 'Personalización'],
        categoryName: 'alimentación y delivery',
        fontFamily: 'Uber Move, Gilroy'
    },
    other: {
        colors: { primary: '#6366F1', secondary: '#8B5CF6', accent: '#EC4899', background: '#0A0A0F', surface: '#15151F', text: '#F0F0F5', textSecondary: '#A0A0B5' },
        targetAudience: 'usuarios que buscan soluciones innovadoras para sus necesidades específicas',
        needsBase: ['Facilidad de uso', 'Eficiencia', 'Personalización', 'Soporte'],
        categoryName: 'tecnología',
        fontFamily: 'Inter, System UI'
    }
};

function generateProjectData(name, category, description) {
    const catData = CATEGORY_DATA[category] || CATEGORY_DATA.other;
    const hasKeyword = (word) => description.toLowerCase().includes(word.toLowerCase());
    
    // Generate whatIs
    let whatIsIntro = `${name} es una aplicación`;
    if (hasKeyword('interactiv')) whatIsIntro += ' interactiva';
    if (hasKeyword('innovador')) whatIsIntro += ' innovadora';
    if (hasKeyword('modern')) whatIsIntro += ' moderna';
    whatIsIntro += ` de ${catData.categoryName}`;
    
    if (hasKeyword('equipo')) whatIsIntro += ' enfocada en el trabajo en equipo';
    else if (hasKeyword('personal')) whatIsIntro += ' para uso personal';
    else if (hasKeyword('empresa')) whatIsIntro += ' orientada a empresas';
    
    const mainNeed = description.split('.')[0] || description.substring(0, 100);
    
    const whatIs = `${whatIsIntro}. ${description}

${name} se enfoca específicamente en ${description.toLowerCase().split('.')[0]}${description.includes('.') ? '' : ', brindando una solución directa y eficiente para esta necesidad'}.

La aplicación está diseñada con las características específicas que demanda este tipo de herramienta, priorizando la funcionalidad descrita y evitando complejidades innecesarias que distraigan del objetivo principal.`;

    // Generate targetAudience
    let audienceType = catData.targetAudience;
    if (hasKeyword('profesional')) audienceType = 'profesionales que ' + description.toLowerCase().split('.')[0];
    else if (hasKeyword('estudiante')) audienceType = 'estudiantes y personas en formación que necesitan ' + description.toLowerCase().split('.')[0];
    else if (hasKeyword('equipo')) audienceType = 'equipos de trabajo que buscan ' + description.toLowerCase().split('.')[0];
    
    const targetAudience = `${name} está diseñada para ${audienceType}.

Los usuarios objetivo valoran las características específicas que ofrece ${name}: ${description.split('.')[0].toLowerCase()}. Son personas que entienden la importancia de herramientas especializadas sobre soluciones genéricas.

El perfil de usuario típico busca exactamente lo que ${name} ofrece: una herramienta enfocada, sin funcionalidades innecesarias, que resuelva de manera efectiva la necesidad planteada.`;

    // Generate needsSolved
    const needsSolved = `${name} resuelve directamente la necesidad de ${mainNeed.toLowerCase()}.

Necesidades específicas que aborda:

1. ${mainNeed}: Esta es la necesidad central que motivó la creación de ${name}, proporcionando una solución directa y sin complicaciones.

2. ${catData.needsBase[0]}: Aspecto fundamental para usuarios en el sector ${catData.categoryName}.

3. ${catData.needsBase[1]}: Complementa la funcionalidad principal asegurando una experiencia completa.

4. ${catData.needsBase[2]}: Garantiza que la solución sea práctica y sostenible en el tiempo.

La propuesta de valor de ${name} radica en hacer bien una cosa específica, en lugar de intentar hacer todo de manera mediocre.`;

    // Generate differentiators
    const differentiators = `${name} se diferencia por su enfoque especializado:

1. Enfoque Específico: Mientras otras aplicaciones intentan ser todo para todos, ${name} se concentra en ${mainNeed.toLowerCase()}, haciéndolo excepcionalmente bien.

2. Diseño Centrado en la Tarea: Cada elemento de la interfaz está pensado para facilitar específicamente la tarea de ${mainNeed.toLowerCase()}.

3. Sin Complejidad Innecesaria: ${name} no incluye funciones que no contribuyan directamente al objetivo principal, resultando en una experiencia más limpia y eficiente.

4. Optimización para el Caso de Uso: Toda decisión técnica y de diseño se toma pensando en el escenario específico de ${description.toLowerCase().split('.')[0]}.`;

    // Generate elevatorPitch
    const elevatorPitch = `${name} resuelve un problema específico: ${mainNeed.toLowerCase()}. En lugar de ser otra aplicación genérica de ${catData.categoryName}, nos enfocamos exclusivamente en hacer esto de la mejor manera posible. Nuestros usuarios valoran esta especialización porque obtienen exactamente lo que necesitan, sin distracciones ni curvas de aprendizaje innecesarias. ${name} es la herramienta que hace una cosa, pero la hace excepcionalmente bien.`;

    // Generate appType
    const appType = generateAppType(category, description);
    
    // Generate flows
    const flows = generateFlows(name, category);
    
    // Generate tokens
    const tokens = {
        colors: catData.colors,
        typography: {
            fontFamily: catData.fontFamily,
            headingSize: '24px / 32px / 40px',
            bodySize: '14px / 16px'
        },
        spacing: {
            xs: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
            xl: '32px'
        },
        borderRadius: {
            sm: '4px',
            md: '8px',
            lg: '16px'
        }
    };

    // Generate UI components
    const uiComponents = generateUIComponents(category);
    
    // Generate metrics
    const metrics = generateMetrics(category);
    const metricsDetail = generateMetricsDetail(category, metrics);

    return {
        whatIs,
        targetAudience,
        needsSolved,
        differentiators,
        elevatorPitch,
        appType,
        flows,
        tokens,
        uiComponents,
        metrics,
        metricsDetail
    };
}

function generateAppType(category, description) {
    const mobileFirst = ['food', 'social', 'entertainment', 'travel', 'healthtech'];
    const descLower = description.toLowerCase();
    const mobileKeywords = ['móvil', 'mobile', 'tiempo real', 'ubicación', 'notificación', 'cámara', 'foto', 'escanear', 'movimiento'];
    const webKeywords = ['dashboard', 'análisis', 'reportes', 'gestión', 'administr', 'múltiples ventanas', 'escritorio', 'complejo'];
    
    const hasMobileKeywords = mobileKeywords.some(k => descLower.includes(k));
    const hasWebKeywords = webKeywords.some(k => descLower.includes(k));
    
    let isMobile = mobileFirst.includes(category);
    if (hasMobileKeywords && !hasWebKeywords) isMobile = true;
    if (hasWebKeywords && !hasMobileKeywords) isMobile = false;
    
    const projectContext = description.split('.')[0] || description.substring(0, 100);
    
    if (isMobile) {
        return `RECOMENDACIÓN: Mobile First

Para un proyecto enfocado en "${projectContext}", el enfoque móvil es ideal porque este tipo de funcionalidad se beneficia del acceso inmediato y contextual que ofrecen los dispositivos móviles.

Justificación específica:
- El caso de uso descrito típicamente ocurre en contextos donde el móvil es el dispositivo más accesible
- Acceso a funciones nativas (GPS, cámara, notificaciones)
- Los usuarios esperan acceder a esta funcionalidad en cualquier momento
- La naturaleza de la tarea se presta para sesiones cortas pero frecuentes

Stack tecnológico sugerido: React Native o Flutter para desarrollo multiplataforma eficiente.`;
    } else {
        return `RECOMENDACIÓN: Web First

Para un proyecto enfocado en "${projectContext}", una aplicación web es más apropiada porque este tipo de funcionalidad se beneficia del espacio de pantalla y las capacidades de una plataforma web completa.

Justificación específica:
- El caso de uso descrito requiere pantallas más grandes para una visualización efectiva
- Las tareas involucradas se benefician de múltiples ventanas/pestañas
- Los usuarios esperan poder acceder desde diferentes dispositivos
- La naturaleza de la funcionalidad se presta para sesiones de trabajo más largas

Stack tecnológico sugerido: Next.js o React con TypeScript para una aplicación web robusta.`;
    }
}

function generateFlows(name, category) {
    const flows = {
        mvp: [
            { screen: 'Splash / Loading', description: `Pantalla inicial con logo de ${name} y carga de recursos`, elements: ['Logo animado', 'Progress indicator', 'Versión de app'], context: 'Primera impresión', globalElements: { header: false, bottomNav: false, sidebar: false }, layout: { pattern: 'Fullscreen centered', recommendation: 'Logo centrado con animación sutil' }, navigation: { level: 'entry', accessFrom: 'App launch' } },
            { screen: 'Onboarding', description: `Introducción al valor de ${name} en 3-4 slides`, elements: ['Ilustraciones', 'Títulos impactantes', 'Dots de progreso', 'Skip button', 'CTA final'], context: 'Educación del usuario', globalElements: { header: false, bottomNav: false, sidebar: false }, layout: { pattern: 'Carousel horizontal', recommendation: 'Swipeable slides con progreso visible' }, navigation: { level: 'entry', accessFrom: 'After splash (first time)' } },
            { screen: 'Login / Registro', description: 'Autenticación de usuarios', elements: ['Email input', 'Password input', 'Social login buttons', 'Forgot password link'], context: 'Autenticación', globalElements: { header: false, bottomNav: false, sidebar: false, note: 'Solo logo de marca' }, layout: { pattern: 'Form centered', recommendation: 'Inputs amplios, CTAs prominentes' }, navigation: { level: 'entry', accessFrom: 'Onboarding completion' } },
            { screen: 'Dashboard Principal', description: `Vista principal de ${name}`, elements: ['Header con perfil', 'Cards de contenido', 'Quick actions', 'Bottom navigation'], context: 'Hub central', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Cards grid / List', recommendation: 'Contenido prioritario visible sin scroll' }, navigation: { level: 'primary', accessFrom: 'Bottom nav - Home' } },
            { screen: 'Perfil de Usuario', description: 'Configuración y datos del usuario', elements: ['Avatar', 'Datos personales', 'Preferencias', 'Logout button'], context: 'Gestión de cuenta', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Sectioned list', recommendation: 'Secciones colapsables para organización' }, navigation: { level: 'primary', accessFrom: 'Bottom nav - Profile' } }
        ],
        intermediate: [
            { screen: 'Búsqueda', description: 'Sistema de búsqueda de contenido', elements: ['Search bar', 'Filtros básicos', 'Resultados en lista/grid', 'Historial reciente'], context: 'Descubrimiento', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Search + Results list', recommendation: 'Search bar sticky, resultados scrollables' }, navigation: { level: 'primary', accessFrom: 'Bottom nav - Search' } },
            { screen: 'Detalle', description: 'Vista detallada de contenido', elements: ['Hero image', 'Información completa', 'Actions principales', 'Contenido relacionado'], context: 'Información profunda', globalElements: { header: true, bottomNav: false, sidebar: false, note: 'Header con back button' }, layout: { pattern: 'Hero + Content scroll', recommendation: 'Hero collapsible en scroll' }, navigation: { level: 'secondary', accessFrom: 'Any list or card tap' } },
            { screen: 'Feed', description: `Feed de actividad de ${name}`, elements: ['Posts/Items en scroll', 'Refresh pull', 'Filtros de contenido', 'Infinite scroll'], context: 'Contenido dinámico', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Infinite scroll list', recommendation: 'Pull to refresh, loading states' }, navigation: { level: 'primary', accessFrom: 'Bottom nav - Feed' } },
            { screen: 'Notificaciones', description: 'Centro de notificaciones', elements: ['Lista de notificaciones', 'Filtros por tipo', 'Mark as read', 'Settings rápidos'], context: 'Comunicación', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Grouped list', recommendation: 'Agrupado por fecha/tipo' }, navigation: { level: 'secondary', accessFrom: 'Header notification icon' } },
            { screen: 'Configuración', description: 'Ajustes y preferencias', elements: ['Sections organizadas', 'Preferencias de app', 'Notificaciones', 'Privacidad'], context: 'Personalización', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Settings list', recommendation: 'Secciones con iconos descriptivos' }, navigation: { level: 'secondary', accessFrom: 'Profile menu' } },
            { screen: 'Guardados', description: 'Contenido guardado', elements: ['Lista de guardados', 'Organización por categorías', 'Quick access', 'Opciones de compartir'], context: 'Contenido personal', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Filterable grid/list', recommendation: 'Toggle view, filtros visibles' }, navigation: { level: 'secondary', accessFrom: 'Profile or dedicated tab' } },
            { screen: 'Historial', description: 'Historial de actividad', elements: ['Timeline de actividad', 'Filtros temporales', 'Estadísticas básicas'], context: 'Registro de uso', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Timeline vertical', recommendation: 'Agrupado por fecha con separadores' }, navigation: { level: 'secondary', accessFrom: 'Profile menu' } },
            { screen: 'Ayuda / FAQ', description: 'Centro de soporte básico', elements: ['Preguntas frecuentes', 'Search en FAQs', 'Contact support'], context: 'Soporte', globalElements: { header: true, bottomNav: false, sidebar: false }, layout: { pattern: 'Accordion list', recommendation: 'FAQs expandibles con search' }, navigation: { level: 'secondary', accessFrom: 'Settings or footer' } }
        ],
        complete: [
            { screen: 'Búsqueda Avanzada', description: 'Motor de búsqueda completo con IA', elements: ['Search bar con NLP', 'Filtros avanzados', 'Voice search', 'Visual search'], context: 'Descubrimiento avanzado', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Multi-filter search', recommendation: 'Filtros en modal o drawer' }, navigation: { level: 'primary', accessFrom: 'Search enhancement' } },
            { screen: 'Detalle Expandido', description: 'Información completa con interacciones', elements: ['Hero media 360°', 'AR preview', 'Reviews verificados', 'Comparador'], context: 'Información inmersiva', globalElements: { header: true, bottomNav: false, sidebar: false }, layout: { pattern: 'Immersive detail', recommendation: 'Media fullscreen, tabs de info' }, navigation: { level: 'secondary', accessFrom: 'Detail enhancement' } },
            { screen: 'Crear/Editar', description: 'Herramientas de creación', elements: ['Form builder', 'Media upload', 'Rich text editor', 'Preview', 'Autosave'], context: 'Creación de contenido', globalElements: { header: true, bottomNav: false, sidebar: false, note: 'Header con save/cancel' }, layout: { pattern: 'Multi-step form', recommendation: 'Progress bar, preview flotante' }, navigation: { level: 'secondary', accessFrom: 'FAB or create button' } },
            { screen: 'Mensajería', description: 'Sistema de mensajería en tiempo real', elements: ['Lista de conversaciones', 'Chat interface', 'Media sharing', 'Reactions'], context: 'Comunicación directa', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Split view / Chat', recommendation: 'Input sticky, messages scrollables' }, navigation: { level: 'primary', accessFrom: 'Bottom nav - Messages' } },
            { screen: 'Analytics', description: 'Métricas y estadísticas', elements: ['Usage dashboard', 'Goal tracking', 'Charts interactivos', 'Reports exportables'], context: 'Insights', globalElements: { header: true, bottomNav: true, sidebar: true }, layout: { pattern: 'Dashboard grid', recommendation: 'Widgets reordenables' }, navigation: { level: 'secondary', accessFrom: 'Profile or dedicated section' } },
            { screen: 'Social Hub', description: 'Centro de interacciones sociales', elements: ['Following/Followers', 'Activity feed', 'Grupos', 'Events'], context: 'Comunidad', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Tab navigation', recommendation: 'Tabs por tipo de contenido social' }, navigation: { level: 'primary', accessFrom: 'Bottom nav - Community' } },
            { screen: 'Biblioteca', description: 'Organización de contenido', elements: ['Collections', 'Tags', 'Folders', 'Sort/Filter options', 'Bulk actions'], context: 'Organización personal', globalElements: { header: true, bottomNav: true, sidebar: true }, layout: { pattern: 'File browser', recommendation: 'Grid/List toggle, breadcrumbs' }, navigation: { level: 'secondary', accessFrom: 'Profile or saved' } },
            { screen: 'Calendario', description: 'Gestión de eventos', elements: ['Calendar view', 'Event creation', 'Reminders', 'Sync options'], context: 'Planificación', globalElements: { header: true, bottomNav: true, sidebar: false }, layout: { pattern: 'Calendar + List', recommendation: 'Month/Week/Day views' }, navigation: { level: 'secondary', accessFrom: 'Dashboard or dedicated' } },
            { screen: 'Centro de Ayuda Pro', description: 'Soporte completo multicanal', elements: ['AI chatbot', 'FAQs dinámicas', 'Live chat', 'Ticket system'], context: 'Soporte premium', globalElements: { header: true, bottomNav: false, sidebar: false }, layout: { pattern: 'Chat + Resources', recommendation: 'Bot prominente, recursos secundarios' }, navigation: { level: 'tertiary', accessFrom: 'Settings - Help' } },
            { screen: 'Admin Panel', description: 'Panel de administración', elements: ['User management', 'Content moderation', 'Analytics dashboard', 'Settings globales'], context: 'Administración', globalElements: { header: true, bottomNav: false, sidebar: true }, layout: { pattern: 'Admin dashboard', recommendation: 'Sidebar nav, data tables' }, navigation: { level: 'admin', accessFrom: 'Admin access only' } }
        ]
    };
    
    // Add architecture metadata
    flows._architecture = generateArchitecture(name, category);
    
    return flows;
}

function generateArchitecture(name, category) {
    return {
        generalRules: {
            language: {
                primary: 'Español (es-ES)',
                fallback: 'Inglés (en-US)',
                rules: [
                    'Todo el contenido UI debe estar en español',
                    'Mensajes de error y validación en español',
                    'Textos de ayuda y tooltips en español',
                    'Notificaciones push en español',
                    'Formateo de fechas: dd/mm/yyyy',
                    'Formateo de números: 1.234,56 (coma decimal)',
                    'Moneda: $ según región'
                ],
                localization: {
                    dateFormat: 'dd/MM/yyyy',
                    timeFormat: 'HH:mm (24 horas)',
                    numberFormat: '1.234,56'
                }
            },
            branding: {
                naming: {
                    rule: 'Nombre comercial consistente en toda la aplicación',
                    locations: [
                        'Splash screen: Logo + nombre completo',
                        'App bar/Header: Logo o nombre reducido',
                        'Login/Registro: Nombre completo con tagline',
                        'Emails: Nombre en header y firma',
                        'Notificaciones: Nombre como remitente'
                    ],
                    formats: {
                        full: `${name}™`,
                        short: name,
                        tagline: `${name} - Tu solución ideal`,
                        domain: `${name.toLowerCase().replace(/\s+/g, '')}.com`
                    }
                },
                icon: {
                    rule: 'Ícono representativo y consistente',
                    specifications: {
                        style: 'Moderno, minimalista, memorable',
                        colors: 'Máximo 3 colores principales',
                        scalability: 'Legible desde 16x16 hasta 512x512'
                    }
                }
            },
            seo: {
                rule: 'Optimización SEO en todas las pantallas',
                general: [
                    'Títulos descriptivos únicos por pantalla',
                    'Meta descriptions relevantes',
                    'URLs amigables',
                    'Imágenes con alt text descriptivo',
                    'Schema markup para contenido estructurado'
                ],
                contentRules: [
                    'H1 único por página con keyword principal',
                    'Jerarquía de headings H1-H6',
                    'Párrafos legibles de 150-300 palabras'
                ],
                technical: [
                    'Title tag optimizado',
                    'Meta description con CTA',
                    'Open Graph tags para redes sociales',
                    'Sitemap XML actualizado'
                ],
                performance: [
                    'Core Web Vitals optimizados',
                    'Mobile-first responsive design',
                    'Lazy loading de imágenes',
                    'CSS y JS minificados'
                ]
            }
        },
        globalElements: {
            persistent: {
                header: {
                    present: true,
                    excludeFrom: ['splash', 'onboarding', 'auth_screens'],
                    height: '56-64px'
                },
                bottomNav: {
                    present: true,
                    excludeFrom: ['splash', 'onboarding', 'auth_screens', 'fullscreen_views'],
                    height: '56px',
                    items: 5
                },
                sidebar: {
                    present: true,
                    showOn: ['dashboard', 'settings', 'admin'],
                    width: '240-280px'
                },
                footer: {
                    present: false,
                    note: 'En mobile se usa Bottom Navigation en su lugar'
                }
            }
        },
        screenTypes: {
            fullscreen: {
                types: ['splash', 'onboarding', 'media_viewer'],
                characteristics: 'Sin header, footer, ni navegación visible'
            },
            authScreens: {
                types: ['login', 'register', 'forgot_password'],
                characteristics: 'Solo logo/brand, sin navegación principal'
            },
            mainScreens: {
                types: ['home', 'dashboard', 'feed', 'explore'],
                characteristics: 'Header + Bottom Nav (mobile) o Header + Sidebar (web)'
            },
            detailScreens: {
                types: ['item_detail', 'profile_view', 'article'],
                characteristics: 'Header con back + contenido enfocado'
            },
            formScreens: {
                types: ['create', 'edit', 'settings'],
                characteristics: 'Header + barra de progreso + acciones de guardado'
            }
        },
        layoutPatterns: {
            mobile: {
                list: {
                    pattern: 'Single column vertical scroll',
                    useFor: ['feeds', 'listas', 'resultados']
                },
                grid: {
                    pattern: '2-3 columns grid',
                    useFor: ['gallery', 'productos', 'categorías']
                },
                tabs: {
                    pattern: 'Horizontal scrollable tabs',
                    useFor: ['categorización', 'filtros', 'secciones']
                }
            },
            web: {
                sidebar_content: {
                    pattern: 'Sidebar (240-280px) + Main content',
                    useFor: ['dashboards', 'admin', 'settings']
                },
                grid_responsive: {
                    pattern: 'CSS Grid responsive',
                    useFor: ['catálogos', 'portfolios', 'cards']
                },
                split_view: {
                    pattern: 'Master-detail layout',
                    useFor: ['email', 'messaging', 'file_browser']
                }
            }
        },
        navigationFlow: {
            hierarchy: {
                level_1: {
                    screens: ['Home', 'Search', 'Create', 'Notifications', 'Profile'],
                    access: 'Bottom navigation',
                    maxItems: '5'
                },
                level_2: {
                    screens: ['Detail views', 'Settings sections', 'Filtered views'],
                    access: 'In-screen navigation',
                    maxDepth: '2-3 levels'
                },
                level_3: {
                    screens: ['Edit forms', 'Deep detail', 'Modals'],
                    access: 'Direct links from level 2'
                }
            }
        },
        consistencyRules: {
            spacing: {
                rule: 'Sistema de espaciado consistente (8px base)',
                scale: '4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px',
                application: 'Margins, paddings, gaps'
            },
            typography: {
                rule: 'Jerarquía tipográfica consistente',
                levels: {
                    h1: 'Títulos principales de página (24-32px)',
                    h2: 'Secciones principales (20-24px)',
                    h3: 'Subsecciones (18-20px)',
                    body: 'Contenido regular (14-16px)',
                    caption: 'Texto secundario (12-14px)'
                },
                consistency: 'Mismo nivel = mismo tamaño en toda la app'
            },
            colors: {
                rule: 'Uso semántico consistente',
                mapping: {
                    primary: 'CTAs principales, links, elementos interactivos',
                    secondary: 'Acciones secundarias, estados hover',
                    success: 'Confirmaciones, estados positivos',
                    error: 'Errores, alertas, acciones destructivas',
                    warning: 'Advertencias, estados pendientes',
                    info: 'Información neutral, tooltips'
                }
            },
            components: {
                rule: 'Componentes reutilizables y consistentes',
                principle: 'Un componente, un propósito, múltiples contextos',
                example: 'Button: mismo estilo en toda la app',
                variants: 'Primary, Secondary, Ghost, Danger'
            },
            states: {
                rule: 'Estados visuales consistentes',
                required: ['default', 'hover', 'active', 'focus', 'disabled'],
                loading: 'Skeleton o spinner consistente',
                error: 'Borde rojo + mensaje descriptivo'
            },
            animations: {
                rule: 'Animaciones sutiles y consistentes',
                duration: {
                    micro: '100-150ms (hover, toggle)',
                    short: '200-300ms (modals, transitions)',
                    medium: '300-500ms (page transitions)',
                    long: '500ms+ (complex animations)'
                },
                easing: 'ease-out para entradas, ease-in para salidas',
                principle: 'Las animaciones deben guiar, no distraer'
            }
        }
    };
}

function generateUIComponents(category) {
    const baseComponents = `• Buttons: Primary, Secondary, Ghost, Danger
• Forms: Input fields, Selects, Checkboxes, Radio buttons, Switches
• Cards: Content cards, Preview cards, List items
• Navigation: Tab bar, Side menu, Breadcrumbs
• Feedback: Toasts, Modals, Alerts, Loading states
• Data Display: Lists, Tables, Charts, Progress indicators
• Media: Image galleries, Video players, Carousels`;

    const categorySpecific = {
        fintech: `\n• Finance: Transaction cards, Balance displays, Charts, Account selectors`,
        healthtech: `\n• Health: Appointment cards, Health metrics, Doctor profiles, Timeline`,
        edtech: `\n• Education: Course cards, Progress trackers, Quiz components, Certificates`,
        ecommerce: `\n• Commerce: Product cards, Cart, Checkout steps, Order tracking`,
        social: `\n• Social: Post cards, Comment threads, User badges, Story rings`,
        productivity: `\n• Productivity: Task cards, Kanban boards, Calendar events, Time trackers`,
        entertainment: `\n• Media: Video cards, Player controls, Rating stars, Recommendations`,
        travel: `\n• Travel: Booking cards, Map integration, Itinerary timeline, Reviews`,
        food: `\n• Food: Menu items, Order cards, Delivery tracking, Rating components`
    };

    return baseComponents + (categorySpecific[category] || '');
}

function generateMetrics(category) {
    const categoryMetrics = {
        fintech: [
            { name: 'Transacciones Diarias', target: '>1000/día', icon: '💰' },
            { name: 'Tiempo Promedio Sesión', target: '>5 min', icon: '⏱️' },
            { name: 'Tasa de Conversión', target: '>15%', icon: '📈' }
        ],
        healthtech: [
            { name: 'Citas Agendadas', target: '>500/semana', icon: '📅' },
            { name: 'Usuarios Activos', target: '>10,000', icon: '👥' },
            { name: 'Satisfacción', target: '>4.5/5', icon: '⭐' }
        ],
        edtech: [
            { name: 'Cursos Completados', target: '>70%', icon: '🎓' },
            { name: 'Tiempo de Estudio', target: '>30 min/día', icon: '📚' },
            { name: 'Retención', target: '>60%', icon: '🔄' }
        ],
        ecommerce: [
            { name: 'Conversión', target: '>3%', icon: '🛒' },
            { name: 'Ticket Promedio', target: '>$50', icon: '💵' },
            { name: 'Recompra', target: '>25%', icon: '🔁' }
        ],
        social: [
            { name: 'DAU/MAU', target: '>40%', icon: '📊' },
            { name: 'Engagement', target: '>5%', icon: '❤️' },
            { name: 'Viralidad', target: '>1.5', icon: '🚀' }
        ],
        productivity: [
            { name: 'Tareas Completadas', target: '>80%', icon: '✅' },
            { name: 'Colaboradores Activos', target: '>5/proyecto', icon: '👥' },
            { name: 'Tiempo Ahorrado', target: '>2h/semana', icon: '⏰' }
        ],
        entertainment: [
            { name: 'Tiempo de Visualización', target: '>45 min/sesión', icon: '🎬' },
            { name: 'Contenido Completado', target: '>60%', icon: '📺' },
            { name: 'Suscripción Premium', target: '>10%', icon: '⭐' }
        ],
        travel: [
            { name: 'Reservas/Mes', target: '>1000', icon: '✈️' },
            { name: 'Ticket Promedio', target: '>$500', icon: '💵' },
            { name: 'NPS', target: '>50', icon: '📊' }
        ],
        food: [
            { name: 'Pedidos/Día', target: '>500', icon: '🍔' },
            { name: 'Tiempo Entrega', target: '<30 min', icon: '⏱️' },
            { name: 'Reorden', target: '>40%', icon: '🔄' }
        ]
    };

    return categoryMetrics[category] || [
        { name: 'Usuarios Activos', target: '>1000 DAU', icon: '👥' },
        { name: 'Retención D7', target: '>30%', icon: '🔄' },
        { name: 'NPS Score', target: '>50', icon: '⭐' }
    ];
}

function generateMetricsDetail(category, metrics) {
    let detail = 'MÉTRICAS CLAVE Y CÓMO MEDIRLAS:\n\n';
    
    metrics.forEach((metric, index) => {
        detail += `${index + 1}. ${metric.icon} ${metric.name}\n`;
        detail += `   - Objetivo: ${metric.target}\n`;
        detail += `   - Medición: Analytics dashboard, eventos tracking\n`;
        detail += `   - Frecuencia: Revisión diaria, reportes semanales\n\n`;
    });
    
    detail += `HERRAMIENTAS RECOMENDADAS:
• Analytics: Mixpanel, Amplitude, Google Analytics
• A/B Testing: Optimizely, LaunchDarkly
• Feedback: Hotjar, FullStory
• Surveys: Typeform, SurveyMonkey`;

    return detail;
}

function generateProject() {
    const name = document.getElementById('projectName')?.value;
    const category = document.getElementById('projectCategory')?.value;
    const description = document.getElementById('projectDescription')?.value;
    const expandedDesc = document.getElementById('expandedDescription')?.value;
    
    if (!name) {
        alert('Por favor ingresa un nombre para el proyecto');
        return;
    }
    
    // Create loading state
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.innerHTML = '<span>⏳</span> Generando...';
        generateBtn.disabled = true;
    }
    
    // Use expanded description if available
    const finalDescription = expandedDesc || description || '';
    
    // Generate project data
    setTimeout(() => {
        // Generate full project data
        const projectData = generateProjectData(name, category || 'other', finalDescription);
        
        // Generate unique ID
        const projectId = Date.now();
        
        const project = {
            id: projectId,
            name: name,
            category: category || 'other',
            description: description,
            expandedDescription: expandedDesc,
            data: projectData,
            overviewApproved: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save to global state
        state.projects.push(project);
        state.currentProjectId = projectId;
        saveProjects();
        
        // Also save to app instance
        if (app) {
            app.currentProject = project;
            app.saveData();
            app.addToHistory(project);
        }
        
        // Hide form, show project view
        const projectForm = document.getElementById('projectForm');
        const projectView = document.getElementById('projectView');
        const overviewSection = document.getElementById('overviewSection');
        const mainTabs = document.getElementById('mainTabs');
        const promptBuilder = document.getElementById('promptBuilder');
        const saveBtn = document.getElementById('saveBtn');
        const exportBtn = document.getElementById('exportBtn');
        const shareBtn = document.getElementById('shareBtn');
        const versionsBtn = document.getElementById('versionsBtn');
        
        if (projectForm) projectForm.style.display = 'none';
        if (projectView) projectView.style.display = 'block';
        if (overviewSection) overviewSection.style.display = 'block';
        if (mainTabs) mainTabs.style.display = 'none';
        if (promptBuilder) promptBuilder.style.display = 'none';
        
        // Show header buttons
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (exportBtn) exportBtn.style.display = 'inline-flex';
        if (shareBtn) shareBtn.style.display = 'inline-flex';
        if (versionsBtn) versionsBtn.style.display = 'inline-flex';
        
        // Populate overview content
        populateOverview(project);
        
        if (app) {
            app.showNotification('✓ Proyecto generado exitosamente');
        }
        
        // Reset button
        if (generateBtn) {
            generateBtn.innerHTML = '<span>⚡</span> Generar Flujo UX/UI Completo';
            generateBtn.disabled = false;
        }
    }, 1500);
}

function populateOverview(project) {
    const overviewContent = document.getElementById('overviewContent');
    if (!overviewContent) return;
    
    // Escapar HTML para seguridad
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    // Información de descripción expandida si existe
    const expandedDescInfo = project.expandedDescription ? `
        <div style="margin-top: 16px;">
            <strong style="color: var(--accent-primary); display: block; margin-bottom: 8px;">✨ Descripción Expandida:</strong>
            <div style="color: var(--text-secondary); font-style: italic; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); line-height: 1.6; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">${escapeHtml(project.expandedDescription)}</div>
        </div>
    ` : '';
    
    // Mostrar resultado generado si existe
    const generatedResultInfo = project.data && project.data.whatIs ? `
        <div class="content-block" style="margin: 0;">
            <div class="content-block-header">
                <span class="content-block-title">🎯 Resultado Generado</span>
            </div>
            <div class="content-block-body" style="padding: 16px; max-height: 300px; overflow-y: auto;">
                <strong style="color: var(--accent-primary); display: block; margin-bottom: 8px;">¿Qué es?</strong>
                <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(project.data.whatIs)}</p>
                ${project.data.targetAudience ? `
                <strong style="color: var(--accent-primary); display: block; margin-top: 16px; margin-bottom: 8px;">¿Para quién?</strong>
                <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(project.data.targetAudience.substring(0, 300))}...</p>
                ` : ''}
            </div>
        </div>
    ` : `
        <div class="content-block" style="margin: 0;">
            <div class="content-block-header">
                <span class="content-block-title">🎯 Vista Previa del Flujo UX/UI</span>
            </div>
            <div class="content-block-body" style="padding: 16px;">
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">
                    Se generará un flujo completo basado en tu descripción, incluyendo:
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-primary);">
                        <strong style="font-size: 0.9rem;">📝 Descripción</strong>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Qué es, para quién, necesidades</p>
                    </div>
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-secondary);">
                        <strong style="font-size: 0.9rem;">📱 Flujos de Pantalla</strong>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">MVP, Intermedio, Completo</p>
                    </div>
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--success);">
                        <strong style="font-size: 0.9rem;">🎨 Design Tokens</strong>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Colores, tipografía, espaciado</p>
                    </div>
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); border-left: 3px solid var(--warning);">
                        <strong style="font-size: 0.9rem;">📊 Métricas</strong>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">KPIs y métricas de éxito</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    overviewContent.innerHTML = `
        <div style="display: grid; gap: 20px;">
            <!-- Información del Proyecto -->
            <div class="content-block" style="margin: 0;">
                <div class="content-block-header">
                    <span class="content-block-title">📋 Información del Proyecto</span>
                </div>
                <div class="content-block-body" style="padding: 16px;">
                    <div style="display: grid; gap: 12px;">
                        <div>
                            <strong style="color: var(--accent-primary);">Nombre:</strong> 
                            <span style="color: var(--text-primary); margin-left: 8px;">${escapeHtml(project.name)}</span>
                        </div>
                        <div>
                            <strong style="color: var(--accent-primary);">Categoría:</strong> 
                            <span style="color: var(--text-secondary); margin-left: 8px; text-transform: capitalize;">${escapeHtml(project.category || 'Sin categoría')}</span>
                        </div>
                        <div>
                            <strong style="color: var(--accent-primary);">Descripción Original:</strong>
                            <p style="color: var(--text-secondary); margin-top: 8px; line-height: 1.6;">${escapeHtml(project.description)}</p>
                        </div>
                        ${expandedDescInfo}
                    </div>
                </div>
            </div>
            
            <!-- Resultado Generado -->
            ${generatedResultInfo}
            
            <!-- Instrucciones -->
            <div style="padding: 16px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1)); border-radius: var(--radius-md); border: 1px solid var(--accent-primary);">
                <p style="color: var(--text-primary); font-size: 0.9rem; margin: 0;">
                    <strong>💡 Siguiente paso:</strong> Haz clic en <strong>"Aprobar y Continuar"</strong> para ver el flujo completo generado, 
                    o en <strong>"Editar"</strong> si deseas modificar la información del proyecto.
                </p>
            </div>
        </div>
    `;
}

function approveOverview() {
    // Get current project from state or app
    let project = null;
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
    }
    
    if (!project) {
        console.error('No project found to approve');
        return;
    }
    
    // Mark as approved
    project.overviewApproved = true;
    
    // Save to storage
    saveProjects();
    if (app) {
        app.currentProject = project;
        app.saveData();
    }
    
    // Update UI
    const overview = document.getElementById('overviewSection');
    const mainTabs = document.getElementById('mainTabs');
    const promptBuilder = document.getElementById('promptBuilder');
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (overview) overview.style.display = 'none';
    if (mainTabs) mainTabs.style.display = 'block';
    if (promptBuilder) promptBuilder.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'inline-flex';
    if (exportBtn) exportBtn.style.display = 'inline-flex';
    
    // Mostrar controles de undo/redo
    const undoRedoControls = document.getElementById('undoRedoControls');
    if (undoRedoControls) undoRedoControls.style.display = 'flex';
    
    // Populate all content fields with generated data
    if (project.data) {
        populateProjectFields(project.data);
    }
    
    // Update prompt output
    updatePromptOutput();
    
    if (app) {
        app.showNotification('✓ Proyecto aprobado. Explora las pestañas para ver el flujo completo.', 'success', 'FlowForge', 3000);
    }
}

function populateProjectFields(data) {
    if (!data) return;
    
    // Populate description tab fields
    const fields = {
        'whatIs': data.whatIs,
        'targetAudience': data.targetAudience,
        'needsSolved': data.needsSolved,
        'differentiators': data.differentiators,
        'elevatorPitch': data.elevatorPitch,
        'appType': data.appType,
        'uiComponents': data.uiComponents,
        'metricsDetail': data.metricsDetail
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && value) {
            element.value = value;
        }
    });
    
    // Render flows if available
    if (data.flows) {
        console.log('Rendering flows, _architecture:', data.flows._architecture);
        renderFlows(data.flows);
        
        // Render general rules, architecture and consistency from flows._architecture
        const architecture = data.flows._architecture;
        console.log('Architecture object:', architecture);
        if (architecture) {
            console.log('Calling renderGeneralRules with:', architecture.generalRules);
            renderGeneralRules(architecture.generalRules);
            renderArchitecture(architecture);
            renderConsistency(architecture.consistencyRules);
        } else {
            console.log('No architecture found, showing empty states');
            // Show empty states
            renderGeneralRules(null);
            renderArchitecture(null);
            renderConsistency(null);
        }
    } else {
        console.log('No flows data available');
    }
    
    // Render tokens if available
    if (data.tokens) {
        renderTokens(data.tokens);
    }
    
    // Render metrics if available
    if (data.metrics) {
        renderMetrics(data.metrics);
    }
    
    // Update prompt builder
    updatePromptOutput();
}

function renderFlows(flows) {
    const container = document.getElementById('flowsContainer');
    if (!container) return;
    
    const tier = state.currentFlowTier || 'mvp';
    const tierFlows = flows[tier] || [];

    if (tierFlows.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📱</div><p>No hay flujos definidos para este tier</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="flows-grid" style="display: grid; gap: 16px;">
            ${tierFlows.map((flow, index) => `
                <div class="flow-card" style="padding: 20px; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 4px solid ${tier === 'mvp' ? 'var(--accent-primary)' : tier === 'intermediate' ? 'var(--accent-secondary)' : 'var(--success)'};">
                    <div class="flow-card-header" style="margin-bottom: 12px;">
                        <div class="flow-card-title" style="display: flex; align-items: center; gap: 10px;">
                            <span style="background: ${tier === 'mvp' ? 'var(--accent-primary)' : tier === 'intermediate' ? 'var(--accent-secondary)' : 'var(--success)'}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">${index + 1}</span>
                            <span style="font-weight: 600; color: var(--text-primary); font-size: 1.1rem;">${flow.screen}</span>
                        </div>
                        <div class="flow-card-subtitle" style="color: var(--text-secondary); margin-top: 8px; font-size: 0.9rem; line-height: 1.5;">${flow.description}</div>
                    </div>
                    <div class="flow-card-body">
                        <strong style="font-size: 0.8rem; color: var(--accent-primary); display: block; margin-bottom: 10px;">🎨 Elementos UI:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${flow.elements.map(el => `
                                <span style="padding: 6px 12px; background: var(--bg-secondary); border-radius: 20px; font-size: 0.75rem; color: var(--text-muted);">• ${el}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function setupFlowTierButtons() {
    const tierBtns = document.querySelectorAll('.tier-btn');
    tierBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all buttons
            tierBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');
            
            // Hide all flow tiers
            const flowTiers = document.querySelectorAll('.flow-tier');
            flowTiers.forEach(tier => tier.style.display = 'none');
            
            // Show selected tier
            const selectedTier = this.dataset.tier;
            const tierElement = document.getElementById(`flows-${selectedTier}`);
            if (tierElement) {
                tierElement.style.display = 'block';
            }
        });
    });
}

function renderTokens(tokens) {
    const tokensContainer = document.getElementById('tokensContainer');
    if (!tokensContainer) return;
    
    // Colors section
    const colorsHtml = tokens.colors ? `
        <div class="tokens-section" style="margin-bottom: 24px;">
            <h3 style="color: var(--accent-primary); margin-bottom: 16px;">🎨 Colores</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                ${Object.entries(tokens.colors).map(([name, color]) => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: ${color}; border: 1px solid rgba(255,255,255,0.1);"></div>
                        <div>
                            <div style="font-weight: 500; color: var(--text-primary); text-transform: capitalize;">${name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${color}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // Typography section
    const typographyHtml = tokens.typography ? `
        <div class="tokens-section" style="margin-bottom: 24px;">
            <h3 style="color: var(--accent-secondary); margin-bottom: 16px;">✏️ Tipografía</h3>
            <div style="display: grid; gap: 12px;">
                <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                    <div style="font-weight: 500; color: var(--accent-primary);">Font Family</div>
                    <div style="color: var(--text-secondary);">${tokens.typography.fontFamily}</div>
                </div>
                <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                    <div style="font-weight: 500; color: var(--accent-primary);">Heading Sizes</div>
                    <div style="color: var(--text-secondary);">${tokens.typography.headingSize}</div>
                </div>
                <div style="padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                    <div style="font-weight: 500; color: var(--accent-primary);">Body Sizes</div>
                    <div style="color: var(--text-secondary);">${tokens.typography.bodySize}</div>
                </div>
            </div>
        </div>
    ` : '';
    
    // Spacing section
    const spacingHtml = tokens.spacing ? `
        <div class="tokens-section" style="margin-bottom: 24px;">
            <h3 style="color: var(--success); margin-bottom: 16px;">📏 Espaciado</h3>
            <div style="display: grid; gap: 8px;">
                ${Object.entries(tokens.spacing).map(([name, value]) => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                        <span style="font-weight: 500; color: var(--accent-primary); min-width: 30px;">${name.toUpperCase()}</span>
                        <div style="width: ${value}; height: 8px; background: var(--accent-primary); border-radius: 4px;"></div>
                        <span style="color: var(--text-muted); font-family: monospace; font-size: 0.8rem;">${value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // Border radius section
    const radiusHtml = tokens.borderRadius ? `
        <div class="tokens-section">
            <h3 style="color: var(--warning); margin-bottom: 16px;">⬜ Border Radius</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                ${Object.entries(tokens.borderRadius).map(([name, value]) => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                        <div style="width: 40px; height: 40px; background: var(--accent-primary); border-radius: ${value};"></div>
                        <div>
                            <div style="font-weight: 500; color: var(--text-primary);">${name.toUpperCase()}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace;">${value}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    tokensContainer.innerHTML = colorsHtml + typographyHtml + spacingHtml + radiusHtml;
}

function renderMetrics(metrics) {
    const metricsContainer = document.getElementById('metricsContainer');
    if (!metricsContainer || !metrics) return;
    
    metricsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
            ${metrics.map(metric => `
                <div style="padding: 20px; background: var(--bg-tertiary); border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 2.5rem; margin-bottom: 12px;">${metric.icon}</div>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 1rem;">${metric.name}</div>
                    <div style="font-size: 1.1rem; color: var(--accent-primary); font-weight: 500;">${metric.target}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderGeneralRules(generalRules) {
    const container = document.getElementById('generalRulesContainer');
    if (!container) return;
    
    if (!generalRules) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📜</div><p>No hay reglas generales definidas</p></div>';
        return;
    }

    let html = '';

    // Idioma
    if (generalRules.language) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🌍 Idioma Oficial</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="margin-bottom: 12px;"><strong>Principal:</strong> ${generalRules.language.primary}</div>
                    ${generalRules.language.localization ? `
                        <div style="margin-bottom: 12px;"><strong>Formato fechas:</strong> ${generalRules.language.localization.dateFormat}</div>
                        <div style="margin-bottom: 12px;"><strong>Formato números:</strong> ${generalRules.language.localization.numberFormat}</div>
                    ` : ''}
                    ${generalRules.language.rules ? `
                        <details style="margin-top: 16px;">
                            <summary style="cursor: pointer; color: var(--accent-primary); font-weight: 600;">Ver todas las reglas de idioma →</summary>
                            <ul style="margin-top: 12px; padding-left: 20px; line-height: 1.8;">
                                ${generalRules.language.rules.map(rule => `<li>${rule}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Branding
    if (generalRules.branding) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🎨 Branding y Nombre Comercial</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    ${generalRules.branding.naming ? `
                        <div style="margin-bottom: 16px;"><strong>Regla:</strong> ${generalRules.branding.naming.rule}</div>
                        ${generalRules.branding.naming.formats ? `
                            <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 16px;">
                                <strong style="display: block; margin-bottom: 8px;">Formatos de nombre:</strong>
                                <div style="line-height: 1.8;">
                                    • Completo: ${generalRules.branding.naming.formats.full}<br>
                                    • Corto: ${generalRules.branding.naming.formats.short}<br>
                                    • Tagline: ${generalRules.branding.naming.formats.tagline}<br>
                                    • Dominio: ${generalRules.branding.naming.formats.domain}
                                </div>
                            </div>
                        ` : ''}
                    ` : ''}
                    ${generalRules.branding.icon ? `
                        <strong style="display: block; margin-top: 16px; margin-bottom: 8px; color: var(--info);">📱 Ícono Representativo</strong>
                        <div style="line-height: 1.8;">
                            <div><strong>Estilo:</strong> ${generalRules.branding.icon.specifications?.style || 'N/A'}</div>
                            <div><strong>Colores:</strong> ${generalRules.branding.icon.specifications?.colors || 'N/A'}</div>
                            <div><strong>Escalabilidad:</strong> ${generalRules.branding.icon.specifications?.scalability || 'N/A'}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // SEO
    if (generalRules.seo) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🔍 Optimización SEO</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="margin-bottom: 16px;"><strong>Regla:</strong> ${generalRules.seo.rule}</div>
                    ${generalRules.seo.general ? `
                        <strong style="display: block; margin-bottom: 8px;">Reglas Generales:</strong>
                        <ul style="padding-left: 20px; line-height: 1.8; margin-bottom: 16px;">
                            ${generalRules.seo.general.map(rule => `<li>${rule}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${generalRules.seo.contentRules ? `
                        <details style="margin-top: 16px;">
                            <summary style="cursor: pointer; color: var(--accent-primary); font-weight: 600;">Ver reglas de contenido →</summary>
                            <ul style="margin-top: 12px; padding-left: 20px; line-height: 1.8;">
                                ${generalRules.seo.contentRules.map(rule => `<li>${rule}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                    ${generalRules.seo.technical ? `
                        <details style="margin-top: 12px;">
                            <summary style="cursor: pointer; color: var(--accent-primary); font-weight: 600;">Ver reglas técnicas →</summary>
                            <ul style="margin-top: 12px; padding-left: 20px; line-height: 1.8;">
                                ${generalRules.seo.technical.map(rule => `<li>${rule}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📜</div><p>No hay reglas generales definidas</p></div>';
}

function renderArchitecture(architecture) {
    const container = document.getElementById('architectureContainer');
    if (!container) return;
    
    if (!architecture) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏗️</div><p>No hay arquitectura definida</p></div>';
        return;
    }

    let html = '';

    // Elementos Globales
    if (architecture.globalElements && architecture.globalElements.persistent) {
        const persistent = architecture.globalElements.persistent;
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🏗️ Elementos Globales</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="line-height: 2.5;">
                        ${persistent.header ? `<div><strong>Header:</strong> ${persistent.header.present ? '✓ Presente' : '✗ No presente'} ${persistent.header.present && persistent.header.excludeFrom ? '- Excluye: ' + persistent.header.excludeFrom.join(', ') : ''}</div>` : ''}
                        ${persistent.bottomNav ? `<div><strong>Bottom Navigation:</strong> ${persistent.bottomNav.present ? '✓ Presente (Mobile)' : '✗ No presente'} ${persistent.bottomNav.present && persistent.bottomNav.height ? '- Altura: ' + persistent.bottomNav.height : ''}</div>` : ''}
                        ${persistent.sidebar ? `<div><strong>Sidebar:</strong> ${persistent.sidebar.present ? '✓ Presente (Web)' : '✗ No presente'} ${persistent.sidebar.present && persistent.sidebar.width ? '- Ancho: ' + persistent.sidebar.width : ''}</div>` : ''}
                        ${persistent.footer ? `<div><strong>Footer:</strong> ${persistent.footer.present ? '✓ Presente' : '✗ No presente'} ${persistent.footer.note ? '- ' + persistent.footer.note : ''}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Niveles de Navegación
    if (architecture.navigationFlow && architecture.navigationFlow.hierarchy) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🧭 Niveles de Navegación</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="line-height: 2;">
                        ${Object.entries(architecture.navigationFlow.hierarchy).map(([level, data]) => `
                            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                                <strong style="color: var(--accent-primary); display: block; margin-bottom: 8px;">${level.toUpperCase()}:</strong>
                                <div style="margin-left: 16px; color: var(--text-secondary);">
                                    <div><strong>Pantallas:</strong> ${data.screens ? data.screens.join(', ') : 'N/A'}</div>
                                    <div><strong>Acceso:</strong> ${data.access || 'N/A'}</div>
                                    ${data.maxItems ? `<div><strong>Máx items:</strong> ${data.maxItems}</div>` : ''}
                                    ${data.maxDepth ? `<div><strong>Profundidad:</strong> ${data.maxDepth}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Patrones de Layout
    if (architecture.layoutPatterns) {
        const hasPatterns = (architecture.layoutPatterns.mobile && Object.keys(architecture.layoutPatterns.mobile).length > 0) ||
                          (architecture.layoutPatterns.web && Object.keys(architecture.layoutPatterns.web).length > 0);
                          
        if (hasPatterns) {
            html += `
                <div class="content-block">
                    <div class="content-block-header">
                        <span class="content-block-title">📐 Patrones de Layout Utilizados</span>
                    </div>
                    <div class="content-block-body" style="padding: 20px;">
            `;
            
            if (architecture.layoutPatterns.mobile && Object.keys(architecture.layoutPatterns.mobile).length > 0) {
                html += '<div style="margin-bottom: 20px;"><strong style="color: var(--info); font-size: 1.1rem;">Mobile:</strong></div>';
                html += '<ul style="padding-left: 20px; line-height: 1.8;">';
                Object.entries(architecture.layoutPatterns.mobile).forEach(([name, data]) => {
                    html += `<li><strong>${name}:</strong> ${data.pattern || ''} - ${data.useFor ? data.useFor.join(', ') : ''}</li>`;
                });
                html += '</ul>';
            }
            
            if (architecture.layoutPatterns.web && Object.keys(architecture.layoutPatterns.web).length > 0) {
                html += '<div style="margin-top: 20px; margin-bottom: 20px;"><strong style="color: var(--success); font-size: 1.1rem;">Web:</strong></div>';
                html += '<ul style="padding-left: 20px; line-height: 1.8;">';
                Object.entries(architecture.layoutPatterns.web).forEach(([name, data]) => {
                    html += `<li><strong>${name}:</strong> ${data.pattern || ''} - ${data.useFor ? data.useFor.join(', ') : ''}</li>`;
                });
                html += '</ul>';
            }
            
            html += `
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">🏗️</div><p>No hay arquitectura definida</p></div>';
}

function renderConsistency(consistencyData) {
    const container = document.getElementById('consistencyContainer');
    if (!container) return;
    
    if (!consistencyData) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✓</div><p>No hay guía de consistencia definida</p></div>';
        return;
    }

    let html = '';

    // Estados
    if (consistencyData.states) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🎭 Estados de Elementos</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="margin-bottom: 12px;"><strong>Regla:</strong> ${consistencyData.states.rule}</div>
                    ${consistencyData.states.required ? `
                        <div style="line-height: 2;">
                            <strong>Estados requeridos:</strong>
                            <ul style="margin-top: 8px; padding-left: 20px;">
                                ${consistencyData.states.required.map(state => `<li>${state}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${consistencyData.states.loading ? `<div style="margin-top: 12px;"><strong>Loading:</strong> ${consistencyData.states.loading}</div>` : ''}
                    ${consistencyData.states.error ? `<div style="margin-top: 8px;"><strong>Error:</strong> ${consistencyData.states.error}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Espaciado
    if (consistencyData.spacing) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">📏 Sistema de Espaciado</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="margin-bottom: 12px;"><strong>Regla:</strong> ${consistencyData.spacing.rule}</div>
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-sm); line-height: 1.8;">
                        <strong>Escala:</strong> ${consistencyData.spacing.scale}
                    </div>
                    ${consistencyData.spacing.application ? `<div style="margin-top: 12px;"><strong>Aplicación:</strong> ${consistencyData.spacing.application}</div>` : ''}
                    ${consistencyData.spacing.exception ? `<div style="margin-top: 8px; font-style: italic; color: var(--text-muted);">Excepción: ${consistencyData.spacing.exception}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Tipografía
    if (consistencyData.typography) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">📝 Jerarquía Tipográfica</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="margin-bottom: 12px;"><strong>Regla:</strong> ${consistencyData.typography.rule}</div>
                    ${consistencyData.typography.levels ? `
                        <div style="line-height: 2;">
                            ${Object.entries(consistencyData.typography.levels).map(([level, desc]) => `
                                <div style="margin-bottom: 12px;">
                                    <strong style="color: var(--info);">${level}:</strong> ${desc}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${consistencyData.typography.consistency ? `<div style="margin-top: 12px; font-style: italic; color: var(--text-muted);">${consistencyData.typography.consistency}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Colores
    if (consistencyData.colors) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🎨 Uso de Colores</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="margin-bottom: 12px;"><strong>Regla:</strong> ${consistencyData.colors.rule}</div>
                    ${consistencyData.colors.mapping ? `
                        <div style="line-height: 2;">
                            ${Object.entries(consistencyData.colors.mapping).map(([color, use]) => `
                                <div style="margin-bottom: 8px;">
                                    <strong style="color: var(--${color});">${color}:</strong> ${use}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Componentes
    if (consistencyData.components) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🧩 Componentes Reutilizables</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    ${consistencyData.components.rule ? `<div style="margin-bottom: 12px;"><strong>Regla:</strong> ${consistencyData.components.rule}</div>` : ''}
                    ${consistencyData.components.principle ? `<div style="margin-bottom: 12px;"><strong>Principio:</strong> ${consistencyData.components.principle}</div>` : ''}
                    ${consistencyData.components.example ? `<div style="margin-bottom: 12px;"><strong>Ejemplo:</strong> ${consistencyData.components.example}</div>` : ''}
                    ${consistencyData.components.variants ? `<div><strong>Variantes:</strong> ${consistencyData.components.variants}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Animaciones
    if (consistencyData.animations) {
        html += `
            <div class="content-block">
                <div class="content-block-header">
                    <span class="content-block-title">🎬 Animaciones y Transiciones</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <div style="margin-bottom: 16px;"><strong>Regla:</strong> ${consistencyData.animations.rule}</div>
                    ${consistencyData.animations.duration ? `
                        <strong style="display: block; margin-bottom: 8px;">Duraciones:</strong>
                        <div style="line-height: 2; margin-left: 16px;">
                            ${Object.entries(consistencyData.animations.duration).map(([type, time]) => `
                                <div><strong style="color: var(--warning);">${type}:</strong> ${time}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${consistencyData.animations.easing ? `<div style="margin-top: 12px;"><strong>Easing:</strong> ${consistencyData.animations.easing}</div>` : ''}
                    ${consistencyData.animations.principle ? `<div style="margin-top: 8px; font-style: italic; color: var(--text-muted);">${consistencyData.animations.principle}</div>` : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">✓</div><p>No hay guía de consistencia definida</p></div>';
}

function editOverview() {
    // Volver al formulario de proyecto para editar
    const projectView = document.getElementById('projectView');
    const projectForm = document.getElementById('projectForm');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    if (projectView) projectView.style.display = 'none';
    if (projectForm) projectForm.style.display = 'block';
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    
    if (app) {
        app.showNotification('Modo de edición activado. Modifica los campos y vuelve a generar.', 'info', 'Editar', 3000);
    }
}

function editBlock(blockId) {
    const textarea = document.getElementById(blockId);
    if (!textarea) return;
    
    const isReadOnly = textarea.readOnly;
    textarea.readOnly = !isReadOnly;
    
    if (isReadOnly) {
        textarea.focus();
        textarea.style.borderColor = 'var(--accent-primary)';
        textarea.style.background = 'var(--bg-secondary)';
        if (app) app.showNotification('Modo edición activado', 'info');
    } else {
        textarea.style.borderColor = 'var(--border-color)';
        textarea.style.background = '';
        saveCurrentProject();
        if (app) app.showNotification('Cambios guardados', 'success');
    }
}

function copyBlock(blockId) {
    const textarea = document.getElementById(blockId);
    if (!textarea) return;
    
    const text = textarea.value;
    if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).then(() => {
            if (app) app.showNotification('Contenido copiado al portapapeles', 'success');
        }).catch(err => {
            console.error('Error copying:', err);
            // Fallback
            textarea.select();
            document.execCommand('copy');
            if (app) app.showNotification('Contenido copiado', 'success');
        });
    }
}

function saveCurrentProject() {
    // Get current project
    let project = null;
    let projectIndex = -1;
    
    if (state.currentProjectId) {
        projectIndex = state.projects.findIndex(p => p.id === state.currentProjectId);
        if (projectIndex !== -1) {
            project = state.projects[projectIndex];
        }
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
        projectIndex = state.projects.findIndex(p => p.id === project.id);
    }
    if (!project) {
        console.log('No project to save');
        return;
    }
    
    // Update project data from form fields
    const newData = {
        whatIs: document.getElementById('whatIs')?.value || '',
        targetAudience: document.getElementById('targetAudience')?.value || '',
        needsSolved: document.getElementById('needsSolved')?.value || '',
        differentiators: document.getElementById('differentiators')?.value || '',
        elevatorPitch: document.getElementById('elevatorPitch')?.value || '',
        appType: document.getElementById('appType')?.value || '',
        uiComponents: document.getElementById('uiComponents')?.value || '',
        metricsDetail: document.getElementById('metricsDetail')?.value || ''
    };
    
    // Check if there are actual changes
    if (!project.data) project.data = {};
    const hasChanges = Object.keys(newData).some(key => {
        return project.data[key] !== newData[key];
    });
    
    if (!hasChanges) {
        console.log('No changes to save');
        return;
    }
    
    // Merge with existing data
    Object.assign(project.data, newData);
    project.updatedAt = new Date().toISOString();
    
    // Update project in array
    if (projectIndex !== -1) {
        state.projects[projectIndex] = project;
    }
    
    // Save to storage
    saveProjects();
    if (app) {
        app.currentProject = project;
        app.saveData();
        app.showNotification('Proyecto guardado correctamente', 'success');
    }
    
    // Update projects list if visible
    if (typeof renderProjectsList === 'function') {
        renderProjectsList();
    }
}

// ====================
// PROGRESS BAR
// ====================
class ProgressBar {
    constructor() {
        this.bar = null;
        this.currentProgress = 0;
    }

    show() {
        if (!this.bar) {
            this.bar = document.createElement('div');
            this.bar.className = 'progress-bar';
            document.body.appendChild(this.bar);
        }
        this.bar.style.width = '0%';
    }

    update(progress) {
        if (this.bar) {
            this.currentProgress = Math.min(Math.max(progress, 0), 100);
            this.bar.style.width = `${this.currentProgress}%`;
        }
    }

    hide() {
        if (this.bar) {
            this.bar.style.width = '100%';
            setTimeout(() => {
                if (this.bar && this.bar.parentNode) {
                    this.bar.parentNode.removeChild(this.bar);
                    this.bar = null;
                }
                this.currentProgress = 0;
            }, 300);
        }
    }
}

// ====================
// TOOLTIP SYSTEM
// ====================
class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.initTooltips();
    }

    initTooltips() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.show(target, target.dataset.tooltip);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.hide();
            }
        });
    }

    show(element, text) {
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tooltip';
            document.body.appendChild(this.tooltip);
        }

        this.tooltip.textContent = text;
        const rect = element.getBoundingClientRect();
        
        this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
        this.tooltip.style.top = `${rect.top - 30}px`;
        this.tooltip.style.transform = 'translateX(-50%)';
        
        setTimeout(() => {
            if (this.tooltip) {
                this.tooltip.classList.add('show');
            }
        }, 100);
    }

    hide() {
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
        }
    }
}

// ====================
// LOADING STATE MANAGER
// ====================
class LoadingManager {
    static setLoading(element, loading) {
        if (loading) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }

    static createSkeleton(container, count = 3) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton';
            skeleton.style.height = '60px';
            skeleton.style.marginBottom = '10px';
            container.appendChild(skeleton);
        }
    }
}