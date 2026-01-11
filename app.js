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
// PROJECT SEARCH CLASS
// ====================
class ProjectSearch {
    static search(projects, query) {
        if (!query || query.trim() === '') return projects;
        
        const lowerQuery = query.toLowerCase().trim();
        return projects.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery))
        );
    }
    
    static filter(projects, filters) {
        let filtered = [...projects];
        
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        if (filters.dateFrom) {
            filtered = filtered.filter(p => new Date(p.createdAt) >= filters.dateFrom);
        }
        
        if (filters.dateTo) {
            filtered = filtered.filter(p => new Date(p.createdAt) <= filters.dateTo);
        }
        
        return filtered;
    }
}

// ====================
// HISTORY MANAGER CLASS (Undo/Redo)
// ====================
class HistoryManager {
    constructor(maxHistory = 20) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
    }
    
    push(state) {
        // Remover estados futuros si estamos en medio del historial
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Hacer deep copy del estado
        this.history.push(JSON.parse(JSON.stringify(state)));
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
        
        this.updateButtons();
    }
    
    undo() {
        if (this.canUndo()) {
            this.currentIndex--;
            this.updateButtons();
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }
    
    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            this.updateButtons();
            return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
        }
        return null;
    }
    
    canUndo() {
        return this.currentIndex > 0;
    }
    
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    updateButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = !this.canUndo();
        if (redoBtn) redoBtn.disabled = !this.canRedo();
    }
    
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateButtons();
    }
}

// ====================
// PROJECT TEMPLATES CLASS
// ====================
class ProjectTemplates {
    static getTemplates() {
        return [
            {
                id: 'saas_dashboard',
                name: 'SaaS Dashboard',
                category: 'productivity',
                description: 'Panel de control completo para aplicaciones SaaS con analytics, gestión de usuarios y configuraciones avanzadas'
            },
            {
                id: 'ecommerce_mobile',
                name: 'E-commerce App',
                category: 'ecommerce',
                description: 'Aplicación móvil de comercio electrónico con catálogo, carrito de compras, pagos integrados y seguimiento de pedidos'
            },
            {
                id: 'fitness_tracker',
                name: 'Fitness Tracker',
                category: 'healthtech',
                description: 'App de seguimiento de actividad física con monitoreo de ejercicios, nutrición, metas personales y progreso'
            },
            {
                id: 'learning_platform',
                name: 'Plataforma Educativa',
                category: 'edtech',
                description: 'Sistema de gestión de aprendizaje con cursos interactivos, evaluaciones, certificados y progreso del estudiante'
            },
            {
                id: 'fintech_wallet',
                name: 'Wallet Digital',
                category: 'fintech',
                description: 'Billetera digital para gestión de finanzas personales, pagos, transferencias y visualización de gastos'
            },
            {
                id: 'social_network',
                name: 'Red Social',
                category: 'social',
                description: 'Plataforma social para compartir contenido, seguir usuarios, mensajería y feed personalizado'
            }
        ];
    }
    
    static applyTemplate(templateId) {
        const template = this.getTemplates().find(t => t.id === templateId);
        if (template) {
            document.getElementById('projectName').value = template.name;
            document.getElementById('projectCategory').value = template.category;
            document.getElementById('projectDescription').value = template.description;
            
            // Limpiar errores si existen
            ProjectValidator.clearAllErrors();
            
            showToast(`Template "${template.name}" aplicado`, 'success');
        }
    }
}

// ====================
// PROJECT VERSIONING CLASS
// ====================
class ProjectVersioning {
    static createVersion(projectId, versionName) {
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return null;
        
        const versions = this.getVersions(projectId);
        const version = {
            id: generateId(),
            projectId,
            name: versionName || `Versión ${versions.length + 1}`,
            data: JSON.parse(JSON.stringify(project.data)),
            createdAt: new Date().toISOString(),
            projectName: project.name
        };
        
        // Guardar versión en localStorage
        const allVersions = JSON.parse(localStorage.getItem('flowforge_versions') || '[]');
        allVersions.push(version);
        
        // Limitar a 50 versiones totales
        if (allVersions.length > 50) {
            allVersions.shift();
        }
        
        localStorage.setItem('flowforge_versions', JSON.stringify(allVersions));
        return version;
    }
    
    static getVersions(projectId) {
        const allVersions = JSON.parse(localStorage.getItem('flowforge_versions') || '[]');
        return allVersions.filter(v => v.projectId === projectId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    static restoreVersion(versionId) {
        const allVersions = JSON.parse(localStorage.getItem('flowforge_versions') || '[]');
        const version = allVersions.find(v => v.id === versionId);
        
        if (version) {
            const project = state.projects.find(p => p.id === version.projectId);
            if (project) {
                project.data = JSON.parse(JSON.stringify(version.data));
                project.updatedAt = new Date().toISOString();
                markUnsavedChanges();
                return true;
            }
        }
        return false;
    }
    
    static deleteVersion(versionId) {
        const allVersions = JSON.parse(localStorage.getItem('flowforge_versions') || '[]');
        const filtered = allVersions.filter(v => v.id !== versionId);
        localStorage.setItem('flowforge_versions', JSON.stringify(filtered));
    }
}

// ====================
// PROJECT SHARING CLASS
// ====================
class ProjectSharing {
    static generateShareLink(projectId) {
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return null;
        
        // Crear objeto compartible (sin IDs internos)
        const shareData = {
            name: project.name,
            category: project.category,
            description: project.description,
            data: project.data,
            sharedAt: new Date().toISOString()
        };
        
        try {
            const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
            return `${window.location.origin}${window.location.pathname}?import=${encoded}`;
        } catch (e) {
            console.error('Error generating share link:', e);
            return null;
        }
    }
    
    static importFromLink() {
        const params = new URLSearchParams(window.location.search);
        const importData = params.get('import');
        
        if (importData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(importData)));
                
                // Generar ID único para proyecto importado
                let projectId = generateId();
                while (state.projects.some(p => p.id === projectId)) {
                    projectId = generateId();
                }
                
                // Crear nuevo proyecto con datos importados
                const project = {
                    id: projectId,
                    name: decoded.name + ' (Importado)',
                    category: decoded.category,
                    description: decoded.description,
                    data: decoded.data,
                    overviewApproved: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                state.projects.push(project);
                saveProjects();
                renderProjectsList();
                
                showToast(`Proyecto "${decoded.name}" importado exitosamente`, 'success');
                
                // Abrir proyecto importado
                openProject(project.id);
                
                // Limpiar URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                return true;
            } catch (e) {
                console.error('Error importing project:', e);
                showToast('Error al importar proyecto. Enlace inválido.', 'error');
                return false;
            }
        }
        return false;
    }
}

// ====================
// ACCESSIBILITY ENHANCEMENTS CLASS
// ====================
class A11yEnhancements {
    static init() {
        this.addARIALabels();
        this.setupKeyboardNav();
        this.setupFocusManagement();
    }
    
    static addARIALabels() {
        // Agregar labels descriptivos a elementos sin texto
        document.querySelectorAll('button:not([aria-label])').forEach(btn => {
            if (btn.textContent.trim()) {
                btn.setAttribute('aria-label', btn.textContent.trim());
            }
        });
        
        // Marcar regiones importantes
        const projectsList = document.getElementById('projectsList');
        if (projectsList) {
            projectsList.setAttribute('role', 'list');
            projectsList.setAttribute('aria-label', 'Lista de proyectos');
        }
    }
    
    static setupKeyboardNav() {
        // Tab navigation en modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    const focusableElements = activeModal.querySelectorAll(
                        'button, input, textarea, select, a[href]'
                    );
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }
    
    static setupFocusManagement() {
        // Guardar y restaurar foco cuando se abren/cierran modales
        let lastFocusedElement = null;
        
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        if (modal.classList.contains('active')) {
                            lastFocusedElement = document.activeElement;
                            // Enfocar primer elemento del modal
                            setTimeout(() => {
                                const firstInput = modal.querySelector('input, button');
                                if (firstInput) firstInput.focus();
                            }, 100);
                        } else if (lastFocusedElement) {
                            lastFocusedElement.focus();
                            lastFocusedElement = null;
                        }
                    }
                });
            });
            
            observer.observe(modal, { attributes: true });
        });
    }
    
    static announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => announcement.remove(), 1000);
    }
}

// ====================
// ALIGNMENT ANALYZER CLASS
// ====================
class AlignmentAnalyzer {
    static analyze(userInput, generatedOutput) {
        // Usar descripción expandida si existe, sino la descripción original
        const referenceDescription = userInput.expandedDescription || userInput.description;
        
        // Combinar todo el contenido generado para buscar keywords
        const allGeneratedContent = [
            generatedOutput.whatIs || '',
            generatedOutput.targetAudience || '',
            generatedOutput.needsSolved || '',
            generatedOutput.mainFeatures || '',
            generatedOutput.differentiators || '',
            generatedOutput.elevatorPitch || ''
        ].join(' ');
        
        const inputKeywords = this.extractKeywords(referenceDescription);
        const outputKeywords = this.extractKeywords(allGeneratedContent);
        
        const analysis = {
            score: 0,
            inputKeywords,
            outputKeywords,
            matched: [],
            missing: [],
            extra: [],
            keywordCoverage: 0,
            semanticAlignment: 0,
            categoryAlignment: 0,
            recommendations: []
        };
        
        // Comparar keywords - matching basado solo en keywords extraídos
        inputKeywords.forEach(keyword => {
            const keywordLower = keyword.toLowerCase();
            
            // Buscar SOLO en las keywords extraídas del output (no en todo el texto)
            const foundInKeywords = outputKeywords.some(out => {
                const outLower = out.toLowerCase();
                // Coincidencia exacta
                if (outLower === keywordLower) return true;
                // Uno contiene al otro (pero con longitud mínima para evitar falsos positivos)
                if (outLower.includes(keywordLower) && keywordLower.length >= 5) return true;
                if (keywordLower.includes(outLower) && outLower.length >= 5) return true;
                // Similitud aproximada (para variaciones como singular/plural)
                if (this.areSimilar(keywordLower, outLower)) return true;
                return false;
            });
            
            if (foundInKeywords) {
                analysis.matched.push(keyword);
            } else {
                analysis.missing.push(keyword);
            }
        });
        
        // Identificar keywords extra en output
        outputKeywords.forEach(keyword => {
            const found = inputKeywords.some(inp => 
                inp.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(inp.toLowerCase())
            );
            
            if (!found && !analysis.matched.includes(keyword)) {
                analysis.extra.push(keyword);
            }
        });
        
        // Calcular keyword coverage
        analysis.keywordCoverage = inputKeywords.length > 0 
            ? (analysis.matched.length / inputKeywords.length) * 100 
            : 100;
        
        // Verificar alineación de categoría
        analysis.categoryAlignment = this.analyzeCategoryAlignment(
            userInput.category, 
            generatedOutput
        );
        
        // Analizar alineación semántica (longitud y complejidad)
        analysis.semanticAlignment = this.analyzeSemanticAlignment(
            userInput.description,
            generatedOutput.whatIs
        );
        
        // Calcular score final
        analysis.score = Math.round(
            (analysis.keywordCoverage * 0.5) +
            (analysis.categoryAlignment * 0.25) +
            (analysis.semanticAlignment * 0.25)
        );
        
        // Generar recomendaciones
        analysis.recommendations = this.generateRecommendations(analysis, userInput);
        
        return analysis;
    }
    
    static extractKeywords(text) {
        if (!text) return [];
        
        // Stopwords en español
        const stopwords = new Set([
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
            'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
            'pero', 'mas', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro',
            'ese', 'si', 'sí', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'muy',
            'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo',
            'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
            'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
            'una', 'las', 'los', 'del', 'al', 'es', 'son', 'esta', 'estas', 'estos',
            'esos', 'fue', 'sus', 'les', 'nos', 'una', 'sus'
        ]);
        
        // Extraer palabras significativas
        const words = text.toLowerCase()
            .replace(/[^\w\sáéíóúüñ]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopwords.has(word));
        
        // Contar frecuencia
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        // Retornar palabras más frecuentes (máximo 15)
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([word]) => word);
    }
    
    static analyzeCategoryAlignment(category, output) {
        if (!category || category === '') return 100;
        
        const categoryKeywords = {
            fintech: ['financ', 'dinero', 'pago', 'transacción', 'banco', 'inversión', 'ahorro'],
            healthtech: ['salud', 'bienestar', 'médic', 'ejercicio', 'fitness', 'nutrición'],
            edtech: ['educación', 'aprendizaje', 'curso', 'estudiante', 'enseñanza', 'conocimiento'],
            ecommerce: ['compra', 'venta', 'producto', 'tienda', 'carrito', 'pedido', 'comercio'],
            social: ['social', 'comunidad', 'red', 'compartir', 'seguir', 'amigo', 'conexión'],
            productivity: ['productividad', 'tarea', 'proyecto', 'gestión', 'organización', 'eficiencia'],
            entertainment: ['entretenimiento', 'contenido', 'video', 'película', 'serie', 'diversión'],
            travel: ['viaje', 'destino', 'hotel', 'vuelo', 'reserva', 'turismo', 'aventura'],
            food: ['comida', 'restaurante', 'delivery', 'receta', 'menú', 'gastronomía']
        };
        
        const keywords = categoryKeywords[category] || [];
        const outputText = (output.whatIs + ' ' + output.targetAudience).toLowerCase();
        
        const matches = keywords.filter(keyword => 
            outputText.includes(keyword)
        );
        
        return keywords.length > 0 
            ? (matches.length / keywords.length) * 100 
            : 100;
    }
    
    static analyzeSemanticAlignment(input, output) {
        // Verificar que el output no sea demasiado genérico
        const inputLength = input.split(' ').length;
        const outputLength = output.split(' ').length;
        
        // El output debe ser más largo pero no excesivamente
        const expansionRatio = outputLength / inputLength;
        
        // Ideal: 3-8x la longitud del input
        if (expansionRatio < 2) return 50; // Muy corto
        if (expansionRatio > 15) return 60; // Demasiado largo, posible desviación
        if (expansionRatio >= 3 && expansionRatio <= 8) return 100; // Óptimo
        if (expansionRatio >= 2 && expansionRatio < 3) return 80; // Aceptable pero corto
        if (expansionRatio > 8 && expansionRatio <= 15) return 75; // Aceptable pero largo
        
        return 70;
    }
    
    static generateRecommendations(analysis, userInput) {
        const recommendations = [];
        
        if (analysis.score < 60) {
            recommendations.push({
                type: 'critical',
                message: 'El resultado generado se ha desviado significativamente de tu descripción original.',
                action: 'regenerate'
            });
        }
        
        if (analysis.missing.length > 3) {
            recommendations.push({
                type: 'warning',
                message: `Faltan ${analysis.missing.length} conceptos clave de tu descripción: ${analysis.missing.slice(0, 3).join(', ')}...`,
                action: 'refine'
            });
        }
        
        if (analysis.extra.length > 5) {
            recommendations.push({
                type: 'info',
                message: 'Se agregaron conceptos que no mencionaste. Revisa si se alinean con tu visión.',
                action: 'review'
            });
        }
        
        if (analysis.categoryAlignment < 50) {
            recommendations.push({
                type: 'warning',
                message: `El contenido generado no parece alineado con la categoría "${userInput.category}".`,
                action: 'adjust_category'
            });
        }
        
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'success',
                message: 'Excelente alineación entre tu descripción y el resultado generado.',
                action: 'approve'
            });
        }
        
        return recommendations;
    }
    
    static getScoreLevel(score) {
        if (score >= 80) return { level: 'excellent', label: 'Excelente', icon: '✓' };
        if (score >= 65) return { level: 'good', label: 'Buena', icon: '✓' };
        if (score >= 50) return { level: 'fair', label: 'Aceptable', icon: '⚠' };
        return { level: 'poor', label: 'Baja', icon: '✕' };
    }
    
    // Método auxiliar para detectar similitud entre palabras (singular/plural, variaciones)
    static areSimilar(word1, word2) {
        // Si son muy cortas, no comparar
        if (word1.length < 4 || word2.length < 4) return false;
        
        // Calcular distancia de Levenshtein simplificada
        const maxLen = Math.max(word1.length, word2.length);
        const minLen = Math.min(word1.length, word2.length);
        
        // Si la diferencia de longitud es muy grande, no son similares
        if (maxLen - minLen > 3) return false;
        
        // Contar caracteres en común en las mismas posiciones
        let matches = 0;
        const len = Math.min(word1.length, word2.length);
        for (let i = 0; i < len; i++) {
            if (word1[i] === word2[i]) matches++;
        }
        
        // Si más del 75% de los caracteres coinciden, son similares
        return (matches / maxLen) >= 0.75;
    }
}

// ====================
// PREVIEW GENERATOR CLASS
// ====================
class PreviewGenerator {
    static generateHTMLPreview(flow, template = 'list', device = 'mobile', projectName = '') {
        const deviceWidths = {
            mobile: '375px',
            tablet: '768px',
            desktop: '1440px'
        };
        
        const width = deviceWidths[device] || '375px';
        const hasHeader = flow.globalElements?.header;
        const hasBottomNav = flow.globalElements?.bottomNav;
        
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.sanitize(flow.screen)}</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .device-frame {
            width: 100%;
            max-width: ${width};
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 600px;
        }
        
        .screen-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .screen-header .logo {
            font-size: 1.2rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .screen-header .logo::before {
            content: '📱';
            font-size: 1.5rem;
        }
        
        .screen-header .actions {
            display: flex;
            gap: 12px;
        }
        
        .screen-header .icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .screen-header .icon-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .screen-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .bottom-nav {
            display: flex;
            justify-content: space-around;
            padding: 12px 0;
            background: white;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }
        
        .bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 16px;
            color: #6b7280;
            font-size: 0.75rem;
            cursor: pointer;
            transition: color 0.2s;
            text-decoration: none;
        }
        
        .bottom-nav-item:hover,
        .bottom-nav-item.active {
            color: #6366f1;
        }
        
        .bottom-nav-item .icon {
            font-size: 1.5rem;
        }
        
        /* Layout Templates */
        .layout-list .element-item {
            padding: 16px;
            margin-bottom: 12px;
            background: #f9fafb;
            border-radius: 12px;
            border-left: 4px solid #6366f1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .layout-list .element-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .layout-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
        
        .layout-grid .element-item {
            padding: 16px;
            background: #f9fafb;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .layout-grid .element-item:hover {
            transform: scale(1.05);
        }
        
        .layout-feed .element-item {
            padding: 16px;
            margin-bottom: 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        
        .layout-feed .element-item::before {
            content: '👤';
            font-size: 2rem;
            display: block;
            margin-bottom: 8px;
        }
        
        .layout-dashboard {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
        
        .layout-dashboard .element-item {
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .layout-dashboard .element-item .value {
            font-size: 2rem;
            font-weight: 700;
        }
        
        .layout-dashboard .element-item .label {
            font-size: 0.85rem;
            opacity: 0.9;
        }
        
        .element-item {
            font-size: 0.9rem;
            color: #374151;
            line-height: 1.5;
        }
        
        .screen-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
        }
        
        .screen-description {
            font-size: 0.95rem;
            color: #6b7280;
            margin-bottom: 24px;
            line-height: 1.6;
        }
        
        @media (max-width: 640px) {
            .layout-grid,
            .layout-dashboard {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="device-frame">
        ${hasHeader ? `
        <div class="screen-header">
            <div class="logo">${projectName || 'App'}</div>
            <div class="actions">
                <div class="icon-btn">🔍</div>
                <div class="icon-btn">🔔</div>
                <div class="icon-btn">👤</div>
            </div>
        </div>
        ` : ''}
        
        <div class="screen-content">
            <h1 class="screen-title">${this.sanitize(flow.screen)}</h1>
            <p class="screen-description">${this.sanitize(flow.description)}</p>
            
            ${this.renderTemplate(flow.elements, template)}
        </div>
        
        ${hasBottomNav ? `
        <div class="bottom-nav">
            <a href="#" class="bottom-nav-item active">
                <span class="icon">🏠</span>
                <span>Inicio</span>
            </a>
            <a href="#" class="bottom-nav-item">
                <span class="icon">🔍</span>
                <span>Buscar</span>
            </a>
            <a href="#" class="bottom-nav-item">
                <span class="icon">➕</span>
                <span>Crear</span>
            </a>
            <a href="#" class="bottom-nav-item">
                <span class="icon">👤</span>
                <span>Perfil</span>
            </a>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }
    
    static renderTemplate(elements, template) {
        const layoutClass = `layout-${template}`;
        
        return `
            <div class="${layoutClass}">
                ${elements.map((el, index) => {
                    if (template === 'dashboard') {
                        return `
                            <div class="element-item">
                                <div class="value">${index + 1}</div>
                                <div class="label">${this.sanitize(el)}</div>
                            </div>
                        `;
                    }
                    return `<div class="element-item">${this.sanitize(el)}</div>`;
                }).join('')}
            </div>
        `;
    }
    
    static sanitize(text) {
        const temp = document.createElement('div');
        temp.textContent = text;
        return temp.innerHTML;
    }
}

// ====================
// OPTIMIZED RENDERER CLASS
// ====================
class OptimizedRenderer {
    static #renderedProjects = new Map();
    
    static renderProjectsList(projects, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const sorted = projects.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        
        // Crear un fragment para optimizar el DOM
        const fragment = document.createDocumentFragment();
        const existingIds = new Set();
        
        sorted.forEach(project => {
            existingIds.add(project.id);
            const cached = this.#renderedProjects.get(project.id);
            
            // Solo re-renderizar si cambió
            if (!cached || cached.updatedAt !== project.updatedAt || 
                cached.name !== project.name || cached.isActive !== (state.currentProjectId === project.id)) {
                
                const element = this.#createProjectElement(project);
                
                if (cached && cached.element.parentNode) {
                    cached.element.replaceWith(element);
                } else {
                    fragment.appendChild(element);
                }
                
                this.#renderedProjects.set(project.id, {
                    element,
                    updatedAt: project.updatedAt,
                    name: project.name,
                    isActive: state.currentProjectId === project.id
                });
            } else if (cached.element.parentNode !== container) {
                fragment.appendChild(cached.element);
            }
        });
        
        // Remover elementos que ya no existen
        this.#renderedProjects.forEach((value, key) => {
            if (!existingIds.has(key)) {
                value.element.remove();
                this.#renderedProjects.delete(key);
            }
        });
        
        if (fragment.children.length > 0) {
            container.innerHTML = '';
            container.appendChild(fragment);
        }
    }
    
    static #createProjectElement(project) {
        const div = document.createElement('div');
        div.className = `project-item ${state.currentProjectId === project.id ? 'active' : ''}`;
        div.dataset.id = project.id;
        div.onclick = () => openProject(project.id);
        
        const info = document.createElement('div');
        info.className = 'project-item-info';
        
        const name = document.createElement('div');
        name.className = 'project-item-name';
        name.textContent = project.name;
        
        const date = document.createElement('div');
        date.className = 'project-item-date';
        date.textContent = formatDate(project.updatedAt);
        
        info.appendChild(name);
        info.appendChild(date);
        
        const actions = document.createElement('div');
        actions.className = 'project-item-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'project-action-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteProject(project.id);
        };
        
        actions.appendChild(deleteBtn);
        
        div.appendChild(info);
        div.appendChild(actions);
        
        return div;
    }
    
    static clear() {
        this.#renderedProjects.clear();
    }
}

// ====================
// PROJECT VALIDATOR CLASS
// ====================
class ProjectValidator {
    static validate(data) {
        const errors = [];
        
        // Validación de nombre
        if (!data.name || data.name.trim().length < 3) {
            errors.push({ field: 'projectName', message: 'El nombre debe tener al menos 3 caracteres' });
        } else if (data.name.length > 50) {
            errors.push({ field: 'projectName', message: 'El nombre no puede exceder 50 caracteres' });
        }
        
        // Validación de descripción
        if (!data.description || data.description.trim().length < 20) {
            errors.push({ field: 'projectDescription', message: 'La descripción debe tener al menos 20 caracteres' });
        } else if (data.description.length > 500) {
            errors.push({ field: 'projectDescription', message: 'La descripción no puede exceder 500 caracteres' });
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    static clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + 'Error');
        if (field) field.classList.remove('error');
        if (error) {
            error.classList.remove('active');
            error.textContent = '';
        }
    }
    
    static showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + 'Error');
        if (field) field.classList.add('error');
        if (error) {
            error.classList.add('active');
            error.textContent = message;
        }
    }
    
    static clearAllErrors() {
        ['projectName', 'projectDescription'].forEach(fieldId => {
            this.clearFieldError(fieldId);
        });
    }
}

// ====================
// DOM SANITIZER CLASS
// ====================
class DOMSanitizer {
    static sanitize(text) {
        const temp = document.createElement('div');
        temp.textContent = text;
        return temp.innerHTML;
    }
    
    static sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remover scripts y event handlers
        temp.querySelectorAll('script').forEach(el => el.remove());
        temp.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        return temp.innerHTML;
    }
}

// ====================
// API ERROR HANDLER CLASS
// ====================
class APIErrorHandler {
    static handle(error, response) {
        if (!response) {
            return {
                type: 'NETWORK_ERROR',
                message: 'Error de conexión. Verifica tu internet.',
                userMessage: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
                fallback: true
            };
        }
        
        switch (response.status) {
            case 401:
                return {
                    type: 'AUTH_ERROR',
                    message: 'API Key inválida',
                    userMessage: 'La API Key proporcionada no es válida. Por favor verifica tu clave.',
                    action: 'FOCUS_API_KEY'
                };
            
            case 429:
                return {
                    type: 'RATE_LIMIT',
                    message: 'Límite de solicitudes alcanzado',
                    userMessage: 'Has alcanzado el límite de solicitudes. Intenta nuevamente en unos minutos.',
                    retryAfter: response.headers?.get('retry-after') || 60
                };
            
            case 500:
            case 502:
            case 503:
                return {
                    type: 'SERVER_ERROR',
                    message: 'Error del servidor',
                    userMessage: 'El servidor está experimentando problemas. Usando generación local como alternativa.',
                    fallback: true
                };
            
            case 400:
                return {
                    type: 'BAD_REQUEST',
                    message: 'Solicitud inválida',
                    userMessage: 'Los datos enviados no son válidos. Intenta con una descripción diferente.',
                    fallback: false
                };
            
            default:
                return {
                    type: 'UNKNOWN_ERROR',
                    message: `Error desconocido: ${response.status}`,
                    userMessage: 'Ocurrió un error inesperado. Usando generación local como alternativa.',
                    fallback: true
                };
        }
    }
}

// ====================
// AUTO SAVE MANAGER CLASS
// ====================
class AutoSaveManager {
    constructor(saveFunction, interval = 2000) {
        this.saveFunction = saveFunction;
        this.interval = interval;
        this.isDirty = false;
        this.isSaving = false;
        this.saveTimeout = null;
    }
    
    markDirty() {
        this.isDirty = true;
        this.updateIndicator('pending');
        this.scheduleSave();
    }
    
    async scheduleSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        
        this.saveTimeout = setTimeout(async () => {
            if (this.isDirty && !this.isSaving) {
                this.isSaving = true;
                this.updateIndicator('saving');
                
                try {
                    await this.saveFunction();
                    this.isDirty = false;
                    this.updateIndicator('saved');
                    
                    setTimeout(() => {
                        if (!this.isDirty) {
                            this.updateIndicator('idle');
                        }
                    }, 2000);
                } catch (error) {
                    console.error('Error saving:', error);
                    this.updateIndicator('error');
                    setTimeout(() => this.updateIndicator('idle'), 3000);
                }
                
                this.isSaving = false;
            }
        }, this.interval);
    }
    
    updateIndicator(state) {
        const indicator = document.getElementById('saveIndicator');
        if (!indicator) return;
        
        const states = {
            idle: { text: '', className: '' },
            pending: { text: '● Cambios sin guardar', className: '' },
            saving: { text: '⟳ Guardando...', className: 'saving' },
            saved: { text: '✓ Guardado', className: 'saved' },
            error: { text: '✕ Error al guardar', className: 'error' }
        };
        
        const stateConfig = states[state];
        indicator.textContent = stateConfig.text;
        indicator.className = 'save-indicator ' + stateConfig.className;
    }
}

// ====================
// PROGRESS TRACKER CLASS
// ====================
class ProgressTracker {
    constructor(steps) {
        this.steps = steps;
        this.currentStep = 0;
    }
    
    async execute() {
        for (let i = 0; i < this.steps.length; i++) {
            this.currentStep = i;
            const step = this.steps[i];
            
            this.updateProgress(step.name, (i / this.steps.length) * 100);
            
            try {
                await step.action();
            } catch (error) {
                console.error(`Error in step ${step.name}:`, error);
                throw error;
            }
        }
        
        this.updateProgress('Completado', 100);
    }
    
    updateProgress(stepName, percentage) {
        const loadingText = document.getElementById('loadingText');
        const progressContainer = document.getElementById('loadingProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (loadingText) loadingText.textContent = stepName;
        if (progressContainer) progressContainer.style.display = 'block';
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = Math.round(percentage) + '%';
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
    isLoadingProject: false,
    hasUnsavedChanges: false,
    lastSavedState: null
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
    setupUnsavedChangesWarning();
});

// Configurar advertencia al salir con cambios sin guardar
function setupUnsavedChangesWarning() {
    window.addEventListener('beforeunload', (e) => {
        if (state.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '⚠️ Tienes cambios sin guardar. ¿Deseas salir sin guardar los cambios?';
            return e.returnValue;
        }
    });
}

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
        // Marcar como guardado
        state.hasUnsavedChanges = false;
        state.lastSavedState = JSON.stringify(state.projects);
        updateSaveButtonState();
    } catch (error) {
        console.error('Error saving projects:', error);
    }
}

// Marcar que hay cambios sin guardar (llamar cuando se modifica algo)
function markUnsavedChanges() {
    state.hasUnsavedChanges = true;
    updateSaveButtonState();
}

// Actualizar estado visual del botón guardar
function updateSaveButtonState() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        if (state.hasUnsavedChanges) {
            saveBtn.classList.add('has-changes');
            saveBtn.title = '¡Hay cambios sin guardar!';
        } else {
            saveBtn.classList.remove('has-changes');
            saveBtn.title = 'Guardar proyecto';
        }
    }
}

// Verificar si hay cambios sin guardar antes de salir
function checkUnsavedChangesBeforeAction(callback, actionName = 'continuar') {
    if (state.hasUnsavedChanges) {
        const result = confirmWithSaveOption(actionName);
        if (result === 'save') {
            // Guardar y luego ejecutar callback
            saveCurrentProject();
            callback();
        } else if (result === 'nosave') {
            // Ejecutar sin guardar
            state.hasUnsavedChanges = false; // Resetear para no preguntar de nuevo
            callback();
        }
        // Si result === 'cancel', no hacer nada
    } else {
        callback();
    }
}

// Confirmar con opción de guardar
function confirmWithSaveOption(actionName = 'continuar') {
    // Primera pregunta: ¿Quieres guardar?
    const wantToSave = confirm(
        `⚠️ TIENES CAMBIOS SIN GUARDAR\n\n` +
        `¿Deseas GUARDAR los cambios antes de ${actionName}?\n\n` +
        `• Presiona ACEPTAR para GUARDAR y ${actionName}\n` +
        `• Presiona CANCELAR para continuar sin guardar`
    );
    
    if (wantToSave) {
        return 'save'; // Guardar y continuar
    } else {
        // Segunda pregunta: Confirmar que realmente quiere salir sin guardar
        const confirmNoSave = confirm(
            `⚠️ CONFIRMA TU DECISIÓN\n\n` +
            `Estás a punto de ${actionName} SIN GUARDAR.\n` +
            `Los cambios realizados se PERDERÁN.\n\n` +
            `• Presiona ACEPTAR para salir SIN GUARDAR\n` +
            `• Presiona CANCELAR para volver y guardar`
        );
        if (confirmNoSave) {
            return 'nosave'; // Salir sin guardar
        } else {
            return 'cancel'; // Cancelar acción y volver
        }
    }
}

// ========== Auto-resize Textareas ==========
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function setupAutoResizeTextareas() {
    // Aplicar a todos los textareas existentes
    document.querySelectorAll('textarea').forEach(textarea => {
        // Auto-resize inicial
        autoResizeTextarea(textarea);
        
        // Auto-resize en input
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
        
        // Auto-resize en focus (por si el contenido cambió)
        textarea.addEventListener('focus', () => autoResizeTextarea(textarea));
    });
    
    // Observer para nuevos textareas que se agreguen dinámicamente
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'TEXTAREA') {
                        autoResizeTextarea(node);
                        node.addEventListener('input', () => autoResizeTextarea(node));
                        node.addEventListener('focus', () => autoResizeTextarea(node));
                    }
                    // También buscar textareas dentro de nodos agregados
                    node.querySelectorAll?.('textarea').forEach(textarea => {
                        autoResizeTextarea(textarea);
                        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
                        textarea.addEventListener('focus', () => autoResizeTextarea(textarea));
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

function setupGlobalEventListeners() {
    // Setup auto-resize for all textareas
    setupAutoResizeTextareas();
    
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
    
    // Detectar cambios en campos del proyecto
    setupChangeDetection();
    
    // Initial prompt update if project exists
    setTimeout(() => {
        if (app && app.currentProject) {
            updatePromptOutput();
        }
    }, 100);
}

// Configurar detección de cambios en campos editables
function setupChangeDetection() {
    // Lista de IDs de campos que al cambiar marcan como "no guardado"
    const trackedFields = [
        'whatIs', 'targetAudience', 'needsSolved', 'differentiators', 
        'elevatorPitch', 'appType', 'uiComponents', 'metricsDetail', 'mainFeatures'
    ];
    
    trackedFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => {
                if (state.currentProjectId) {
                    markUnsavedChanges();
                }
            });
        }
    });
    
    // También detectar cambios en cualquier textarea dentro de projectView
    const projectView = document.getElementById('projectView');
    if (projectView) {
        projectView.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                if (state.currentProjectId) {
                    markUnsavedChanges();
                }
            }
        });
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
    
    // Populate preview selectors when preview tab is activated
    if (tabId === 'preview') {
        setTimeout(() => {
            populatePreviewSelectors();
        }, 50);
    }
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
        promptOutput.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <p style="font-size: 1.1rem; margin-bottom: 8px;">No hay proyecto seleccionado</p>
            <p style="font-size: 0.9rem;">Crea o carga un proyecto para generar prompts</p>
        </div>`;
        return;
    }

    // Si no hay secciones seleccionadas, mostrar mensaje vacío
    if (!state.selectedPromptSections || state.selectedPromptSections.length === 0) {
        promptOutput.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <p style="font-size: 1.1rem; margin-bottom: 8px;">👆 Selecciona las secciones que deseas incluir</p>
            <p style="font-size: 0.9rem;">El prompt se generará automáticamente con el contenido seleccionado</p>
        </div>`;
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
    
    let result = '⚠️ REGLA CRÍTICA DE IDIOMA ⚠️\n';
    result += '═'.repeat(50) + '\n';
    result += 'TODO el contenido debe estar 100% en ESPAÑOL.\n';
    result += 'PROHIBIDO usar palabras en inglés en textos UI.\n';
    result += 'Ejemplos CORRECTOS: "Inicio", "Buscar", "Perfil", "Configuración"\n';
    result += 'Ejemplos INCORRECTOS: "Home", "Search", "Profile", "Settings"\n';
    result += '═'.repeat(50) + '\n';
    
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
                
                // Interacciones
                if (flow.interactions && flow.interactions.length > 0) {
                    result += `   \n   👆 Interacciones:\n`;
                    flow.interactions.forEach(interaction => {
                        result += `      • ${interaction}\n`;
                    });
                }
                
                // Gestión de Estado
                if (flow.stateManagement) {
                    result += `   \n   📊 Gestión de Estado:\n`;
                    result += `      Loading: ${flow.stateManagement.loading ? '✓' : '✗'} | `;
                    result += `Empty: ${flow.stateManagement.empty ? '✓' : '✗'} | `;
                    result += `Error: ${flow.stateManagement.error ? '✓' : '✗'}\n`;
                }
                
                // Accesibilidad
                if (flow.accessibilityNotes && flow.accessibilityNotes.length > 0) {
                    result += `   \n   ♿ Notas de Accesibilidad:\n`;
                    flow.accessibilityNotes.forEach(note => {
                        result += `      • ${note}\n`;
                    });
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
    
    // Idioma - ADVERTENCIA CRÍTICA PRIMERO
    if (generalRules.language) {
        result += '\n### 🚨 IDIOMA - REGLA CRÍTICA 🚨\n';
        result += `\n⚠️ ${generalRules.language.critical || 'TODO el contenido debe estar en ESPAÑOL'}\n\n`;
        result += `Idioma Principal: ${generalRules.language.primary}\n`;
        
        if (generalRules.language.prohibited && generalRules.language.prohibited.length > 0) {
            result += '\n❌ PALABRAS PROHIBIDAS (usar equivalente en español):\n';
            generalRules.language.prohibited.forEach(prohibition => {
                result += `   ${prohibition}\n`;
            });
        }
        
        if (generalRules.language.localization) {
            result += `\nFormato fechas: ${generalRules.language.localization.dateFormat}\n`;
            result += `Formato números: ${generalRules.language.localization.numberFormat}\n`;
        }
        
        if (generalRules.language.rules) {
            result += '\n✅ Reglas obligatorias:\n';
            generalRules.language.rules.forEach(rule => {
                result += `   • ${rule}\n`;
            });
        }
        
        if (generalRules.language.validation) {
            result += `\n🔍 Validación final: ${generalRules.language.validation.check}\n`;
            if (generalRules.language.validation.exception) {
                result += `   Excepción: ${generalRules.language.validation.exception}\n`;
            }
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

// ========== NAVIGATION SYSTEM ==========
const navigationHistory = [];
let currentNavigationIndex = -1;

function pushNavigationState(stateName) {
    // Eliminar estados posteriores si estamos en medio del historial
    if (currentNavigationIndex < navigationHistory.length - 1) {
        navigationHistory.splice(currentNavigationIndex + 1);
    }
    
    // Agregar nuevo estado
    navigationHistory.push({
        name: stateName,
        projectId: state.currentProjectId,
        timestamp: Date.now()
    });
    
    currentNavigationIndex = navigationHistory.length - 1;
    updateNavigationButtons();
}

function navigateBack() {
    if (currentNavigationIndex <= 0) {
        // Si no hay historial, ir al inicio
        goToHome();
        return;
    }
    
    currentNavigationIndex--;
    const prevState = navigationHistory[currentNavigationIndex];
    
    if (prevState) {
        restoreNavigationState(prevState);
    }
    
    updateNavigationButtons();
}

function restoreNavigationState(navState) {
    if (navState.name === 'home' || navState.name === 'welcome') {
        showWelcomeScreen();
    } else if (navState.name === 'newProject') {
        showProjectForm();
    } else if (navState.name === 'project' && navState.projectId) {
        const project = state.projects.find(p => p.id === navState.projectId);
        if (project) {
            loadProject(project.id);
        } else {
            goToHome();
        }
    } else if (navState.name === 'overview' && navState.projectId) {
        const project = state.projects.find(p => p.id === navState.projectId);
        if (project) {
            showOverviewSection(project);
        }
    }
}

function goToHome() {
    // Verificar si hay cambios sin guardar
    if (state.hasUnsavedChanges) {
        const result = confirmWithSaveOption('ir al inicio');
        if (result === 'save') {
            saveCurrentProject();
        } else if (result === 'cancel') {
            return; // No hacer nada
        }
        // Si result === 'nosave', continuar sin guardar
    }
    
    // Limpiar estado actual
    state.currentProjectId = null;
    state.hasUnsavedChanges = false;
    
    // Mostrar pantalla de bienvenida
    showWelcomeScreen();
    
    // Actualizar header
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) {
        headerTitle.textContent = 'Bienvenido a FlowForge';
    }
    
    // Ocultar botones de proyecto
    hideProjectButtons();
    
    // Agregar al historial
    pushNavigationState('home');
    
    if (app) {
        app.showNotification('🏠 Inicio', 'info', null, 1500);
    }
}

function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const projectForm = document.getElementById('projectForm');
    const projectView = document.getElementById('projectView');
    const overviewSection = document.getElementById('overviewSection');
    const mainTabs = document.getElementById('mainTabs');
    const promptBuilder = document.getElementById('promptBuilder');
    
    if (welcomeScreen) welcomeScreen.style.display = 'flex';
    if (projectForm) projectForm.style.display = 'none';
    if (projectView) projectView.style.display = 'none';
    if (overviewSection) overviewSection.style.display = 'none';
    if (mainTabs) mainTabs.style.display = 'none';
    if (promptBuilder) promptBuilder.style.display = 'none';
}

function showProjectForm() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const projectForm = document.getElementById('projectForm');
    const projectView = document.getElementById('projectView');
    
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (projectForm) projectForm.style.display = 'block';
    if (projectView) projectView.style.display = 'none';
}

function showOverviewSection(project) {
    const projectView = document.getElementById('projectView');
    const overviewSection = document.getElementById('overviewSection');
    const mainTabs = document.getElementById('mainTabs');
    const promptBuilder = document.getElementById('promptBuilder');
    
    if (projectView) projectView.style.display = 'block';
    if (overviewSection) overviewSection.style.display = 'block';
    if (mainTabs) mainTabs.style.display = 'none';
    if (promptBuilder) promptBuilder.style.display = 'none';
    
    populateOverview(project);
}

function hideProjectButtons() {
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    const shareBtn = document.getElementById('shareBtn');
    const versionsBtn = document.getElementById('versionsBtn');
    
    if (saveBtn) saveBtn.style.display = 'none';
    if (exportBtn) exportBtn.style.display = 'none';
    if (shareBtn) shareBtn.style.display = 'none';
    if (versionsBtn) versionsBtn.style.display = 'none';
}

function updateNavigationButtons() {
    const backBtn = document.getElementById('navBackBtn');
    
    if (backBtn) {
        // Deshabilitar si estamos en el inicio o no hay historial
        const canGoBack = currentNavigationIndex > 0 || state.currentProjectId;
        backBtn.disabled = !canGoBack;
    }
}

// Global functions for HTML onclick handlers
function createNewProject() {
    // Verificar si hay cambios sin guardar
    if (state.hasUnsavedChanges) {
        if (!confirm('⚠️ Tienes cambios sin guardar.\\n\\n¿Deseas crear un nuevo proyecto sin guardar?')) {
            return;
        }
    }
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const projectForm = document.getElementById('projectForm');
    
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (projectForm) projectForm.style.display = 'block';
    
    // Resetear estado de cambios
    state.hasUnsavedChanges = false;
    updateSaveButtonState();
    
    // Agregar al historial de navegación
    pushNavigationState('newProject');
    
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
    showVersionsModal();
}

function showShareDialog() {
    showShareModal();
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

// ========== Alignment Control Functions ==========

async function regenerateWithFocus() {
    if (!state.currentProjectId) return;
    
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (!project) return;
    
    if (!confirm('¿Regenerar el proyecto enfocándote más en tu descripción original?\n\nEsto analizará tu descripción y generará contenido que refleje exactamente tus palabras clave y conceptos.')) {
        return;
    }
    
    // Show loading in overview section
    const overviewContent = document.getElementById('overviewContent');
    if (overviewContent) {
        overviewContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔄</div>
                <div style="color: var(--text-primary); font-weight: 600; font-size: 1.2rem; margin-bottom: 8px;">Regenerando con Mayor Foco...</div>
                <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">Analizando tu descripción original y extrayendo conceptos clave</div>
                <div style="width: 200px; height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin: 0 auto; overflow: hidden;">
                    <div style="width: 30%; height: 100%; background: var(--accent-primary); border-radius: 2px; animation: loading 1.5s infinite;"></div>
                </div>
            </div>
            <style>
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            </style>
        `;
    }
    
    try {
        const apiKey = document.getElementById('apiKeyInput')?.value?.trim();
        const name = project.name;
        const category = project.category;
        const description = project.expandedDescription || project.description;
        
        // Extraer conceptos clave de la descripción original
        const keywordsFromDescription = extractKeywordsFromDescription(description);
        
        let newData;
        
        if (apiKey) {
            // Regenerar con API usando prompt enfocado en los conceptos extraídos
            newData = await generateProjectDataWithFocus(name, category, description, keywordsFromDescription, apiKey);
        } else {
            // Regenerar localmente pero de forma inteligente
            newData = generateFocusedProjectDataLocally(name, category, description, keywordsFromDescription);
        }
        
        // Actualizar proyecto
        project.data = newData;
        project.updatedAt = new Date().toISOString();
        
        // Marcar como cambios pendientes (no guardar automáticamente)
        markUnsavedChanges();
        
        // Refrescar vista
        populateOverview(project);
        
        if (app) {
            app.showNotification('✓ Proyecto regenerado con mayor alineación a tu descripción', 'success');
        }
    } catch (error) {
        console.error('Error regenerating:', error);
        if (app) {
            app.showNotification('Error al regenerar. Intenta de nuevo.', 'error');
        }
        // Restaurar vista
        populateOverview(project);
    }
}

function extractKeywordsFromDescription(description) {
    // Stopwords en español
    const stopwords = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
        'en', 'con', 'por', 'para', 'que', 'es', 'son', 'ser', 'está', 'están',
        'como', 'más', 'muy', 'pero', 'sin', 'sobre', 'entre', 'cada', 'todo',
        'todos', 'toda', 'todas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa',
        'esos', 'esas', 'aquel', 'aquella', 'y', 'o', 'ni', 'si', 'no', 'se',
        'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'lo', 'le', 'les', 'me', 'te',
        'nos', 'os', 'hay', 'ha', 'han', 'he', 'has', 'hemos', 'hacer', 'hace',
        'cuando', 'donde', 'quien', 'cual', 'cuyo', 'porque', 'aunque', 'sino',
        'mientras', 'mediante', 'según', 'hacia', 'hasta', 'desde', 'durante',
        'través', 'así', 'también', 'además', 'etc', 'the', 'and', 'for', 'with'
    ]);
    
    // Limpiar y tokenizar
    const words = description.toLowerCase()
        .replace(/[^\wáéíóúüñ\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w));
    
    // Contar frecuencia
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Extraer keywords principales (frecuencia > 1 o palabras largas)
    const keywords = Object.entries(frequency)
        .filter(([word, count]) => count > 1 || word.length > 6)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);
    
    // Extraer frases clave (bigramas)
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
        if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1])) {
            bigrams.push(`${words[i]} ${words[i + 1]}`);
        }
    }
    
    // Extraer conceptos específicos (sustantivos compuestos comunes)
    const conceptPatterns = [
        /calendario\s+\w+/gi,
        /gestión\s+de\s+\w+/gi,
        /seguimiento\s+de\s+\w+/gi,
        /\w+\s+interactivo/gi,
        /\w+\s+de\s+tareas/gi,
        /equipos?\s+de\s+trabajo/gi,
        /estilo\s+\w+/gi,
        /tema\s+\w+/gi
    ];
    
    const concepts = [];
    conceptPatterns.forEach(pattern => {
        const matches = description.match(pattern);
        if (matches) {
            concepts.push(...matches.map(m => m.toLowerCase()));
        }
    });
    
    return {
        keywords: [...new Set(keywords)],
        bigrams: [...new Set(bigrams)].slice(0, 10),
        concepts: [...new Set(concepts)],
        originalDescription: description
    };
}

async function generateProjectDataWithFocus(name, category, description, extractedKeywords, apiKey) {
    const keywordsList = extractedKeywords.keywords.join(', ');
    const conceptsList = extractedKeywords.concepts.join(', ');
    
    const focusedPrompt = `Eres un experto en UX/UI. Tu tarea es generar especificaciones para una aplicación basándote ESTRICTAMENTE en la descripción del usuario.

=== REGLAS CRÍTICAS DE FIDELIDAD ===
1. DEBES usar estas palabras clave que el usuario mencionó: ${keywordsList}
2. DEBES incluir estos conceptos específicos: ${conceptsList || 'ninguno específico'}
3. NO inventes funcionalidades que el usuario NO mencionó
4. Cada feature debe poder rastrearse a algo mencionado en la descripción
5. Mantén el ALCANCE exacto definido por el usuario

=== DESCRIPCIÓN DEL USUARIO (FUENTE DE VERDAD) ===
Proyecto: ${name}
Categoría: ${category}
Descripción: ${description}

=== GENERA ===
Un JSON con esta estructura exacta:
{
  "whatIs": "Descripción usando las palabras clave del usuario",
  "targetAudience": "Audiencia objetivo mencionada o inferida de la descripción",
  "needsSolved": "Necesidades que el usuario mencionó explícitamente",
  "mainFeatures": "• Feature 1 (basado en descripción)\\n• Feature 2\\n• Feature 3",
  "differentiators": "Lo que hace único basado en lo que el usuario describió",
  "elevatorPitch": "Pitch usando la terminología exacta del usuario"
}

IMPORTANTE: Cada campo debe reflejar SOLO lo que el usuario describió. Si algo no está claro, mantente conservador.

Responde SOLO con el JSON, sin explicaciones.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: focusedPrompt
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.content[0].text;
        
        // Extraer JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const aiGeneratedFields = JSON.parse(jsonMatch[0]);
            
            // Combinar con datos estructurales generados localmente
            const baseData = generateProjectData(name, category, description);
            
            // Sobrescribir campos de texto con los generados por IA (más focalizados)
            return {
                ...baseData,
                whatIs: aiGeneratedFields.whatIs || baseData.whatIs,
                targetAudience: aiGeneratedFields.targetAudience || baseData.targetAudience,
                needsSolved: aiGeneratedFields.needsSolved || baseData.needsSolved,
                mainFeatures: aiGeneratedFields.mainFeatures || baseData.mainFeatures,
                differentiators: aiGeneratedFields.differentiators || baseData.differentiators,
                elevatorPitch: aiGeneratedFields.elevatorPitch || baseData.elevatorPitch
            };
        }
        
        throw new Error('No valid JSON in response');
    } catch (error) {
        console.error('API regeneration failed:', error);
        // Fallback inteligente
        return generateFocusedProjectDataLocally(name, category, description, extractedKeywords);
    }
}

function generateFocusedProjectDataLocally(name, category, description, extractedKeywords) {
    // Generar datos base
    const baseData = generateProjectData(name, category, description);
    
    const keywords = extractedKeywords.keywords;
    const concepts = extractedKeywords.concepts;
    
    // Reformular whatIs usando keywords
    const keywordsInWhatIs = keywords.slice(0, 5).join(', ');
    baseData.whatIs = `${name} es una aplicación de ${category} diseñada para ${description.split('.')[0].toLowerCase()}. ` +
        `Enfocada en: ${keywordsInWhatIs}. ` +
        `Esta solución permite a los usuarios gestionar de manera eficiente los aspectos clave mencionados en su visión original.`;
    
    // Reformular mainFeatures basándose en keywords
    const focusedFeatures = [];
    keywords.slice(0, 8).forEach((keyword, i) => {
        const featureTemplates = [
            `Sistema de ${keyword} integrado`,
            `Gestión de ${keyword}`,
            `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} inteligente`,
            `Módulo de ${keyword}`,
            `Herramientas de ${keyword}`,
            `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} personalizable`,
            `Control de ${keyword}`,
            `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} avanzado`
        ];
        focusedFeatures.push(`• ${featureTemplates[i % featureTemplates.length]}`);
    });
    
    // Agregar conceptos específicos como features
    concepts.slice(0, 3).forEach(concept => {
        focusedFeatures.push(`• ${concept.charAt(0).toUpperCase() + concept.slice(1)}`);
    });
    
    baseData.mainFeatures = focusedFeatures.join('\n');
    
    // Reformular needsSolved
    baseData.needsSolved = `Los usuarios necesitan una solución que les permita:\n` +
        keywords.slice(0, 5).map(k => `• Gestionar ${k} de manera eficiente`).join('\n') + '\n' +
        `• Acceder a sus datos desde cualquier dispositivo\n` +
        `• Colaborar con su equipo de trabajo`;
    
    // Reformular differentiators
    if (concepts.length > 0) {
        baseData.differentiators = `${name} se diferencia por su enfoque en ${concepts.join(', ')}. ` +
            `A diferencia de otras soluciones, está diseñado específicamente para ${description.split('.')[0].toLowerCase()}.`;
    }
    
    // Reformular elevatorPitch
    baseData.elevatorPitch = `${name} es ${description.split('.')[0]}. ` +
        `Diseñado para ${category === 'productivity' ? 'profesionales y equipos' : 'usuarios'} que buscan ` +
        `${keywords.slice(0, 3).join(', ')}. ` +
        `Simple, efectivo y alineado con tu visión original.`;
    
    return baseData;
}

function adjustGeneration() {
    console.log('adjustGeneration called, currentProjectId:', state.currentProjectId);
    
    // Intentar obtener el proyecto actual de varias fuentes
    let project = null;
    
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    
    // Fallback: si app tiene el proyecto actual
    if (!project && app && app.currentProject) {
        project = app.currentProject;
        state.currentProjectId = project.id;
    }
    
    // Fallback: buscar el proyecto activo en la lista
    if (!project) {
        const activeItem = document.querySelector('.project-item.active');
        if (activeItem) {
            const projectId = activeItem.getAttribute('data-id');
            if (projectId) {
                project = state.projects.find(p => p.id == projectId);
                if (project) state.currentProjectId = project.id;
            }
        }
    }
    
    if (!project) {
        console.error('No project found for adjustGeneration');
        if (app) app.showNotification('Error: No se encontró el proyecto activo', 'error');
        return;
    }
    
    console.log('Project found:', project.name);
    
    // Obtener análisis de alineación actual
    const userInput = {
        name: project.name,
        category: project.category,
        description: project.expandedDescription || project.description
    };
    
    try {
        const analysis = AlignmentAnalyzer.analyze(userInput, project.data);
        console.log('Analysis result:', analysis);
        
        // Crear interfaz de ajuste inteligente
        createSmartAdjustmentInterface(project, analysis);
    } catch (error) {
        console.error('Error in AlignmentAnalyzer:', error);
        if (app) app.showNotification('Error al analizar alineación', 'error');
    }
}

function createSmartAdjustmentInterface(project, analysis) {
    const overviewContent = document.getElementById('overviewContent');
    if (!overviewContent || !project.data) return;
    
    const data = project.data;
    const missingConcepts = analysis.missing || [];
    const extraConcepts = analysis.extra || [];
    
    // Inicializar set de conceptos seleccionados para integrar
    window._selectedConceptsToIntegrate = new Set();
    window._missingConcepts = missingConcepts;
    window._extraConcepts = extraConcepts;
    window._activeAdjustmentField = null;
    
    // Crear HTML de conceptos faltantes como chips seleccionables
    const missingChipsHTML = missingConcepts.map(concept => `
        <button class="concept-chip missing-chip" data-concept="${concept}" onclick="toggleConceptSelection('${concept}')" 
            style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; margin: 3px; background: rgba(239, 68, 68, 0.15); color: var(--error); border: 1px dashed var(--error); border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;">
            <span class="chip-icon">+</span> ${concept}
        </button>
    `).join('');
    
    // Crear formulario de edición inteligente
    overviewContent.innerHTML = `
        <div class="smart-adjustment-form" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                <h3 style="color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span>🎯</span> Ajuste Inteligente de Alineación
                </h3>
                <div style="display: flex; gap: 10px;">
                    <button onclick="cancelOverviewEdit()" style="padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                        Cancelar
                    </button>
                    <button onclick="applyAndSaveAdjustments()" style="padding: 8px 16px; background: var(--accent-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                        💾 Aplicar y Guardar
                    </button>
                </div>
            </div>
            
            <!-- Panel de Conceptos -->
            ${missingConcepts.length > 0 || extraConcepts.length > 0 ? `
            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color);">
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 12px; font-size: 0.9rem;">
                    📋 Selección de Conceptos a Integrar
                </div>
                
                ${missingConcepts.length > 0 ? `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500;">
                        <span style="color: var(--error);">✕ Conceptos Faltantes</span> — Click para seleccionar cuáles integrar:
                    </div>
                    <div id="missingConceptsContainer" style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${missingChipsHTML}
                    </div>
                    <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center;">
                        <button onclick="selectAllMissingConcepts()" style="padding: 4px 10px; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                            Seleccionar todos
                        </button>
                        <button onclick="clearConceptSelection()" style="padding: 4px 10px; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                            Limpiar selección
                        </button>
                        <span id="selectionCount" style="font-size: 0.75rem; color: var(--text-muted);">0 seleccionados</span>
                    </div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <!-- Instrucciones -->
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px;">
                <div style="font-size: 0.85rem; color: var(--accent-primary); font-weight: 500; margin-bottom: 4px;">
                    📝 Cómo funciona:
                </div>
                <ol style="margin: 0; padding-left: 20px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
                    <li>Haz click en los conceptos faltantes que quieras integrar (se marcarán en <span style="color: var(--success);">verde ✓</span>)</li>
                    <li>Los conceptos seleccionados se agregarán automáticamente a "Características Principales"</li>
                    <li>También puedes editar los campos directamente</li>
                    <li>Click en "Aplicar y Guardar" para confirmar los cambios</li>
                </ol>
            </div>
            
            <!-- Campos Editables -->
            <div style="display: grid; gap: 16px;">
                <div class="edit-field">
                    <label style="display: block; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px; font-weight: 500;">
                        ¿Qué es?
                    </label>
                    <textarea id="edit-whatIs" class="adjustment-field" style="width: 100%; min-height: 80px; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; font-family: inherit; font-size: 0.95rem;">${data.whatIs || ''}</textarea>
                </div>
                
                <div class="edit-field">
                    <label style="display: block; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px; font-weight: 500;">
                        Características Principales <span style="color: var(--success); font-size: 0.75rem;">(aquí se agregarán los conceptos seleccionados)</span>
                    </label>
                    <textarea id="edit-mainFeatures" class="adjustment-field" style="width: 100%; min-height: 120px; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; font-family: inherit; font-size: 0.95rem;">${data.mainFeatures || ''}</textarea>
                </div>
                
                <div class="edit-field">
                    <label style="display: block; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px; font-weight: 500;">Necesidades que Resuelve</label>
                    <textarea id="edit-needsSolved" class="adjustment-field" style="width: 100%; min-height: 80px; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; font-family: inherit; font-size: 0.95rem;">${data.needsSolved || ''}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="edit-field">
                        <label style="display: block; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px; font-weight: 500;">Público Objetivo</label>
                        <textarea id="edit-targetAudience" class="adjustment-field" style="width: 100%; min-height: 60px; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; font-family: inherit; font-size: 0.95rem;">${data.targetAudience || ''}</textarea>
                    </div>
                    
                    <div class="edit-field">
                        <label style="display: block; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px; font-weight: 500;">Diferenciadores</label>
                        <textarea id="edit-differentiators" class="adjustment-field" style="width: 100%; min-height: 60px; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; font-family: inherit; font-size: 0.95rem;">${data.differentiators || ''}</textarea>
                    </div>
                </div>
                
                <div class="edit-field">
                    <label style="display: block; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px; font-weight: 500;">Elevator Pitch</label>
                    <textarea id="edit-elevatorPitch" class="adjustment-field" style="width: 100%; min-height: 60px; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; font-family: inherit; font-size: 0.95rem;">${data.elevatorPitch || ''}</textarea>
                </div>
            </div>
        </div>
        
        <style>
            .adjustment-field:focus {
                border-color: var(--accent-primary) !important;
                outline: none;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
            }
            .missing-chip {
                transition: all 0.2s ease;
            }
            .missing-chip:hover {
                transform: scale(1.05);
            }
            .missing-chip.selected {
                background: rgba(34, 197, 94, 0.25) !important;
                color: var(--success) !important;
                border-color: var(--success) !important;
                border-style: solid !important;
            }
        </style>
    `;
    
    // Auto-resize textareas
    overviewContent.querySelectorAll('textarea').forEach(textarea => {
        autoResizeTextarea(textarea);
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    });
    
    if (app) {
        app.showNotification('🎯 Selecciona los conceptos faltantes que quieras integrar', 'info');
    }
}

// Toggle selección de concepto
function toggleConceptSelection(concept) {
    const chip = document.querySelector(`[data-concept="${concept}"].missing-chip`);
    if (!chip) return;
    
    if (window._selectedConceptsToIntegrate.has(concept)) {
        // Deseleccionar
        window._selectedConceptsToIntegrate.delete(concept);
        chip.classList.remove('selected');
        chip.querySelector('.chip-icon').textContent = '+';
    } else {
        // Seleccionar
        window._selectedConceptsToIntegrate.add(concept);
        chip.classList.add('selected');
        chip.querySelector('.chip-icon').textContent = '✓';
    }
    
    updateSelectionCount();
}

// Seleccionar todos los conceptos faltantes
function selectAllMissingConcepts() {
    const missingConcepts = window._missingConcepts || [];
    missingConcepts.forEach(concept => {
        if (!window._selectedConceptsToIntegrate.has(concept)) {
            window._selectedConceptsToIntegrate.add(concept);
            const chip = document.querySelector(`[data-concept="${concept}"].missing-chip`);
            if (chip) {
                chip.classList.add('selected');
                chip.querySelector('.chip-icon').textContent = '✓';
            }
        }
    });
    updateSelectionCount();
}

// Limpiar selección
function clearConceptSelection() {
    window._selectedConceptsToIntegrate.clear();
    document.querySelectorAll('.missing-chip').forEach(chip => {
        chip.classList.remove('selected');
        const icon = chip.querySelector('.chip-icon');
        if (icon) icon.textContent = '+';
    });
    updateSelectionCount();
}

// Actualizar contador de selección
function updateSelectionCount() {
    const count = window._selectedConceptsToIntegrate.size;
    const countEl = document.getElementById('selectionCount');
    if (countEl) {
        countEl.textContent = `${count} seleccionado${count !== 1 ? 's' : ''}`;
        countEl.style.color = count > 0 ? 'var(--success)' : 'var(--text-muted)';
    }
}

// Aplicar conceptos seleccionados y guardar
function applyAndSaveAdjustments() {
    if (!state.currentProjectId) return;
    
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (!project) return;
    
    // Obtener valores actuales de los campos
    let mainFeatures = document.getElementById('edit-mainFeatures')?.value || '';
    
    // Agregar SOLO los conceptos seleccionados a mainFeatures
    const selectedConcepts = Array.from(window._selectedConceptsToIntegrate || new Set());
    
    if (selectedConcepts.length > 0) {
        selectedConcepts.forEach(concept => {
            // Verificar si ya existe en el campo
            if (!mainFeatures.toLowerCase().includes(concept.toLowerCase())) {
                mainFeatures += mainFeatures.endsWith('\n') || mainFeatures === '' 
                    ? `• ${concept.charAt(0).toUpperCase() + concept.slice(1)}\n`
                    : `\n• ${concept.charAt(0).toUpperCase() + concept.slice(1)}`;
            }
        });
    }
    
    // Actualizar el campo de mainFeatures
    const mainFeaturesField = document.getElementById('edit-mainFeatures');
    if (mainFeaturesField) {
        mainFeaturesField.value = mainFeatures;
    }
    
    // Obtener todos los valores de los campos
    const whatIs = document.getElementById('edit-whatIs')?.value;
    const targetAudience = document.getElementById('edit-targetAudience')?.value;
    const needsSolved = document.getElementById('edit-needsSolved')?.value;
    const differentiators = document.getElementById('edit-differentiators')?.value;
    const elevatorPitch = document.getElementById('edit-elevatorPitch')?.value;
    
    // Actualizar datos del proyecto
    if (whatIs !== undefined) project.data.whatIs = whatIs;
    if (targetAudience !== undefined) project.data.targetAudience = targetAudience;
    if (needsSolved !== undefined) project.data.needsSolved = needsSolved;
    project.data.mainFeatures = mainFeatures;
    if (differentiators !== undefined) project.data.differentiators = differentiators;
    if (elevatorPitch !== undefined) project.data.elevatorPitch = elevatorPitch;
    
    project.updatedAt = new Date().toISOString();
    saveProjects(); // Guardado explícito por acción del usuario
    
    // Limpiar variables temporales
    window._selectedConceptsToIntegrate = null;
    window._missingConcepts = null;
    window._extraConcepts = null;
    
    // Volver a mostrar el overview con el nuevo análisis
    populateOverview(project);
    
    const addedCount = selectedConcepts.length;
    if (app) {
        if (addedCount > 0) {
            app.showNotification(`✓ ${addedCount} concepto${addedCount !== 1 ? 's' : ''} integrado${addedCount !== 1 ? 's' : ''}. Alineación actualizada.`, 'success');
        } else {
            app.showNotification('✓ Cambios guardados correctamente', 'success');
        }
    }
}

function cancelOverviewEdit() {
    if (!state.currentProjectId) return;
    
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (!project) return;
    
    // Limpiar variables temporales
    window._selectedConceptsToIntegrate = null;
    window._missingConcepts = null;
    window._extraConcepts = null;
    
    // Volver a mostrar el overview normal sin guardar
    populateOverview(project);
    
    if (app) {
        app.showNotification('Edición cancelada', 'info');
    }
}

function showAlignmentDetails() {
    if (!state.currentProjectId) return;
    
    const project = state.projects.find(p => p.id === state.currentProjectId);
    if (!project) return;
    
    const userInput = {
        name: project.name,
        category: project.category,
        description: project.expandedDescription || project.description
    };
    
    const analysis = AlignmentAnalyzer.analyze(userInput, project.data);
    
    // Crear modal con detalles completos
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'alignmentDetailsModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>🔍 Análisis Detallado de Alineación</h3>
                <button class="close-modal" onclick="document.getElementById('alignmentDetailsModal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: ${analysis.score >= 70 ? 'var(--success)' : analysis.score >= 50 ? 'var(--warning)' : 'var(--error)'};">${Math.round(analysis.score)}%</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Puntuación Total</div>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--accent-primary);">${analysis.matched.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Conceptos Encontrados</div>
                    </div>
                    <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--error);">${analysis.missing.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Conceptos Faltantes</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; color: var(--success);">✓ Palabras Clave Encontradas</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${analysis.matched.map(k => `<span style="padding: 6px 12px; background: rgba(34, 197, 94, 0.2); color: var(--success); border-radius: 20px; font-size: 0.8rem;">✓ ${k}</span>`).join('')}
                        ${analysis.matched.length === 0 ? '<span style="color: var(--text-muted);">Ninguno</span>' : ''}
                    </div>
                </div>
                
                ${analysis.missing.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; color: var(--error);">✕ Palabras Clave Faltantes</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Estas palabras de tu descripción no aparecen en el contenido generado:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${analysis.missing.map(k => `<span style="padding: 6px 12px; background: rgba(239, 68, 68, 0.2); color: var(--error); border-radius: 20px; font-size: 0.8rem;">✕ ${k}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div style="padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <h4 style="margin-bottom: 12px;">📊 Métricas Detalladas</h4>
                    <div style="display: grid; gap: 12px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 0.85rem;">Cobertura de Palabras Clave</span>
                                <span style="font-weight: 600;">${Math.round(analysis.keywordCoverage)}%</span>
                            </div>
                            <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${analysis.keywordCoverage}%; background: var(--accent-primary); border-radius: 4px;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 0.85rem;">Alineación con Categoría</span>
                                <span style="font-weight: 600;">${Math.round(analysis.categoryAlignment)}%</span>
                            </div>
                            <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${analysis.categoryAlignment}%; background: var(--accent-secondary); border-radius: 4px;"></div>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 0.85rem;">Alineación Semántica</span>
                                <span style="font-weight: 600;">${Math.round(analysis.semanticAlignment)}%</span>
                            </div>
                            <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${analysis.semanticAlignment}%; background: var(--success); border-radius: 4px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="padding: 16px; border-top: 1px solid var(--border-color); display: flex; gap: 12px; justify-content: flex-end;">
                ${analysis.score < 70 ? `<button onclick="document.getElementById('alignmentDetailsModal').remove(); regenerateWithFocus();" class="action-btn primary-btn">↻ Regenerar con Más Foco</button>` : ''}
                <button onclick="document.getElementById('alignmentDetailsModal').remove(); adjustGeneration();" class="action-btn">🎯 Ajustar Manualmente</button>
                <button onclick="document.getElementById('alignmentDetailsModal').remove();" class="action-btn">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
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
            // Auto-resize al editar
            autoResizeTextarea(textarea);
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
            // Auto-resize después de cargar contenido
            autoResizeTextarea(textarea);
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
        // Sanitizar inputs
        const safeName = projectName.replace(/[<>&"']/g, '');
        const safeCategory = (category || 'General').replace(/[<>&"']/g, '');
        const safeDescription = shortDesc.replace(/[<>&"']/g, '');
        
        const prompt = `Eres un experto en UX/UI y product management. El usuario ha proporcionado esta información básica sobre su proyecto:

NOMBRE: ${safeName}
CATEGORÍA: ${safeCategory}
DESCRIPCIÓN BREVE: ${safeDescription}

Tu tarea es expandir y refinar esta descripción breve en una descripción completa y clara que servirá como guía maestra para todo el proceso de diseño. La descripción expandida debe:

1. Clarificar el propósito central del proyecto
2. Identificar el problema específico que resuelve
3. Describir la propuesta de valor principal
4. Definir claramente qué hace y qué NO hace el producto
5. Establecer el alcance básico de funcionalidades
6. Ser concisa pero completa (2-3 párrafos, máximo 400 palabras)
7. Usar lenguaje claro y profesional
8. Mantener fidelidad absoluta a la intención original del usuario

IMPORTANTE - REGLAS DE NO DESVIACIÓN:
- NO inventes funcionalidades que el usuario no mencionó
- NO expandas el alcance más allá de lo que el usuario describió
- NO agregues features "nice to have" que no estén implícitas
- SI el usuario fue vago, haz suposiciones razonables basadas SOLO en la categoría
- Enfócate en clarificar y estructurar, no en agregar features
- Mantén el enfoque específico del proyecto, no lo generalices
- Cada punto que menciones debe poder trazarse a la descripción original

Esta descripción expandida será usada como ANCLA para todas las generaciones posteriores (flujos, pantallas, componentes). Si te desvías aquí, todo el proyecto se desviará.

Responde ÚNICAMENTE con la descripción expandida, sin introducciones, sin markdown, sin explicaciones adicionales.`;

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
        fintech: { sector: 'servicios financieros', audience: 'profesionales y empresas del sector financiero', needVerb: 'gestionar operaciones' },
        healthtech: { sector: 'salud y bienestar', audience: 'usuarios preocupados por su salud', needVerb: 'monitorear indicadores' },
        edtech: { sector: 'educación', audience: 'estudiantes, educadores e instituciones', needVerb: 'facilitar el aprendizaje' },
        ecommerce: { sector: 'comercio electrónico', audience: 'comerciantes y compradores online', needVerb: 'optimizar las ventas' },
        social: { sector: 'redes sociales', audience: 'usuarios que buscan conectar y compartir', needVerb: 'facilitar la interacción' },
        productivity: { sector: 'productividad', audience: 'profesionales y equipos de trabajo', needVerb: 'optimizar el rendimiento' },
        entertainment: { sector: 'entretenimiento', audience: 'consumidores de contenido digital', needVerb: 'mejorar la experiencia' },
        travel: { sector: 'viajes y turismo', audience: 'viajeros y planificadores de viajes', needVerb: 'simplificar la planificación' },
        food: { sector: 'gastronomía y delivery', audience: 'usuarios de servicios de comida', needVerb: 'agilizar los pedidos' }
    };
    
    const catInfo = categoryInfo[category] || { sector: 'tecnología', audience: 'usuarios digitales', needVerb: 'resolver necesidades' };
    
    // Extraer conceptos clave
    const extractedData = extractConceptsFromDescription(shortDesc, projectName);
    
    // Limpiar keywords y conceptos de duplicados
    const cleanKeywords = [...new Set(extractedData.keywords.filter(k => k.length > 4))].slice(0, 5);
    const cleanConcepts = [...new Set(extractedData.concepts.map(c => c.trim().toLowerCase()))].slice(0, 4);
    const actionVerbs = [...new Set(extractedData.verbs)].slice(0, 3);
    
    // Determinar enfoque principal
    const mainConcept = cleanConcepts[0] || cleanKeywords[0] || 'la funcionalidad principal';
    const targetAudience = extractedData.audience || catInfo.audience;
    
    // Generar resumen interpretativo (sin repetir la descripción original)
    let summary = '';
    if (cleanConcepts.length >= 2) {
        const conceptPhrase = cleanConcepts.slice(0, 2).join(' y ');
        summary = `${projectName} es una solución especializada en ${conceptPhrase}, diseñada específicamente para ${targetAudience}. La plataforma integra estas capacidades en una experiencia unificada que ${catInfo.needVerb} de manera eficiente.`;
    } else if (actionVerbs.length >= 2) {
        summary = `${projectName} permite ${actionVerbs.join(', ')}, ofreciendo a ${targetAudience} una herramienta enfocada que centraliza estas operaciones en un solo lugar.`;
    } else {
        summary = `${projectName} proporciona una solución del sector ${catInfo.sector}, orientada a ${targetAudience}, con énfasis en ${mainConcept}.`;
    }
    
    // Objetivos estratégicos variados
    const objectiveTemplates = [
        { verb: 'Simplificar', prep: 'la gestión de' },
        { verb: 'Centralizar', prep: 'el control de' },
        { verb: 'Optimizar', prep: 'el flujo de' },
        { verb: 'Automatizar', prep: 'procesos de' },
        { verb: 'Facilitar', prep: 'el acceso a' }
    ];
    
    const objectives = cleanKeywords.slice(0, 3).map((kw, i) => {
        const template = objectiveTemplates[i % objectiveTemplates.length];
        return `• ${template.verb} ${template.prep} ${kw}`;
    }).join('\n') || `• Proporcionar una solución especializada para ${mainConcept}`;
    
    // Características distintivas (evitar repetir keywords literalmente)
    const featureTemplates = [
        c => `${capitalizeFirst(c)} integrado`,
        c => `Gestión avanzada de ${c}`,
        c => `${capitalizeFirst(c)} en tiempo real`,
        c => `Panel unificado de ${c}`
    ];
    
    const features = cleanConcepts.slice(0, 4).map((c, i) => {
        const template = featureTemplates[i % featureTemplates.length];
        return `• ${template(c)}`;
    }).join('\n') || cleanKeywords.slice(0, 3).map((k, i) => 
        `• ${objectiveTemplates[i % objectiveTemplates.length].verb} ${k}`
    ).join('\n');
    
    return `${summary}

ENFOQUE: ${catInfo.needVerb.charAt(0).toUpperCase() + catInfo.needVerb.slice(1)} para ${targetAudience}.

OBJETIVOS:
${objectives}

CARACTERÍSTICAS:
${features}

La aplicación está diseñada para resolver esta necesidad específica sin complejidades innecesarias, concentrándose en entregar valor directo a través de ${mainConcept}.`;
}

// Genera un resumen natural sin repeticiones
function generateNaturalSummary(extractedData, projectName, originalDesc) {
    const { keywords, concepts, verbs } = extractedData;
    
    // Eliminar duplicados y palabras muy cortas
    const uniqueKeywords = [...new Set(keywords.filter(k => k.length > 4))].slice(0, 4);
    const uniqueConcepts = [...new Set(concepts)].slice(0, 3);
    const actionVerbs = [...new Set(verbs)].slice(0, 3);
    
    // Generar resumen interpretativo basado en los conceptos extraídos
    if (uniqueConcepts.length >= 2) {
        const mainConcept = uniqueConcepts[0];
        const secondaryConcept = uniqueConcepts[1];
        return `${projectName} integra ${mainConcept} con ${secondaryConcept} en una plataforma unificada, eliminando la necesidad de alternar entre múltiples herramientas y simplificando el flujo de trabajo.`;
    } else if (uniqueKeywords.length >= 3 && actionVerbs.length >= 1) {
        const keywordPhrase = uniqueKeywords.slice(0, 2).join(' y ');
        return `${projectName} permite ${actionVerbs[0]} ${keywordPhrase}, centralizando operaciones que tradicionalmente requerirían diferentes sistemas. La plataforma optimiza ${uniqueKeywords[2]} a través de una interfaz cohesiva.`;
    } else if (actionVerbs.length >= 2) {
        return `La herramienta permite ${actionVerbs.join(', ')}, proporcionando un entorno integrado que elimina fricciones entre procesos y mejora la eficiencia operativa.`;
    } else if (uniqueConcepts.length >= 1) {
        return `${projectName} se especializa en ${uniqueConcepts[0]}, ofreciendo capacidades diseñadas específicamente para este propósito en lugar de adaptaciones de soluciones genéricas.`;
    }
    
    return `${projectName} proporciona una solución especializada que aborda necesidades específicas de manera más efectiva que las alternativas multipropósito.`;
}

// Genera una propuesta de valor más elaborada
function generateValueProposition(extractedData, projectName, catInfo) {
    const { keywords, concepts } = extractedData;
    
    const mainFeature = concepts[0] || keywords[0] || 'funcionalidad principal';
    const secondaryFeature = concepts[1] || keywords[1] || 'características adicionales';
    
    const differentiators = [
        `enfoque especializado en ${mainFeature}`,
        `interfaz diseñada específicamente para este propósito`,
        `sin funcionalidades innecesarias que compliquen la experiencia`
    ];
    
    return `${projectName} se diferencia por su ${differentiators[0]}. A diferencia de herramientas genéricas de ${catInfo.sector}, ofrece una experiencia optimizada con ${differentiators[1]} y ${differentiators[2]}.`;
}

// Helper para capitalizar
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function extractConceptsFromDescription(description, projectName) {
    // Stopwords en español
    const stopwords = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
        'en', 'con', 'por', 'para', 'que', 'es', 'son', 'ser', 'está', 'están',
        'como', 'más', 'muy', 'pero', 'sin', 'sobre', 'entre', 'cada', 'todo',
        'todos', 'toda', 'todas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa',
        'esos', 'esas', 'aquel', 'aquella', 'y', 'o', 'ni', 'si', 'no', 'se',
        'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'lo', 'le', 'les', 'me', 'te',
        'nos', 'os', 'hay', 'ha', 'han', 'he', 'has', 'hemos', 'hacer', 'hace',
        'cuando', 'donde', 'quien', 'cual', 'cuyo', 'porque', 'aunque', 'sino',
        'mientras', 'mediante', 'según', 'hacia', 'hasta', 'desde', 'durante',
        'través', 'así', 'también', 'además', 'etc', 'permite', 'permite',
        'aplicación', 'app', 'sistema', 'plataforma', 'herramienta', 'usuario',
        'usuarios', 'poder', 'pueden', 'puede', 'manera', 'forma', 'tipo'
    ]);
    
    // Patrones de verbos de acción
    const actionVerbs = [];
    const verbPatterns = /\b(gestionar|administrar|organizar|crear|diseñar|compartir|colaborar|seguir|monitorear|analizar|automatizar|optimizar|facilitar|mejorar|conectar|sincronizar|personalizar|programar|planificar|controlar|registrar|visualizar|exportar|importar|integrar|notificar|recordar|buscar|filtrar|ordenar|agrupar|categorizar|etiquetar|archivar|recuperar|calcular|generar|enviar|recibir|publicar|editar|eliminar|duplicar|copiar|mover|asignar|delegar|priorizar|completar|iniciar|pausar|reanudar|cancelar|aprobar|rechazar|comentar|valorar|calificar|reportar|configurar|personalizar)\w*/gi;
    
    const verbMatches = description.match(verbPatterns) || [];
    verbMatches.forEach(v => actionVerbs.push(v.toLowerCase()));
    
    // Tokenizar y filtrar
    const words = description.toLowerCase()
        .replace(/[^\wáéíóúüñ\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.has(w));
    
    // Contar frecuencia
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Extraer keywords principales
    const keywords = Object.entries(frequency)
        .filter(([word, count]) => count >= 1 && word.length > 4)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word]) => word);
    
    // Extraer conceptos compuestos (bigramas y trigramas)
    const concepts = [];
    const conceptPatterns = [
        /gestión\s+de\s+\w+/gi,
        /seguimiento\s+de\s+\w+/gi,
        /control\s+de\s+\w+/gi,
        /calendario\s+\w+/gi,
        /\w+\s+interactivo/gi,
        /\w+\s+personalizado/gi,
        /panel\s+de\s+\w+/gi,
        /lista\s+de\s+\w+/gi,
        /vista\s+de\s+\w+/gi,
        /modo\s+\w+/gi,
        /tema\s+\w+/gi,
        /estilo\s+\w+/gi,
        /\w+\s+automático/gi,
        /notificaciones?\s+\w*/gi,
        /recordatorios?\s+\w*/gi,
        /equipos?\s+de\s+\w+/gi,
        /tareas?\s+\w*/gi,
        /proyectos?\s+\w*/gi,
        /archivos?\s+\w*/gi,
        /documentos?\s+\w*/gi,
        /reportes?\s+\w*/gi,
        /estadísticas?\s+\w*/gi,
        /métricas?\s+\w*/gi,
        /análisis\s+de\s+\w+/gi,
        /integración\s+con\s+\w+/gi
    ];
    
    conceptPatterns.forEach(pattern => {
        const matches = description.match(pattern);
        if (matches) {
            concepts.push(...matches.map(m => m.toLowerCase().trim()));
        }
    });
    
    // Detectar audiencia mencionada
    let audience = null;
    const audiencePatterns = [
        /para\s+(profesionales|estudiantes|empresas|equipos|familias|usuarios|personas|trabajadores|emprendedores|freelancers?|desarrolladores|diseñadores|managers?|líderes|directivos)/gi,
        /(profesionales|estudiantes|empresas|equipos|familias|trabajadores|emprendedores|freelancers?|desarrolladores|diseñadores|managers?|líderes|directivos)\s+que/gi
    ];
    
    for (const pattern of audiencePatterns) {
        const match = description.match(pattern);
        if (match) {
            audience = match[0].replace(/para\s+/i, '').replace(/\s+que/i, '');
            break;
        }
    }
    
    // Detectar necesidades mencionadas
    let needs = null;
    const needsPatterns = [
        /necesitan?\s+(.+?)(?:\.|,|$)/gi,
        /buscan?\s+(.+?)(?:\.|,|$)/gi,
        /requieren?\s+(.+?)(?:\.|,|$)/gi
    ];
    
    for (const pattern of needsPatterns) {
        const match = description.match(pattern);
        if (match && match[1]) {
            needs = match[1].substring(0, 100);
            break;
        }
    }
    
    // No generar summary aquí - se genera mejor en generateNaturalSummary()
    let summary = '';
    
    // Detectar propuesta de valor
    let valueProposition = null;
    if (concepts.length > 0) {
        valueProposition = concepts.slice(0, 2).join(' y ');
    } else if (keywords.length > 2) {
        valueProposition = `${keywords[0]} y ${keywords[1]}`;
    }
    
    return {
        keywords: [...new Set(keywords)],
        verbs: [...new Set(actionVerbs)],
        concepts: [...new Set(concepts)],
        audience,
        needs,
        summary,
        valueProposition
    };
}

function generateObjectivesFromKeywords(keywords, verbs) {
    const objectives = [];
    const usedTemplates = new Set();
    
    // Plantillas variadas para objetivos (evitar repetición)
    const verbToObjective = {
        'gestionar': ['Simplificar la gestión de', 'Centralizar el control de', 'Optimizar el manejo de'],
        'organizar': ['Estructurar de forma clara', 'Ordenar eficientemente', 'Clasificar y priorizar'],
        'crear': ['Facilitar la creación de', 'Agilizar el diseño de', 'Permitir generar'],
        'compartir': ['Habilitar el intercambio de', 'Facilitar la distribución de', 'Permitir compartir'],
        'colaborar': ['Potenciar el trabajo en equipo en', 'Fomentar la colaboración sobre', 'Integrar aportes en'],
        'seguir': ['Mantener visibilidad sobre', 'Monitorear el estado de', 'Rastrear el progreso de'],
        'monitorear': ['Supervisar en tiempo real', 'Observar continuamente', 'Controlar el estado de'],
        'analizar': ['Obtener insights sobre', 'Examinar patrones en', 'Evaluar métricas de'],
        'automatizar': ['Reducir tareas manuales en', 'Agilizar procesos de', 'Programar acciones para'],
        'planificar': ['Organizar con anticipación', 'Programar eficazmente', 'Estructurar el plan de'],
        'visualizar': ['Mostrar de forma clara', 'Presentar visualmente', 'Graficar información de']
    };
    
    // Generar objetivos basados en verbos encontrados
    verbs.slice(0, 3).forEach((verb, idx) => {
        const baseVerb = verb.replace(/r$|ar$|er$|ir$|ando$|endo$|iendo$/, '');
        for (const [key, templates] of Object.entries(verbToObjective)) {
            if (key.startsWith(baseVerb) || baseVerb.startsWith(key.substring(0, 4))) {
                const template = templates[idx % templates.length];
                if (!usedTemplates.has(template)) {
                    const keyword = keywords[objectives.length] || 'los recursos';
                    objectives.push(`• ${template} ${keyword}`);
                    usedTemplates.add(template);
                }
                break;
            }
        }
    });
    
    // Completar con objetivos basados en keywords (sin usar "Proporcionar gestión eficiente de")
    if (objectives.length < 3 && keywords.length > 0) {
        const keywordTemplates = [
            (kw) => `• Ofrecer herramientas especializadas para ${kw}`,
            (kw) => `• Centralizar todo lo relacionado con ${kw}`,
            (kw) => `• Simplificar el acceso a ${kw}`,
            (kw) => `• Mejorar la experiencia de ${kw}`
        ];
        keywords.slice(0, 4 - objectives.length).forEach((keyword, idx) => {
            objectives.push(keywordTemplates[idx % keywordTemplates.length](keyword));
        });
    }
    
    // Objetivos por defecto más variados
    const defaultObjectives = [
        '• Ofrecer una experiencia intuitiva desde el primer uso',
        '• Reducir el tiempo necesario para completar tareas',
        '• Mantener la información sincronizada y segura'
    ];
    
    while (objectives.length < 3) {
        objectives.push(defaultObjectives[objectives.length]);
    }
    
    return objectives.slice(0, 4).join('\n');
}

function generateProblemsFromKeywords(keywords, sector) {
    const problems = [];
    const usedPatterns = new Set();
    
    // Plantillas variadas para problemas
    const problemPatterns = [
        (kw) => `Complejidad al manejar ${kw} con herramientas genéricas`,
        (kw) => `Pérdida de tiempo buscando información sobre ${kw}`,
        (kw) => `Dificultad para mantener ${kw} actualizado y organizado`,
        (kw) => `Falta de visibilidad centralizada sobre ${kw}`,
        (kw) => `Procesos manuales ineficientes relacionados con ${kw}`
    ];
    
    // Generar problemas únicos basados en keywords
    keywords.slice(0, 3).forEach((keyword, idx) => {
        const pattern = problemPatterns[idx % problemPatterns.length];
        const problem = pattern(keyword);
        if (!usedPatterns.has(problem)) {
            problems.push(`• ${problem}`);
            usedPatterns.add(problem);
        }
    });
    
    // Agregar problema contextual del sector
    if (problems.length < 4) {
        problems.push(`• Las soluciones actuales de ${sector} no se adaptan a este caso específico`);
    }
    
    return problems.slice(0, 4).join('\n');
}

function generateFeaturesFromKeywords(keywords, concepts) {
    const features = [];
    const usedFeatures = new Set();
    
    // Priorizar conceptos compuestos como features (capitalizar bien)
    concepts.slice(0, 4).forEach(concept => {
        const cleanConcept = concept.trim();
        const capitalizedConcept = cleanConcept.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        if (!usedFeatures.has(capitalizedConcept.toLowerCase())) {
            features.push(`• ${capitalizedConcept}`);
            usedFeatures.add(capitalizedConcept.toLowerCase());
        }
    });
    
    // Agregar features basados en keywords con plantillas variadas
    if (features.length < 5) {
        const featureTemplates = [
            (kw) => `Panel de ${kw}`,
            (kw) => `Vista detallada de ${kw}`,
            (kw) => `Filtros y búsqueda de ${kw}`,
            (kw) => `Configuración de ${kw}`,
            (kw) => `Historial de ${kw}`
        ];
        
        keywords.slice(0, 5 - features.length).forEach((keyword, idx) => {
            const feature = featureTemplates[idx % featureTemplates.length](keyword);
            if (!usedFeatures.has(feature.toLowerCase())) {
                features.push(`• ${feature}`);
                usedFeatures.add(feature.toLowerCase());
            }
        });
    }
    
    // Features por defecto más específicos
    const defaultFeatures = [
        '• Interfaz adaptativa para móvil y escritorio',
        '• Sincronización automática en la nube',
        '• Sistema de notificaciones configurable',
        '• Exportación en múltiples formatos'
    ];
    
    while (features.length < 4) {
        const feature = defaultFeatures[features.length];
        if (!usedFeatures.has(feature.toLowerCase())) {
            features.push(feature);
        }
    }
    
    return features.slice(0, 5).join('\n');
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
    
    // Extraer información de la descripción
    const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 10);
    const mainIdea = sentences[0].trim();
    const cleanMainIdea = mainIdea.charAt(0).toLowerCase() + mainIdea.slice(1);
    
    // Analizar contexto para mejor redacción
    let appType = 'aplicación';
    if (hasKeyword('plataforma')) appType = 'plataforma';
    else if (hasKeyword('herramienta')) appType = 'herramienta';
    else if (hasKeyword('sistema')) appType = 'sistema';
    else if (hasKeyword('servicio')) appType = 'servicio';
    
    let qualifier = '';
    if (hasKeyword('interactiv')) qualifier = 'interactiva ';
    else if (hasKeyword('innovador')) qualifier = 'innovadora ';
    else if (hasKeyword('modern')) qualifier = 'moderna ';
    else if (hasKeyword('intelig')) qualifier = 'inteligente ';
    
    let focus = '';
    if (hasKeyword('equipo') || hasKeyword('colabora')) focus = ' enfocada en el trabajo colaborativo';
    else if (hasKeyword('personal')) focus = ' para uso personal';
    else if (hasKeyword('empresa') || hasKeyword('organización')) focus = ' orientada a organizaciones';
    else if (hasKeyword('comunidad')) focus = ' diseñada para comunidades';
    
    // Generar whatIs sin repetir la descripción completa
    const interpretedDesc = sentences.length > 1 ? sentences.slice(1).join('. ').trim() : '';
    const contextPhrase = interpretedDesc ? `\n\n${interpretedDesc}.` : '';
    
    const whatIs = `${name} es una ${appType} ${qualifier}de ${catData.categoryName}${focus}, especializada en ${cleanMainIdea}.${contextPhrase}

La solución proporciona las capacidades específicas necesarias para este caso de uso, priorizando efectividad sobre complejidad innecesaria.`;

    // Generate targetAudience más natural y específico
    let audienceType = catData.targetAudience;
    let audienceContext = '';
    
    if (hasKeyword('profesional')) {
        audienceType = 'profesionales del sector';
        audienceContext = 'que necesitan eficiencia en sus tareas diarias';
    } else if (hasKeyword('estudiante')) {
        audienceType = 'estudiantes y personas en formación';
        audienceContext = 'que buscan mejorar su proceso de aprendizaje';
    } else if (hasKeyword('equipo') || hasKeyword('colabora')) {
        audienceType = 'equipos de trabajo';
        audienceContext = 'que requieren coordinación efectiva';
    } else if (hasKeyword('empresa')) {
        audienceType = 'organizaciones y empresas';
        audienceContext = 'que buscan optimizar sus operaciones';
    } else {
        audienceContext = 'que valoran soluciones especializadas';
    }
    
    const targetAudience = `${name} está diseñada para ${audienceType} ${audienceContext}.

El perfil de usuario ideal busca una herramienta que resuelva su problema específico de manera directa, sin funcionalidades superfluas que compliquen la experiencia. Priorizan efectividad y facilidad de uso sobre opciones genéricas con múltiples propósitos.`;

    // Generate needsSolved más conciso y estructurado
    const need1 = `${capitalizeFirst(cleanMainIdea)}: Resolver la necesidad principal identificada`;
    const need2 = `${catData.needsBase[0]}: Fundamental para el contexto de ${catData.categoryName}`;
    const need3 = `${catData.needsBase[1]}: Complementa y refuerza la propuesta principal`;
    
    const needsSolved = `${name} aborda tres aspectos clave:

1. ${need1}

2. ${need2}

3. ${need3}

La filosofía de diseño se centra en resolver un problema específico de manera excepcional, en lugar de intentar abarcar múltiples casos de uso con resultados mediocres.`;

    // Generate differentiators con mayor especificidad
    const differentiators = `${name} se diferencia de alternativas genéricas mediante:

1. Especialización: Arquitectura diseñada exclusivamente para ${cleanMainIdea}, permitiendo optimizaciones que las soluciones multipropósito no pueden ofrecer.

2. Diseño Centrado en el Usuario: Cada elemento de la interfaz está calibrado para facilitar el flujo de trabajo específico, eliminando opciones que generarían confusión.

3. Eficiencia por Simplificación: La ausencia deliberada de funcionalidades tangenciales reduce la curva de aprendizaje y mejora el rendimiento.

4. Contexto de Uso Optimizado: Las decisiones de diseño responden directamente a las necesidades de ${catData.categoryName}, no a patrones genéricos de UI/UX.`;

    // Generate elevatorPitch con mayor impacto
    const elevatorPitch = `${name} existe para resolver un problema concreto: ${cleanMainIdea}. A diferencia de las plataformas genéricas de ${catData.categoryName} que intentan satisfacer múltiples necesidades con resultados mediocres, ${name} se especializa en este caso de uso específico. Esta especialización se traduce en una experiencia más fluida, una curva de aprendizaje reducida y resultados superiores. Para usuarios que priorizan efectividad sobre versatilidad, ${name} representa la solución óptima.`;

    // Generate appType
    const appTypeResult = generateAppType(category, description);
    
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
        appType: appTypeResult,
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

// ====================
// SCREEN ARCHITECTURE CLASS
// ====================
class ScreenArchitecture {
    static analyzeScreenStructure(appType = '', category = '', projectName = '') {
        const isMobile = appType.toLowerCase().includes('mobile');
        const isWeb = appType.toLowerCase().includes('web') || !isMobile;
        
        return {
            generalRules: this.defineGeneralRules(category, projectName),
            globalElements: this.defineGlobalElements(isMobile, isWeb),
            screenTypes: this.defineScreenTypes(),
            layoutPatterns: this.defineLayoutPatterns(isMobile, isWeb, category),
            navigationFlow: this.defineNavigationFlow(isMobile, isWeb),
            consistencyRules: this.defineConsistencyRules(isMobile, isWeb)
        };
    }
    
    static defineGeneralRules(category, projectName = '') {
        // Generar nombre formateado para branding
        const name = projectName || 'NombreApp';
        const nameLower = name.toLowerCase().replace(/\s+/g, '');
        const nameShort = name.length > 10 ? name.substring(0, 10) : name;
        
        // Generar tagline dinámico según categoría
        const categoryTaglines = {
            fintech: 'Tu aliado financiero',
            healthtech: 'Tu salud, nuestra prioridad',
            edtech: 'Aprende sin límites',
            ecommerce: 'Compra fácil y seguro',
            social: 'Conecta con tu mundo',
            productivity: 'Trabaja más inteligente',
            entertainment: 'Tu entretenimiento, a tu manera',
            travel: 'Viaja como siempre soñaste',
            food: 'Tu comida favorita, más cerca',
            other: 'La solución que necesitas'
        };
        const tagline = categoryTaglines[category] || categoryTaglines.other;
        
        return {
            language: {
                critical: '⚠️ REGLA CRÍTICA: TODO el contenido generado DEBE estar 100% en ESPAÑOL. PROHIBIDO mezclar inglés con español.',
                primary: 'Español (es-ES) - OBLIGATORIO',
                fallback: 'NO usar inglés en ninguna pantalla principal',
                prohibited: [
                    '❌ NUNCA usar "Home" → ✅ Usar "Inicio"',
                    '❌ NUNCA usar "Profile" → ✅ Usar "Perfil"',
                    '❌ NUNCA usar "Settings" → ✅ Usar "Configuración"',
                    '❌ NUNCA usar "Search" → ✅ Usar "Buscar"',
                    '❌ NUNCA usar "Login" → ✅ Usar "Iniciar Sesión"',
                    '❌ NUNCA usar "Sign Up" → ✅ Usar "Registrarse"',
                    '❌ NUNCA usar "Dashboard" → ✅ Usar "Panel" o "Tablero"',
                    '❌ NUNCA mezclar: "Buscar products" → ✅ "Buscar productos"',
                    '❌ NUNCA mezclar: "Settings de cuenta" → ✅ "Configuración de cuenta"'
                ],
                rules: [
                    '🔴 CRÍTICO: TODO el texto visible debe estar en español sin excepciones',
                    'Botones: "Guardar", "Cancelar", "Aceptar", "Siguiente", "Anterior"',
                    'Navegación: "Inicio", "Buscar", "Perfil", "Configuración", "Notificaciones"',
                    'Formularios: "Nombre", "Email", "Contraseña", "Teléfono", "Dirección"',
                    'Mensajes de error y validación en español',
                    'Textos de ayuda, tooltips y placeholders en español',
                    'Notificaciones push en español',
                    'Emails transaccionales en español',
                    'Confirmaciones y alertas en español',
                    'Formateo de fechas: dd/mm/yyyy',
                    'Formateo de números: 1.234,56 (coma decimal)',
                    'Moneda: $ (pesos) o especificar según región'
                ],
                validation: {
                    check: 'Antes de finalizar, verificar que NO haya ninguna palabra en inglés en textos UI',
                    exception: 'Solo permitido inglés en: nombres de marcas, nombres propios, términos técnicos sin traducción'
                },
                localization: {
                    dateFormat: 'dd/MM/yyyy',
                    timeFormat: 'HH:mm (24 horas)',
                    numberFormat: '1.234,56',
                    currency: 'ARS, MXN, COP según región',
                    rtl: false
                }
            },
            branding: {
                naming: {
                    rule: `Nombre comercial "${name}" consistente en toda la aplicación`,
                    locations: [
                        `Splash screen: Logo de ${name} + nombre completo`,
                        `App bar/Header: Logo de ${name} o "${nameShort}"`,
                        `Login/Registro: "${name}" completo con tagline`,
                        `Emails: "${name}" en header y firma`,
                        `Notificaciones: "${name}" como remitente`,
                        'App stores: Nombre idéntico',
                        `Redes sociales: "${name}" y @${nameLower} consistentes`
                    ],
                    formats: {
                        full: `${name}™`,
                        short: nameShort,
                        tagline: `${name} - ${tagline}`,
                        domain: `${nameLower}.com`,
                        handle: `@${nameLower}`
                    }
                },
                languageReminder: `⚠️ RECORDATORIO: Todo el contenido de ${name} debe estar 100% en ESPAÑOL. NO usar palabras en inglés en botones, menús, títulos o descripciones.`,
                icon: {
                    rule: `Ícono CONSISTENTE de ${name} en toda la aplicación`,
                    description: `El logo/ícono de ${name} debe ser EXACTAMENTE EL MISMO en todas las pantallas. NO cambiar el diseño, símbolos o colores entre pantallas.`,
                    usage: [
                        `App icon: Logo completo de ${name}`,
                        `Favicon: Logo de ${name} simplificado 16x16, 32x32`,
                        `PWA icons: Logo de ${name} 192x192, 512x512`,
                        `Touch icons: Logo de ${name} 180x180 (iOS)`,
                        `Splash screen: Logo de ${name} (versión animada o estática)`,
                        `Notificaciones: Logo de ${name} pequeño (24x24dp Android)`,
                        `Header/App bar: Logo de ${name} 32-40px height`,
                        `Loading states: Logo de ${name} animado`,
                        `Empty states: Logo de ${name} en gris claro`,
                        `Emails: Logo de ${name} en header`
                    ],
                    consistency: {
                        critical: `IMPORTANTE: Usar SIEMPRE el mismo logo de ${name}. NO crear logos diferentes para cada pantalla.`,
                        sameEverywhere: `El logo debe ser idéntico en: Splash, Headers, Login, Perfil, Notificaciones, Emails, App stores`,
                        onlyScales: `El logo sólo cambia de TAMAÑO, NUNCA de diseño o colores`
                    },
                    specifications: {
                        style: 'Moderno, minimalista, memorable',
                        colors: 'Máximo 3 colores principales - SIEMPRE LOS MISMOS',
                        contrast: 'Funciona en fondos claros y oscuros',
                        scalability: 'Legible desde 16x16 hasta 512x512',
                        uniqueness: `Distintivo de ${name}, evita símbolos genéricos`
                    },
                    placement: {
                        center: `Logo de ${name} en splash, login, empty states`,
                        left: `Logo de ${name} en headers/app bars`,
                        inline: `Logo de ${name} en textos como marca registrada™`
                    }
                },
                colorScheme: {
                    rule: 'Paleta de colores corporativa consistente',
                    application: [
                        'Logo: Colores oficiales de marca',
                        'Botones primarios: Color de marca',
                        'Links: Color de marca o variante',
                        'Splash: Background con colores de marca',
                        'Theme: Modo claro/oscuro con marca'
                    ]
                }
            },
            seo: {
                rule: 'Todas las pantallas y contenidos optimizados para SEO',
                general: [
                    'Títulos descriptivos únicos por pantalla (50-60 caracteres)',
                    'Meta descriptions relevantes (150-160 caracteres)',
                    'URLs amigables: /producto/nombre-producto (no /prod?id=123)',
                    'Estructura de headings: H1 único, H2-H6 jerárquicos',
                    'Imágenes con alt text descriptivo',
                    'Links internos con anchor text relevante',
                    'Breadcrumbs para navegación y contexto',
                    'Schema markup (JSON-LD) para contenido estructurado'
                ],
                contentRules: [
                    'H1: Título principal único por página (incluir keyword principal)',
                    'H2: Secciones principales (incluir variaciones de keywords)',
                    'H3-H6: Subsecciones en orden jerárquico',
                    'Párrafos: 150-300 palabras, legibles, con keywords naturales',
                    'Negritas: Para términos importantes y keywords secundarias',
                    'Links: Texto descriptivo (no "click aquí"), 2-5 por página',
                    'Listas: Usar <ul> y <ol> para mejorar escaneabilidad',
                    'Imágenes: Alt text descriptivo con keywords cuando aplique'
                ],
                technical: [
                    'Title tag: <title>Keyword Principal - Nombre App</title>',
                    'Meta description: <meta name="description" content="Descripción con CTA">',
                    'Canonical URL: <link rel="canonical" href="URL_oficial">',
                    'Open Graph: og:title, og:description, og:image para redes',
                    'Twitter Cards: twitter:card, twitter:title, twitter:image',
                    'Robots meta: <meta name="robots" content="index, follow">',
                    'Hreflang: <link rel="alternate" hreflang="es" href="...">',
                    'Sitemap XML: Actualizado con todas las URLs',
                    'Robots.txt: Permitir crawling de contenido público'
                ],
                performance: [
                    'Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1',
                    'Mobile-first: Responsive design optimizado',
                    'Lazy loading: Imágenes y contenido below-the-fold',
                    'Compresión: Gzip/Brotli para HTML, CSS, JS',
                    'Caché: Headers apropiados para recursos estáticos',
                    'CDN: Servir assets desde CDN',
                    'Minificación: CSS y JS minificados',
                    'Critical CSS: Inline CSS crítico en <head>'
                ],
                accessibility: [
                    'HTML semántico: <header>, <nav>, <main>, <article>, <footer>',
                    'ARIA labels: Complementar HTML cuando sea necesario',
                    'Skip links: Para navegación por teclado',
                    'Focus visible: Indicadores claros de foco',
                    'Contraste: WCAG AA mínimo (4.5:1)',
                    'Texto escalable: No usar px fijos, usar rem/em',
                    'Formularios: Labels asociados con inputs',
                    'Tablas: Uso correcto de <th>, <caption>, scope'
                ]
            },
            contentGuidelines: {
                tone: {
                    rule: 'Tono consistente en toda la aplicación',
                    characteristics: [
                        'Claro y directo',
                        'Profesional pero accesible',
                        'Evitar jerga técnica innecesaria',
                        'Usar "tú" o "usted" consistentemente',
                        'Positivo y orientado a soluciones',
                        'Empático con el usuario'
                    ]
                },
                copywriting: {
                    buttons: [
                        'Verbos de acción: "Crear cuenta", "Comenzar ahora", "Ver más"',
                        'Claro sobre la acción: No usar "OK" o "Continuar" genéricos',
                        'Contextual: "Guardar cambios", "Publicar artículo"'
                    ],
                    errors: [
                        'Explicar qué salió mal',
                        'Indicar cómo solucionarlo',
                        'Tono empático: "No pudimos... Intenta..."',
                        'Evitar culpar al usuario'
                    ],
                    emptyStates: [
                        'Explicar por qué está vacío',
                        'Sugerir acción siguiente',
                        'Tono alentador',
                        'CTA claro'
                    ],
                    success: [
                        'Confirmar acción completada',
                        'Indicar siguiente paso si aplica',
                        'Tono positivo'
                    ]
                },
                microcopy: {
                    placeholders: 'Ejemplos claros: "nombre@ejemplo.com"',
                    helperText: 'Guiar sin abrumar: "Mínimo 8 caracteres"',
                    tooltips: 'Información adicional concisa',
                    labels: 'Descriptivos y cortos: "Correo electrónico"'
                }
            }
        };
    }
    
    static defineGlobalElements(isMobile, isWeb) {
        return {
            persistent: {
                header: {
                    present: true,
                    excludeFrom: ['splash', 'onboarding', 'auth_screens'],
                    content: ['brand_logo', 'primary_navigation', 'user_menu', 'notifications'],
                    variants: {
                        mobile: {
                            height: '56px',
                            layout: 'compact',
                            elements: ['hamburger_menu', 'logo', 'search_icon', 'profile_icon']
                        },
                        web: {
                            height: '64-72px',
                            layout: 'expanded',
                            elements: ['logo', 'main_nav', 'search_bar', 'notifications', 'user_dropdown']
                        }
                    }
                },
                footer: {
                    present: isWeb,
                    excludeFrom: ['splash', 'onboarding', 'modal_views', 'detail_views'],
                    content: ['links', 'legal', 'social_media', 'contact'],
                    note: 'En mobile se reemplaza por Bottom Navigation'
                },
                bottomNav: {
                    present: isMobile,
                    excludeFrom: ['splash', 'onboarding', 'auth_screens', 'fullscreen_views'],
                    content: ['4-5 primary navigation items'],
                    positions: ['home', 'search/explore', 'main_action', 'profile', 'more'],
                    height: '56px',
                    behavior: 'fixed_bottom'
                },
                sidebar: {
                    present: isWeb,
                    type: 'conditional',
                    showOn: ['dashboard', 'settings', 'admin', 'content_management'],
                    excludeFrom: ['landing', 'auth', 'checkout', 'focused_tasks'],
                    width: '240-280px',
                    collapsible: true
                }
            },
            contextual: {
                breadcrumbs: {
                    present: isWeb,
                    showOn: ['deep_navigation', 'hierarchical_content'],
                    placement: 'below_header'
                },
                backButton: {
                    present: isMobile,
                    showOn: ['detail_views', 'sub_pages', 'forms'],
                    behavior: 'native_navigation'
                },
                fab: {
                    present: 'conditional',
                    showOn: ['list_views', 'dashboard'],
                    action: 'primary_creation_action',
                    position: 'bottom_right',
                    size: isMobile ? '56px' : '64px'
                }
            }
        };
    }
    
    static defineScreenTypes() {
        return {
            fullscreen: {
                types: ['splash', 'onboarding', 'media_viewer', 'video_player'],
                characteristics: 'Sin header, footer, ni navegación visible',
                purpose: 'Inmersión total o primera impresión'
            },
            authScreens: {
                types: ['login', 'register', 'forgot_password', 'verification'],
                characteristics: 'Solo logo/brand, sin navegación principal',
                purpose: 'Enfoque total en autenticación'
            },
            mainScreens: {
                types: ['home', 'dashboard', 'feed', 'explore'],
                characteristics: 'Header + Bottom Nav (mobile) o Header + Sidebar (web)',
                purpose: 'Navegación completa disponible'
            },
            detailScreens: {
                types: ['item_detail', 'profile_view', 'article'],
                characteristics: 'Header con back + contenido enfocado',
                purpose: 'Información detallada de un elemento'
            },
            formScreens: {
                types: ['create', 'edit', 'settings', 'checkout'],
                characteristics: 'Header + barra de progreso + acciones de guardado',
                purpose: 'Captura o edición de datos'
            },
            modalScreens: {
                types: ['overlays', 'bottom_sheets', 'dialogs'],
                characteristics: 'Sobre contenido existente, con backdrop',
                purpose: 'Acciones rápidas sin cambiar contexto'
            }
        };
    }
    
    static defineLayoutPatterns(isMobile, isWeb, category) {
        return {
            mobile: {
                list: {
                    pattern: 'Single column vertical scroll',
                    spacing: '8-16px entre items',
                    cardHeight: 'Variable según contenido',
                    useFor: ['feeds', 'listas', 'resultados']
                },
                grid: {
                    pattern: '2-3 columns',
                    spacing: '8-12px gap',
                    aspectRatio: '1:1 o 4:3',
                    useFor: ['gallery', 'productos', 'categorías']
                },
                tabs: {
                    pattern: 'Horizontal scrollable tabs',
                    placement: 'Below header',
                    behavior: 'Swipeable content',
                    useFor: ['categorización', 'filtros', 'secciones']
                }
            },
            web: {
                sidebar_content: {
                    pattern: 'Sidebar (240-280px) + Main content (flex-1)',
                    sidebar: 'Fixed o sticky',
                    content: 'Scrollable independently',
                    useFor: ['dashboards', 'admin', 'settings']
                },
                grid_responsive: {
                    pattern: 'CSS Grid con auto-fit',
                    columns: '3-4 en desktop, 2 en tablet, 1 en mobile',
                    gap: '24-32px',
                    useFor: ['catálogos', 'portfolios', 'cards']
                },
                split_view: {
                    pattern: 'Master-detail (40/60 o 50/50)',
                    behavior: 'List + Detail side by side',
                    responsive: 'Stack en mobile',
                    useFor: ['email', 'messaging', 'file_browser']
                }
            }
        };
    }
    
    static defineNavigationFlow(isMobile, isWeb) {
        return {
            hierarchy: {
                level_1: {
                    screens: ['Home', 'Main categories', 'Primary features'],
                    access: isMobile ? 'Bottom navigation' : 'Top navigation bar',
                    maxItems: isMobile ? '5' : '6-8'
                },
                level_2: {
                    screens: ['Sub-categories', 'Filtered views', 'Feature details'],
                    access: isMobile ? 'In-screen navigation' : 'Dropdown menus o sidebar',
                    maxDepth: '2-3 levels recommended'
                },
                level_3: {
                    screens: ['Item details', 'Edit forms', 'Specific content'],
                    access: 'Direct links from level 2',
                    backBehavior: 'Return to previous level'
                }
            },
            patterns: {
                stack_navigation: {
                    platform: 'Mobile primary',
                    behavior: 'Push/Pop screen stack',
                    animation: 'Slide from right',
                    backButton: 'Always visible in header'
                },
                tab_navigation: {
                    platform: 'Both',
                    behavior: 'Switch between parallel sections',
                    persistence: 'Maintain state per tab',
                    indication: 'Active tab highlighted'
                },
                modal_navigation: {
                    platform: 'Both',
                    behavior: 'Temporary overlay',
                    dismiss: 'X button, backdrop click, swipe down (mobile)',
                    useCase: 'Forms, confirmations, quick actions'
                }
            }
        };
    }
    
    static defineConsistencyRules(isMobile, isWeb) {
        return {
            spacing: {
                rule: 'Sistema de espaciado consistente (8px base)',
                scale: '4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px',
                application: 'Margins, paddings, gaps',
                exception: 'Ajustes finos de 1-2px para alineación visual'
            },
            typography: {
                rule: 'Jerarquía tipográfica consistente',
                levels: {
                    h1: 'Títulos principales de página',
                    h2: 'Secciones principales',
                    h3: 'Subsecciones',
                    body: 'Contenido regular',
                    caption: 'Texto secundario, metadatos'
                },
                consistency: 'Mismo nivel = mismo tamaño en toda la app'
            },
            colors: {
                rule: 'Uso semántico consistente',
                mapping: {
                    primary: 'CTAs principales, links, elementos interactivos',
                    secondary: 'Acciones secundarias',
                    success: 'Confirmaciones, estados positivos',
                    error: 'Errores, alertas, acciones destructivas',
                    warning: 'Advertencias, estados de atención',
                    info: 'Información neutral, tips'
                }
            },
            components: {
                rule: 'Componentes reutilizables con variantes',
                principle: 'Misma función = mismo componente en toda la app',
                example: 'Todos los botones primarios usan el mismo estilo',
                variants: 'size (sm, md, lg), state (default, hover, active, disabled)'
            },
            animations: {
                rule: 'Transiciones consistentes',
                duration: {
                    instant: '<100ms (feedback inmediato)',
                    quick: '100-200ms (micro-interactions)',
                    normal: '200-300ms (transiciones estándar)',
                    slow: '300-500ms (animaciones complejas)'
                },
                easing: 'ease-out para entrada, ease-in para salida',
                principle: 'Misma acción = misma animación'
            },
            states: {
                rule: 'Estados visuales consistentes para elementos interactivos',
                required: ['default', 'hover', 'active/pressed', 'focused', 'disabled'],
                loading: 'Skeleton o spinner según contexto',
                error: 'Mensajes claros con acciones de recuperación'
            }
        };
    }
    
    static enrichScreenData(screen, screenIndex, totalScreens, architecture) {
        const screenType = this.determineScreenType(screen.screen);
        const globalElements = this.getApplicableGlobalElements(screenType, architecture.globalElements);
        const layoutPattern = this.suggestLayoutPattern(screen, architecture.layoutPatterns);
        
        return {
            ...screen,
            position: `${screenIndex + 1}/${totalScreens}`,
            screenType: screenType,
            navigation: {
                level: this.determineNavigationLevel(screenIndex),
                accessFrom: this.determineAccessPoint(screen.screen, screenIndex),
                backBehavior: screenIndex > 0 ? 'Return to previous screen' : 'N/A'
            },
            layout: {
                pattern: layoutPattern.pattern,
                recommendation: layoutPattern.recommendation,
                responsiveBehavior: layoutPattern.responsive
            },
            globalElements: {
                header: globalElements.header,
                footer: globalElements.footer,
                bottomNav: globalElements.bottomNav,
                sidebar: globalElements.sidebar,
                note: globalElements.note
            },
            interactions: this.defineInteractions(screen),
            stateManagement: this.defineStateManagement(screen),
            accessibilityNotes: this.generateA11yNotes(screen)
        };
    }
    
    static determineScreenType(screenName) {
        const name = screenName.toLowerCase();
        if (name.includes('splash') || name.includes('loading')) return 'fullscreen';
        if (name.includes('onboarding')) return 'fullscreen';
        if (name.includes('login') || name.includes('registro') || name.includes('auth')) return 'authScreens';
        if (name.includes('home') || name.includes('dashboard') || name.includes('feed')) return 'mainScreens';
        if (name.includes('detalle') || name.includes('detail') || name.includes('view') || name.includes('perfil')) return 'detailScreens';
        if (name.includes('crear') || name.includes('editar') || name.includes('settings') || name.includes('config')) return 'formScreens';
        return 'mainScreens';
    }
    
    static getApplicableGlobalElements(screenType, globalElements) {
        const excluded = {
            fullscreen: ['header', 'footer', 'bottomNav', 'sidebar'],
            authScreens: ['bottomNav', 'sidebar'],
            mainScreens: [],
            detailScreens: ['sidebar'],
            formScreens: ['sidebar']
        };
        
        const excludeList = excluded[screenType] || [];
        
        return {
            header: !excludeList.includes('header') ? globalElements.persistent.header : null,
            footer: !excludeList.includes('footer') ? globalElements.persistent.footer : null,
            bottomNav: !excludeList.includes('bottomNav') ? globalElements.persistent.bottomNav : null,
            sidebar: !excludeList.includes('sidebar') ? globalElements.persistent.sidebar : null,
            note: excludeList.length > 0 ? `Excluye: ${excludeList.join(', ')}` : 'Todos los elementos globales aplicables'
        };
    }
    
    static determineNavigationLevel(index) {
        if (index <= 3) return 'Level 1 (Primary)';
        if (index <= 7) return 'Level 2 (Secondary)';
        return 'Level 3 (Detail)';
    }
    
    static determineAccessPoint(screenName, index) {
        const name = screenName.toLowerCase();
        if (index === 0) return 'App launch / Deep link';
        if (index === 1) return 'First-time user flow';
        if (name.includes('home') || name.includes('dashboard')) return 'Bottom navigation / Main menu';
        if (name.includes('perfil') || name.includes('profile')) return 'Bottom navigation / User menu';
        if (name.includes('búsqueda') || name.includes('search')) return 'Bottom navigation / Search icon';
        if (name.includes('notif')) return 'Notification icon / Push notification';
        return 'Navigation from previous screen / Deep link';
    }
    
    static suggestLayoutPattern(screen, layoutPatterns) {
        const name = screen.screen.toLowerCase();
        const desc = screen.description.toLowerCase();
        
        if (name.includes('dashboard') || name.includes('home')) {
            return {
                pattern: 'Mixed layout',
                recommendation: 'Hero section + Grid/List de cards',
                responsive: 'Stack vertically en mobile'
            };
        }
        
        if (name.includes('lista') || name.includes('feed') || desc.includes('lista')) {
            return {
                pattern: 'Vertical list',
                recommendation: 'Single column con infinite scroll o pagination',
                responsive: 'Mantener single column'
            };
        }
        
        if (name.includes('detalle') || name.includes('detail')) {
            return {
                pattern: 'Single column detail',
                recommendation: 'Hero image/media + Content sections + Related items',
                responsive: 'Sticky header en scroll'
            };
        }
        
        if (name.includes('settings') || name.includes('config')) {
            return {
                pattern: 'Grouped list',
                recommendation: 'Sections con headers + List items',
                responsive: 'Collapsible sections en mobile'
            };
        }
        
        return {
            pattern: 'Flexible layout',
            recommendation: 'Adaptar según contenido específico',
            responsive: 'Mobile-first approach'
        };
    }
    
    static defineInteractions(screen) {
        const interactions = [];
        
        screen.elements.forEach(element => {
            const el = element.toLowerCase();
            if (el.includes('button') || el.includes('cta') || el.includes('btn')) {
                interactions.push(`Tap/Click en ${element} -> Acción específica`);
            }
            if (el.includes('card')) {
                interactions.push(`Tap en ${element} -> Navegar a detalle`);
            }
            if (el.includes('search') || el.includes('búsqueda')) {
                interactions.push(`Focus en ${element} -> Mostrar teclado y sugerencias`);
            }
            if (el.includes('scroll')) {
                interactions.push(`Scroll -> Cargar más contenido (infinite scroll o pagination)`);
            }
        });
        
        return interactions.length > 0 ? interactions : ['Interactions basadas en elementos de la pantalla'];
    }
    
    static defineStateManagement(screen) {
        return {
            initialState: 'Loading -> Mostrar skeleton/spinner',
            successState: 'Contenido cargado y visible',
            errorState: 'Mensaje de error + Retry button',
            emptyState: 'Ilustración + Mensaje + CTA cuando no hay contenido',
            offlineState: screen.screen.includes('Splash') ? 'N/A' : 'Cached content o mensaje de sin conexión'
        };
    }
    
    static generateA11yNotes(screen) {
        return [
            'Todos los elementos interactivos deben ser accesibles por teclado',
            'Labels descriptivos en todos los inputs y botones',
            'Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande',
            'Anuncios de screen reader para cambios dinámicos',
            'Enfoque visible en navegación por teclado',
            'Tamaño mínimo de touch target: 44x44px (mobile)'
        ];
    }
}

// ====================
// DYNAMIC SCREEN NAMES
// ====================
function generateDynamicScreenNames(name, category) {
    const screenConfigs = {
        fintech: {
            home: 'Dashboard Financiero',
            search: 'Buscar Transacciones',
            detail: 'Detalle de Transacción',
            feed: 'Actividad Financiera',
            feedDescription: 'Flujo de movimientos',
            saved: 'Transacciones Guardadas',
            activity: 'Historial Financiero',
            activityType: 'transacciones',
            create: 'Nueva Transacción',
            createAction: 'crear transacciones',
            messaging: 'Asesor Financiero Chat',
            analytics: 'Analytics Financiero',
            analyticsType: 'finanzas',
            social: 'Comunidad Financiera',
            library: 'Mi Cartera',
            calendar: 'Calendario de Pagos',
            calendarType: 'pagos y vencimientos',
            admin: 'Panel Administrativo',
            adminType: 'control financiero',
            contentType: 'transacciones'
        },
        healthtech: {
            home: 'Dashboard de Salud',
            search: 'Buscar Profesionales',
            detail: 'Perfil de Doctor',
            feed: 'Feed de Salud',
            feedDescription: 'Actualizaciones de bienestar',
            saved: 'Consultas Guardadas',
            activity: 'Historial Médico',
            activityType: 'consultas',
            create: 'Agendar Cita',
            createAction: 'agendar citas',
            messaging: 'Chat Médico',
            analytics: 'Análisis de Salud',
            analyticsType: 'salud',
            social: 'Comunidad de Bienestar',
            library: 'Mis Registros Médicos',
            calendar: 'Calendario de Citas',
            calendarType: 'citas y tratamientos',
            admin: 'Panel Clínico',
            adminType: 'gestión médica',
            contentType: 'consultas'
        },
        edtech: {
            home: 'Mi Aprendizaje',
            search: 'Buscar Cursos',
            detail: 'Detalle del Curso',
            feed: 'Feed Educativo',
            feedDescription: 'Contenido de aprendizaje',
            saved: 'Cursos Guardados',
            activity: 'Progreso de Aprendizaje',
            activityType: 'estudio',
            create: 'Crear Curso',
            createAction: 'crear contenido educativo',
            messaging: 'Chat con Instructor',
            analytics: 'Progreso Académico',
            analyticsType: 'aprendizaje',
            social: 'Comunidad de Estudiantes',
            library: 'Mi Biblioteca',
            calendar: 'Calendario de Clases',
            calendarType: 'clases y exámenes',
            admin: 'Panel Educativo',
            adminType: 'gestión académica',
            contentType: 'cursos'
        },
        ecommerce: {
            home: 'Tienda Principal',
            search: 'Buscar Productos',
            detail: 'Detalle del Producto',
            feed: 'Novedades',
            feedDescription: 'Productos destacados',
            saved: 'Lista de Deseos',
            activity: 'Historial de Compras',
            activityType: 'compras',
            create: 'Vender Producto',
            createAction: 'publicar productos',
            messaging: 'Chat con Vendedor',
            analytics: 'Mis Compras',
            analyticsType: 'compras',
            social: 'Comunidad de Compradores',
            library: 'Mis Pedidos',
            calendar: 'Calendario de Entregas',
            calendarType: 'entregas y devoluciones',
            admin: 'Panel de Ventas',
            adminType: 'gestión de tienda',
            contentType: 'productos'
        },
        social: {
            home: 'Feed Principal',
            search: 'Buscar Usuarios',
            detail: 'Perfil de Usuario',
            feed: 'Timeline',
            feedDescription: 'Publicaciones recientes',
            saved: 'Posts Guardados',
            activity: 'Tu Actividad',
            activityType: 'interacciones',
            create: 'Crear Post',
            createAction: 'publicar contenido',
            messaging: 'Mensajes Directos',
            analytics: 'Insights de Perfil',
            analyticsType: 'engagement',
            social: 'Red Social',
            library: 'Tus Publicaciones',
            calendar: 'Eventos',
            calendarType: 'eventos sociales',
            admin: 'Panel de Moderación',
            adminType: 'moderación de contenido',
            contentType: 'publicaciones'
        },
        productivity: {
            home: 'Workspace',
            search: 'Buscar Tareas',
            detail: 'Detalle de Tarea',
            feed: 'Actividad del Equipo',
            feedDescription: 'Actualizaciones de trabajo',
            saved: 'Tareas Importantes',
            activity: 'Historial de Trabajo',
            activityType: 'tareas',
            create: 'Nueva Tarea',
            createAction: 'crear tareas',
            messaging: 'Chat del Equipo',
            analytics: 'Productividad',
            analyticsType: 'rendimiento',
            social: 'Equipo',
            library: 'Proyectos',
            calendar: 'Calendario de Tareas',
            calendarType: 'deadlines y reuniones',
            admin: 'Panel de Gestión',
            adminType: 'gestión de equipo',
            contentType: 'tareas'
        },
        entertainment: {
            home: 'Inicio',
            search: 'Buscar Contenido',
            detail: 'Detalle de Contenido',
            feed: 'Para Ti',
            feedDescription: 'Contenido recomendado',
            saved: 'Mi Lista',
            activity: 'Historial de Reproducción',
            activityType: 'visualización',
            create: 'Subir Contenido',
            createAction: 'subir videos',
            messaging: 'Chat con Creadores',
            analytics: 'Estadísticas de Visualización',
            analyticsType: 'consumo',
            social: 'Comunidad',
            library: 'Mi Biblioteca',
            calendar: 'Próximos Estrenos',
            calendarType: 'estrenos y eventos',
            admin: 'Panel de Creadores',
            adminType: 'gestión de contenido',
            contentType: 'videos'
        },
        travel: {
            home: 'Explorar Destinos',
            search: 'Buscar Viajes',
            detail: 'Detalle del Destino',
            feed: 'Inspiración de Viajes',
            feedDescription: 'Destinos destacados',
            saved: 'Viajes Guardados',
            activity: 'Mis Viajes',
            activityType: 'reservas',
            create: 'Planear Viaje',
            createAction: 'planear itinerarios',
            messaging: 'Chat con Guías',
            analytics: 'Historial de Viajes',
            analyticsType: 'viajes',
            social: 'Comunidad Viajera',
            library: 'Mis Reservas',
            calendar: 'Calendario de Viajes',
            calendarType: 'vuelos y reservas',
            admin: 'Panel de Reservas',
            adminType: 'gestión de bookings',
            contentType: 'destinos'
        },
        food: {
            home: 'Explorar Restaurantes',
            search: 'Buscar Comida',
            detail: 'Menú del Restaurante',
            feed: 'Destacados',
            feedDescription: 'Platos populares',
            saved: 'Favoritos',
            activity: 'Mis Pedidos',
            activityType: 'pedidos',
            create: 'Nuevo Pedido',
            createAction: 'realizar pedidos',
            messaging: 'Chat con Restaurante',
            analytics: 'Historial de Pedidos',
            analyticsType: 'consumo',
            social: 'Comunidad Foodie',
            library: 'Mis Direcciones',
            calendar: 'Reservas',
            calendarType: 'reservas y entregas',
            admin: 'Panel de Restaurante',
            adminType: 'gestión de pedidos',
            contentType: 'restaurantes'
        },
        other: {
            home: 'Dashboard Principal',
            search: 'Buscar',
            detail: 'Vista Detallada',
            feed: 'Feed de Contenido',
            feedDescription: 'Actualizaciones',
            saved: 'Guardados',
            activity: 'Actividad Reciente',
            activityType: 'acciones',
            create: 'Crear Nuevo',
            createAction: 'crear contenido',
            messaging: 'Mensajería',
            analytics: 'Analytics',
            analyticsType: 'uso',
            social: 'Comunidad',
            library: 'Mi Colección',
            calendar: 'Calendario',
            calendarType: 'eventos',
            admin: 'Panel Administrativo',
            adminType: 'administración',
            contentType: 'items'
        }
    };

    return screenConfigs[category] || screenConfigs.other;
}

// ====================
// GENERATE FLOWS (COMPLETE VERSION)
// ====================
function generateFlows(name, category, appType = '') {
    // Analizar arquitectura basada en tipo de app Y nombre del proyecto
    const architecture = ScreenArchitecture.analyzeScreenStructure(appType, category, name);
    
    // Generar nombres dinámicos según categoría
    const dynamicScreens = generateDynamicScreenNames(name, category);
    
    const languageWarning = `⚠️ IDIOMA: Todos los textos deben estar en ESPAÑOL. Ejemplos: "Iniciar Sesión" (no "Login"), "Buscar" (no "Search"), "Configuración" (no "Settings")`;
    
    const baseFlows = {
        mvp: [
            { screen: `Splash / Loading - ${name}`, description: `Pantalla inicial con logo de ${name} y carga de recursos`, elements: [`Logo de ${name} animado`, 'Progress indicator', 'Versión de app'], context: 'Primera impresión - Sin navegación visible', languageNote: languageWarning },
            { screen: `Onboarding - ${name}`, description: `Introducción al valor de ${name} en 3-4 slides`, elements: ['Ilustraciones', 'Títulos impactantes', 'Dots de progreso', 'Skip button', 'CTA final'], context: 'Educación inicial - Usuario puede saltarlo' },
            { screen: 'Login / Registro', description: 'Autenticación de usuarios', elements: ['Email input', 'Password input', 'Social login buttons', 'Forgot password link', 'Términos y condiciones'], context: 'Autenticación - Sin navegación principal' },
            { screen: `${dynamicScreens.home} - ${name}`, description: `Vista principal de ${name}`, elements: [`Header con logo de ${name}`, 'Cards de contenido', 'Quick actions', 'Bottom navigation'], context: 'Pantalla principal - Navegación completa disponible' },
            { screen: 'Perfil de Usuario', description: 'Configuración y datos del usuario', elements: ['Avatar', 'Datos personales', 'Preferencias', 'Logout button'], context: 'Gestión de cuenta - Accesible desde navegación principal' }
        ],
        intermediate: [
            { screen: `${dynamicScreens.search} - ${name}`, description: `Sistema de búsqueda de ${dynamicScreens.contentType}`, elements: ['Search bar', 'Filtros básicos', 'Resultados en lista/grid', 'Historial reciente'], context: 'Discovery - Encontrar contenido' },
            { screen: `${dynamicScreens.detail} - ${name}`, description: `Vista detallada de ${dynamicScreens.contentType}`, elements: ['Hero image', 'Información completa', 'Actions principales', 'Contenido relacionado'], context: 'Información detallada - Enfoque en un elemento' },
            { screen: `${dynamicScreens.feed} - ${name}`, description: `${dynamicScreens.feedDescription} de ${name}`, elements: ['Posts/Items en scroll', 'Refresh pull', 'Filtros de contenido', 'Infinite scroll'], context: 'Consumo de contenido - Actualización continua' },
            { screen: `Notificaciones - ${name}`, description: 'Centro de notificaciones', elements: ['Lista de notificaciones', 'Filtros por tipo', 'Mark as read', 'Settings rápidos'], context: 'Centro de actividad - Gestión de notificaciones' },
            { screen: `Configuración - ${name}`, description: 'Ajustes y preferencias', elements: ['Sections organizadas', 'Preferencias de app', 'Notificaciones', 'Privacidad', 'Cuenta'], context: 'Personalización - Ajustes del usuario' },
            { screen: `${dynamicScreens.saved} - ${name}`, description: `${dynamicScreens.contentType} guardados`, elements: ['Lista de guardados', 'Organización por categorías', 'Quick access', 'Opciones de compartir'], context: 'Contenido curado - Acceso rápido' },
            { screen: `${dynamicScreens.activity} - ${name}`, description: `Historial de ${dynamicScreens.activityType}`, elements: ['Timeline de actividad', 'Filtros temporales', 'Estadísticas básicas', 'Clear history'], context: 'Seguimiento - Registro de acciones' },
            { screen: `Ayuda / FAQ - ${name}`, description: 'Centro de soporte básico', elements: ['Preguntas frecuentes', 'Search en FAQs', 'Contact support', 'Video tutoriales'], context: 'Soporte - Ayuda al usuario' }
        ],
        complete: [
            { screen: `${dynamicScreens.search} Avanzada - ${name}`, description: `Motor de búsqueda completo de ${dynamicScreens.contentType} con IA`, elements: ['Search bar con NLP', 'Filtros avanzados', 'Voice search', 'Visual search', 'Saved searches', 'Recommendations'], context: 'Discovery avanzado - Búsqueda inteligente' },
            { screen: `${dynamicScreens.detail} Detallada - ${name}`, description: `Información completa de ${dynamicScreens.contentType} con interacciones`, elements: ['Hero media 360°', 'AR preview', 'Reviews verificados', 'Comparador', 'Share suite', 'Related content'], context: 'Detalle inmersivo - Experiencia completa' },
            { screen: `${dynamicScreens.create} - ${name}`, description: `Herramientas para ${dynamicScreens.createAction}`, elements: ['Form builder', 'Media upload', 'Rich text editor', 'Preview', 'Autosave', 'Publish/Draft', 'Collaborate'], context: 'Creación - Herramientas profesionales' },
            { screen: `${dynamicScreens.messaging} - ${name}`, description: 'Sistema de mensajería en tiempo real', elements: ['Lista de conversaciones', 'Chat interface', 'Media sharing', 'Reactions', 'Read receipts', 'Group chats', 'Search'], context: 'Comunicación - Mensajería directa' },
            { screen: `Centro de Notificaciones Pro - ${name}`, description: 'Gestión inteligente de notificaciones', elements: ['Smart grouping', 'Scheduled digest', 'Channel preferences', 'Snooze', 'Priority inbox', 'Actions rápidas'], context: 'Notificaciones avanzadas - Control total' },
            { screen: `${dynamicScreens.analytics} - ${name}`, description: `Métricas y estadísticas de ${dynamicScreens.analyticsType}`, elements: ['Usage dashboard', 'Goal tracking', 'Charts interactivos', 'Comparativas', 'Reports exportables', 'Insights AI'], context: 'Analytics - Métricas y tendencias' },
            { screen: `${dynamicScreens.social} - ${name}`, description: 'Centro de interacciones sociales', elements: ['Following/Followers', 'Activity feed', 'Grupos', 'Events', 'Sharing', 'Mentions', 'Trending'], context: 'Social - Conexión con comunidad' },
            { screen: `Configuración Avanzada - ${name}`, description: 'Panel de control completo', elements: ['Settings sections', 'Privacy center', 'Integrations', 'API keys', 'Export data', 'Account health', 'Theme customizer'], context: 'Control avanzado - Configuración total' },
            { screen: `${dynamicScreens.library} - ${name}`, description: `Organización de ${dynamicScreens.contentType}`, elements: ['Collections', 'Tags', 'Folders', 'Sort/Filter options', 'Bulk actions', 'Search in library'], context: 'Organización - Gestión de contenido' },
            { screen: `${dynamicScreens.calendar} - ${name}`, description: `Gestión de ${dynamicScreens.calendarType}`, elements: ['Calendar view', 'Event creation', 'Reminders', 'Sync options', 'Recurring events', 'Agenda view'], context: 'Planificación - Gestión temporal' },
            { screen: `Centro de Ayuda Pro - ${name}`, description: 'Soporte completo multicanal', elements: ['AI chatbot', 'FAQs dinámicas', 'Video tutorials', 'Live chat', 'Ticket system', 'Community forum', 'Knowledge base'], context: 'Soporte premium - Ayuda completa' },
            { screen: `${dynamicScreens.admin} - ${name}`, description: `Panel de ${dynamicScreens.adminType}`, elements: ['User management', 'Content moderation', 'Analytics dashboard', 'Settings globales', 'Reports', 'Permissions'], context: 'Administración - Control del sistema' },
            { screen: `Integraciones / API - ${name}`, description: 'Conexión con servicios externos', elements: ['Connected apps', 'API configuration', 'Webhooks', 'OAuth connections', 'Sync status', 'Logs'], context: 'Conectividad - Integración externa' }
        ]
    };

    // Enriquecer cada pantalla con arquitectura
    Object.keys(baseFlows).forEach(tier => {
        if (tier !== '_architecture') {
            baseFlows[tier] = baseFlows[tier].map((screen, index) => 
                ScreenArchitecture.enrichScreenData(screen, index, baseFlows[tier].length, architecture)
            );
        }
    });
    
    // Agregar metadata de arquitectura
    baseFlows._architecture = architecture;

    return baseFlows;
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
        markUnsavedChanges();
        
        // Also save to app instance
        if (app) {
            app.currentProject = project;
            app.addToHistory(project);
        }
        
        // Hide form, show project view
        const projectForm = document.getElementById('projectForm');
        const projectView = document.getElementById('projectView');
        const overviewSection = document.getElementById('overviewSection');
        const mainTabs = document.getElementById('mainTabs');
        const saveBtn = document.getElementById('saveBtn');
        const exportBtn = document.getElementById('exportBtn');
        const shareBtn = document.getElementById('shareBtn');
        const versionsBtn = document.getElementById('versionsBtn');
        
        if (projectForm) projectForm.style.display = 'none';
        if (projectView) projectView.style.display = 'block';
        if (overviewSection) overviewSection.style.display = 'block';
        if (mainTabs) mainTabs.style.display = 'none';
        
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

// ====================
// ALIGNMENT PANEL RENDER
// ====================
function renderAlignmentPanel(analysis, userInput) {
    if (!analysis) return '';
    
    const scoreInfo = AlignmentAnalyzer.getScoreLevel(analysis.score);
    
    // Generar HTML de keywords comparados usando clases CSS
    const matchedHTML = analysis.matched.slice(0, 8).map(kw => 
        `<span class="keyword-tag matched">✓ ${kw}</span>`
    ).join('');
    
    const missingHTML = analysis.missing.slice(0, 5).map(kw => 
        `<span class="keyword-tag missing">✕ ${kw}</span>`
    ).join('');
    
    // Generar warnings si hay desviación
    let warningsHTML = '';
    const criticalRecommendations = analysis.recommendations.filter(r => r.type === 'critical' || r.type === 'warning');
    
    if (criticalRecommendations.length > 0) {
        warningsHTML = criticalRecommendations.map(rec => `
            <div class="deviation-warning">
                <span class="icon">⚠️</span>
                <div class="deviation-content">
                    <div style="font-weight: 600; color: var(--error); margin-bottom: 4px;">Posible Desviación Detectada</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${rec.message}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Color del score badge según nivel
    const scoreBadgeColors = {
        excellent: 'background: rgba(34, 197, 94, 0.2); color: var(--success);',
        good: 'background: rgba(34, 197, 94, 0.15); color: var(--success);',
        fair: 'background: rgba(245, 158, 11, 0.2); color: var(--warning);',
        poor: 'background: rgba(239, 68, 68, 0.2); color: var(--error);'
    };
    
    return `
        <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 16px; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">🎯</span>
                    <span style="font-weight: 600; color: var(--text-primary);">Control de Alineación</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Puntuación:</span>
                    <div style="padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; ${scoreBadgeColors[scoreInfo.level]}">
                        ${scoreInfo.icon} ${analysis.score}% - ${scoreInfo.label}
                    </div>
                </div>
            </div>
            
            ${warningsHTML}
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Cobertura de Conceptos</div>
                    <div style="font-size: 1.2rem; font-weight: 600; color: var(--accent-primary);">
                        ${Math.round(analysis.keywordCoverage)}%
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">
                        (${analysis.matched.length}/${analysis.inputKeywords.length})
                    </div>
                </div>
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Alineación Categoría</div>
                    <div style="font-size: 1.2rem; font-weight: 600; color: var(--accent-secondary);">
                        ${Math.round(analysis.categoryAlignment)}%
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">
                        ${userInput?.category || 'N/A'}
                    </div>
                </div>
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-sm); text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Alineación Semántica</div>
                    <div style="font-size: 1.2rem; font-weight: 600; color: var(--success);">
                        ${Math.round(analysis.semanticAlignment)}%
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">
                        Expansión apropiada
                    </div>
                </div>
            </div>
            
            <div class="keyword-comparison" style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-sm); margin-top: 16px;">
                <div class="keyword-section">
                    <div class="keyword-section-title" style="font-size: 0.85rem; font-weight: 600; color: var(--success); margin-bottom: 12px;">✓ Conceptos Encontrados (${analysis.matched.length})</div>
                    <div class="keyword-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${matchedHTML || '<span style="color: var(--text-muted); font-size: 0.8rem;">Ninguno</span>'}
                    </div>
                </div>
                ${analysis.missing.length > 0 ? `
                <div class="keyword-section" style="margin-top: 16px;">
                    <div class="keyword-section-title" style="font-size: 0.85rem; font-weight: 600; color: var(--error); margin-bottom: 12px;">✕ Conceptos Faltantes (${analysis.missing.length})</div>
                    <div class="keyword-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${missingHTML}
                        ${analysis.missing.length > 5 ? `<span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 8px;">+${analysis.missing.length - 5} más</span>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
            
            ${analysis.score < 60 ? `
            <div style="margin-top: 16px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-sm); border: 1px dashed var(--error);">
                <p style="color: var(--error); font-size: 0.85rem; margin: 0;">
                    <strong>⚠️ Alerta de Desviación:</strong> El contenido generado se ha desviado significativamente de tu descripción original. 
                    Considera regenerar el proyecto o ajustar manualmente las secciones afectadas.
                </p>
            </div>
            ` : ''}
            
            ${analysis.score < 80 ? `
            <div style="display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap;">
                ${analysis.score < 70 ? `
                <button onclick="regenerateWithFocus()" style="flex: 1; min-width: 140px; padding: 10px 16px; background: var(--accent-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    ↻ Regenerar con Más Foco
                </button>
                ` : ''}
                <button onclick="adjustGeneration()" style="flex: 1; min-width: 140px; padding: 10px 16px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    🎯 Ajustar Manualmente
                </button>
            </div>
            ` : `
            <div style="margin-top: 16px; padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: var(--radius-sm); border: 1px solid var(--success);">
                <p style="color: var(--success); font-size: 0.85rem; margin: 0;">
                    ✅ <strong>Excelente alineación.</strong> El contenido generado refleja fielmente tu descripción original.
                </p>
            </div>
            `}
        </div>
    `;
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
    
    // Analizar alineación si existe input original y datos generados
    let alignmentHTML = '';
    if (project.data && project.data.whatIs) {
        // Crear userInput para análisis
        const userInput = {
            name: project.name,
            category: project.category,
            description: project.description,
            expandedDescription: project.expandedDescription || project.description
        };
        
        try {
            const analysis = AlignmentAnalyzer.analyze(userInput, project.data);
            alignmentHTML = renderAlignmentPanel(analysis, userInput);
        } catch (e) {
            console.warn('Error analyzing alignment:', e);
        }
    }
    
    // Determinar si hay datos generados
    const hasGeneratedData = project.data && project.data.whatIs;
    
    // Construir contenido principal integrado
    let mainContentHTML = '';
    
    if (hasGeneratedData) {
        // Vista integrada más limpia y estructurada
        const whatIsLines = (project.data.whatIs || '').split('\n').filter(l => l.trim());
        const firstParagraph = whatIsLines[0] || '';
        const restContent = whatIsLines.slice(1).join('\n').trim();
        
        mainContentHTML = `
            <div class="content-block" style="margin: 0;">
                <div class="content-block-header">
                    <span class="content-block-title">📋 Resumen del Proyecto</span>
                </div>
                <div class="content-block-body" style="padding: 20px;">
                    <!-- Encabezado con datos básicos -->
                    <div style="display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Proyecto</div>
                            <div style="color: var(--text-primary); font-weight: 600; font-size: 1.2rem;">${escapeHtml(project.name)}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Categoría</div>
                            <div style="color: var(--accent-primary); font-weight: 500;">${escapeHtml((project.category || 'general').charAt(0).toUpperCase() + (project.category || 'general').slice(1))}</div>
                        </div>
                        ${project.data.targetAudience ? `
                        <div style="flex: 1; min-width: 200px;">
                            <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Público</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(project.data.targetAudience.split('\n')[0].replace(/^.*diseñada para /i, '').replace(/\.$/, ''))}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Tu descripción original -->
                    <div style="margin-bottom: 24px;">
                        <div style="color: var(--text-muted); font-size: 0.8rem; font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <span style="opacity: 0.7;">📝</span> Tu idea original
                        </div>
                        <div style="color: var(--text-primary); font-size: 0.95rem; line-height: 1.7; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; border-left: 3px solid var(--text-muted);">
                            ${escapeHtml(project.description)}
                        </div>
                    </div>
                    
                    <!-- Interpretación generada - solo el primer párrafo -->
                    <div style="margin-bottom: 24px;">
                        <div style="color: var(--accent-primary); font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <span>🎯</span> Interpretación
                        </div>
                        <div style="color: var(--text-primary); font-size: 0.95rem; line-height: 1.7; padding: 16px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.06)); border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.15);">
                            ${escapeHtml(firstParagraph)}
                            ${restContent ? `
                            <details style="margin-top: 12px;">
                                <summary style="cursor: pointer; color: var(--accent-primary); font-size: 0.85rem; font-weight: 500;">Ver más detalles</summary>
                                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border-color); color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(restContent)}</div>
                            </details>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${project.data.needsSolved ? `
                    <!-- Necesidades en formato más compacto -->
                    <div>
                        <div style="color: var(--success); font-size: 0.8rem; font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <span>✓</span> Qué resuelve
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.7;">
                            ${formatTextWithLists(project.data.needsSolved)}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        // Vista previa cuando aún no hay datos generados
        mainContentHTML = `
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
                            <strong style="color: var(--accent-primary);">Descripción:</strong>
                            <p style="color: var(--text-secondary); margin-top: 8px; line-height: 1.6;">${escapeHtml(project.description)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
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
    }
    
    overviewContent.innerHTML = `
        <div style="display: grid; gap: 20px;">
            <!-- Panel de Alineación (solo si hay datos generados y no está aprobado) -->
            ${alignmentHTML}
            
            <!-- Contenido Principal Integrado -->
            ${mainContentHTML}
            
            <!-- Instrucciones -->
            <div style="padding: 16px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1)); border-radius: var(--radius-md); border: 1px solid var(--accent-primary);">
                <p style="color: var(--text-primary); font-size: 0.9rem; margin: 0;">
                    <strong>💡 Siguiente paso:</strong> Haz clic en <strong>"Aprobar y Continuar"</strong> para ver el flujo completo generado, 
                    o en <strong>"Ajustar Manualmente"</strong> si deseas modificar la información.
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
    markUnsavedChanges();
    
    if (app) {
        app.currentProject = project;
    }
    
    // Update UI
    const overview = document.getElementById('overviewSection');
    const mainTabs = document.getElementById('mainTabs');
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (overview) overview.style.display = 'none';
    if (mainTabs) mainTabs.style.display = 'block';
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
            // Auto-resize textarea después de poblar
            if (element.tagName === 'TEXTAREA') {
                autoResizeTextarea(element);
            }
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
    
    // Auto-resize all textareas after content is loaded
    setTimeout(() => {
        document.querySelectorAll('textarea').forEach(textarea => {
            autoResizeTextarea(textarea);
        });
    }, 100);
}

function renderFlows(flows) {
    const container = document.getElementById('flowsContainer');
    if (!container) return;
    
    // Store flows globally for preview access
    window.currentFlows = flows;
    
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
                        ${flow.context ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; font-style: italic;">${flow.context}</div>` : ''}
                    </div>
                    <div class="flow-card-body">
                        <strong style="font-size: 0.75rem; color: var(--accent-primary); display: block; margin-bottom: 8px;">🎨 Elementos UI:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                            ${flow.elements.map(el => `
                                <span style="padding: 6px 12px; background: var(--bg-secondary); border-radius: 20px; font-size: 0.75rem; color: var(--text-muted);">• ${el}</span>
                            `).join('')}
                        </div>
                        
                        ${flow.globalElements ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <strong style="font-size: 0.75rem; color: var(--info); display: block; margin-bottom: 6px;">🏗️ Elementos Globales:</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
                                ${flow.globalElements.header ? '✓ Header' : '✗ Header'} | 
                                ${flow.globalElements.bottomNav ? '✓ Bottom Nav' : '✗ Bottom Nav'} | 
                                ${flow.globalElements.sidebar ? '✓ Sidebar' : '✗ Sidebar'}
                                ${flow.globalElements.note ? `<br><span style="font-style: italic; color: var(--text-muted);">${flow.globalElements.note}</span>` : ''}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${flow.layout ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <strong style="font-size: 0.75rem; color: var(--warning); display: block; margin-bottom: 6px;">📐 Layout:</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
                                ${flow.layout.pattern}<br>
                                <span style="font-style: italic; color: var(--text-muted);">${flow.layout.recommendation}</span>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${flow.navigation ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <strong style="font-size: 0.75rem; color: var(--success); display: block; margin-bottom: 6px;">🧭 Navegación:</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
                                Nivel: ${flow.navigation.level}<br>
                                Acceso: ${flow.navigation.accessFrom}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${flow.interactions && flow.interactions.length > 0 ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <strong style="font-size: 0.75rem; color: var(--accent-secondary); display: block; margin-bottom: 6px;">👆 Interacciones:</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
                                ${flow.interactions.map(i => `• ${i}`).join('<br>')}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${flow.stateManagement ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <strong style="font-size: 0.75rem; color: #9b59b6; display: block; margin-bottom: 6px;">📊 Estado:</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
                                Loading: ${flow.stateManagement.loading ? '✓' : '✗'} | 
                                Empty: ${flow.stateManagement.empty ? '✓' : '✗'} | 
                                Error: ${flow.stateManagement.error ? '✓' : '✗'}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${flow.accessibilityNotes && flow.accessibilityNotes.length > 0 ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <strong style="font-size: 0.75rem; color: #1abc9c; display: block; margin-bottom: 6px;">♿ Accesibilidad:</strong>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
                                ${flow.accessibilityNotes.map(n => `• ${n}`).join('<br>')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${flows._architecture ? `
        <div class="content-block" style="margin-top: 24px;">
            <div class="content-block-header" style="display: flex; align-items: center; justify-content: space-between;">
                <span class="content-block-title">💡 Reglas Clave para Diseñar</span>
                <button class="header-btn" onclick="switchTab('generalRules')" style="font-size: 0.85rem; padding: 6px 12px;">
                    Ver todas las reglas →
                </button>
            </div>
            <div class="content-block-body">
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px; font-style: italic;">
                    Estas son las reglas más críticas al diseñar estos flujos. Para documentación completa, consulta la pestaña de Reglas Generales.
                </p>
                ${flows._architecture.generalRules ? `
                <div style="display: grid; gap: 12px;">
                    <div style="padding: 12px; background: var(--bg-primary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-primary);">
                        <strong style="color: var(--accent-primary); font-size: 0.9rem; display: block; margin-bottom: 6px;">🌍 Idioma: ${flows._architecture.generalRules.language?.primary || 'Español (es-ES)'}</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            Fechas: ${flows._architecture.generalRules.language?.localization?.dateFormat || 'dd/MM/yyyy'} • 
                            Números: ${flows._architecture.generalRules.language?.localization?.numberFormat || '1.234,56'}
                        </div>
                    </div>
                    
                    ${flows._architecture.generalRules.branding?.naming ? `
                    <div style="padding: 12px; background: var(--bg-primary); border-radius: var(--radius-sm); border-left: 3px solid var(--warning);">
                        <strong style="color: var(--warning); font-size: 0.9rem; display: block; margin-bottom: 6px;">🎨 Nombre comercial consistente</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            Usar "<strong>${flows._architecture.generalRules.branding.naming.formats?.full || 'N/A'}</strong>" en toda la aplicación
                            ${flows._architecture.generalRules.branding.naming.formats?.short ? ` • Corto: "<strong>${flows._architecture.generalRules.branding.naming.formats.short}</strong>"` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${flows._architecture.generalRules.contentGuidelines?.tone?.characteristics ? `
                    <div style="padding: 12px; background: var(--bg-primary); border-radius: var(--radius-sm); border-left: 3px solid var(--info);">
                        <strong style="color: var(--info); font-size: 0.9rem; display: block; margin-bottom: 6px;">✍️ Tono de comunicación</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${flows._architecture.generalRules.contentGuidelines.tone.characteristics.slice(0, 2).join(' • ')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : '<div style="text-align: center; padding: 20px; color: var(--text-muted);">No hay reglas generales definidas</div>'}
            </div>
        </div>
        
        ${flows._architecture.screenTypes ? `
        <div class="content-block" style="margin-top: 16px;">
            <div class="content-block-header">
                <span class="content-block-title">🏗️ Arquitectura y Guías de Consistencia</span>
            </div>
            <div class="content-block-body">
                <div style="padding: 8px; background: var(--bg-primary); border-radius: var(--radius-sm); margin-bottom: 12px;">
                    <strong style="color: var(--accent-primary);">📋 Tipos de Pantallas Definidos:</strong>
                    <ul style="margin-top: 8px; padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
                        ${Object.entries(flows._architecture.screenTypes).map(([key, type]) => `
                            <li><strong>${type.types?.join(', ') || key}</strong>: ${type.characteristics || 'N/A'}</li>
                        `).join('')}
                    </ul>
                </div>
                ${flows._architecture.consistencyRules ? `
                <div style="padding: 8px; background: var(--bg-primary); border-radius: var(--radius-sm);">
                    <strong style="color: var(--accent-primary);">🎯 Reglas de Consistencia Visual:</strong>
                    <ul style="margin-top: 8px; padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
                        ${flows._architecture.consistencyRules.spacing ? `<li><strong>Espaciado:</strong> ${flows._architecture.consistencyRules.spacing.rule} (${flows._architecture.consistencyRules.spacing.scale})</li>` : ''}
                        ${flows._architecture.consistencyRules.typography ? `<li><strong>Tipografía:</strong> ${flows._architecture.consistencyRules.typography.rule}</li>` : ''}
                        ${flows._architecture.consistencyRules.colors ? `<li><strong>Colores:</strong> ${flows._architecture.consistencyRules.colors.rule}</li>` : ''}
                        ${flows._architecture.consistencyRules.components ? `<li><strong>Componentes:</strong> ${flows._architecture.consistencyRules.components.principle}</li>` : ''}
                        ${flows._architecture.consistencyRules.animations ? `<li><strong>Animaciones:</strong> ${flows._architecture.consistencyRules.animations.rule}</li>` : ''}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        ` : ''}
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
        showNotification('No hay proyecto activo para guardar', 'error');
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
    
    // Merge with existing data (always save, don't check for changes)
    if (!project.data) project.data = {};
    Object.assign(project.data, newData);
    project.updatedAt = new Date().toISOString();
    
    // Update project in array
    if (projectIndex !== -1) {
        state.projects[projectIndex] = project;
    }
    
    // Save to storage
    saveProjects();
    
    // Also save using app if available
    if (app) {
        app.currentProject = project;
        app.saveData();
    }
    
    // Show success notification
    showNotification('Proyecto guardado correctamente', 'success');
    
    // Update button UI
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '✓ Guardado';
        saveBtn.disabled = true;
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }, 2000);
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

// ====================
// MODAL FUNCTIONS
// ====================
let projectToDelete = null;

function openDeleteModal(projectId) {
    projectToDelete = projectId;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
    }
    projectToDelete = null;
}

function confirmDelete() {
    if (projectToDelete) {
        // Find and remove the project
        const index = state.projects.findIndex(p => p.id === projectToDelete);
        if (index !== -1) {
            state.projects.splice(index, 1);
            saveProjects();
            
            // If we deleted the current project, clear the view
            if (state.currentProjectId === projectToDelete) {
                state.currentProjectId = null;
                if (app) {
                    app.currentProject = null;
                }
                // Show welcome screen
                const welcomeScreen = document.getElementById('welcomeScreen');
                const projectView = document.getElementById('projectView');
                const projectForm = document.getElementById('projectForm');
                
                if (welcomeScreen) welcomeScreen.style.display = 'block';
                if (projectView) projectView.style.display = 'none';
                if (projectForm) projectForm.style.display = 'none';
                
                document.getElementById('headerTitle').textContent = 'Bienvenido a FlowForge';
            }
            
            // Update projects list
            renderProjectsList();
            
            if (app) {
                app.showNotification('Proyecto eliminado', 'success');
            }
        }
    }
    closeDeleteModal();
}

function showVersionsModal() {
    const modal = document.getElementById('versionsModal');
    if (modal) {
        modal.style.display = 'flex';
        renderVersionsList();
    }
}

function closeVersionsModal() {
    const modal = document.getElementById('versionsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function createVersion() {
    const nameInput = document.getElementById('versionNameInput');
    const versionName = nameInput?.value?.trim() || `Versión ${new Date().toLocaleDateString('es-ES')}`;
    
    let project = null;
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
    }
    
    if (!project) {
        if (app) app.showNotification('No hay proyecto seleccionado', 'warning');
        return;
    }
    
    // Initialize versions array if needed
    if (!project.versions) {
        project.versions = [];
    }
    
    // Create version snapshot
    const version = {
        id: Date.now(),
        name: versionName,
        createdAt: new Date().toISOString(),
        snapshot: JSON.parse(JSON.stringify(project.data))
    };
    
    project.versions.push(version);
    
    // Save
    saveProjects();
    if (app) {
        app.saveData();
        app.showNotification(`Versión "${versionName}" creada`, 'success');
    }
    
    // Clear input and refresh list
    if (nameInput) nameInput.value = '';
    renderVersionsList();
}

function renderVersionsList() {
    const container = document.getElementById('versionsList');
    if (!container) return;
    
    let project = null;
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
    }
    
    if (!project || !project.versions || project.versions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay versiones guardadas</p>';
        return;
    }
    
    container.innerHTML = project.versions.map(v => `
        <div class="version-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 8px;">
            <div>
                <strong>${escapeHtml(v.name)}</strong>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0;">${new Date(v.createdAt).toLocaleString('es-ES')}</p>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="header-btn" onclick="restoreVersion(${v.id})" title="Restaurar esta versión">↺ Restaurar</button>
                <button class="header-btn danger-btn" onclick="deleteVersion(${v.id})" title="Eliminar versión" style="background: var(--error); color: white;">✕</button>
            </div>
        </div>
    `).join('');
}

function restoreVersion(versionId) {
    let project = null;
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
    }
    
    if (!project || !project.versions) return;
    
    const version = project.versions.find(v => v.id === versionId);
    if (!version) return;
    
    if (confirm(`¿Restaurar la versión "${version.name}"? Los cambios no guardados se perderán.`)) {
        project.data = JSON.parse(JSON.stringify(version.snapshot));
        
        markUnsavedChanges();
        if (app) {
            app.currentProject = project;
            app.showNotification(`Versión "${version.name}" restaurada. Recuerda guardar los cambios.`, 'success');
        }
        
        // Refresh UI
        populateProjectFields(project.data);
        updatePromptOutput();
        closeVersionsModal();
    }
}

function deleteVersion(versionId) {
    let project = null;
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
    }
    
    if (!project || !project.versions) return;
    
    const index = project.versions.findIndex(v => v.id === versionId);
    if (index !== -1) {
        project.versions.splice(index, 1);
        saveProjects();
        if (app) app.saveData();
        renderVersionsList();
        if (app) app.showNotification('Versión eliminada', 'success');
    }
}

function showShareModal() {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    
    let project = null;
    if (state.currentProjectId) {
        project = state.projects.find(p => p.id === state.currentProjectId);
    }
    if (!project && app && app.currentProject) {
        project = app.currentProject;
    }
    
    if (!project) {
        if (app) app.showNotification('No hay proyecto seleccionado', 'warning');
        return;
    }
    
    // Generate shareable data
    const shareData = {
        name: project.name,
        category: project.category,
        data: project.data,
        exportedAt: new Date().toISOString()
    };
    
    // Create base64 encoded URL parameter
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    const shareUrl = `${window.location.origin}${window.location.pathname}?import=${encoded}`;
    
    const shareLinkInput = document.getElementById('shareLinkInput');
    if (shareLinkInput) {
        shareLinkInput.value = shareUrl;
    }
    
    modal.style.display = 'flex';
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Hide QR if shown
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
        qrContainer.style.display = 'none';
        qrContainer.innerHTML = '';
    }
}

function copyShareLink() {
    const shareLinkInput = document.getElementById('shareLinkInput');
    if (shareLinkInput) {
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            if (app) app.showNotification('Enlace copiado al portapapeles', 'success');
        }).catch(() => {
            shareLinkInput.select();
            document.execCommand('copy');
            if (app) app.showNotification('Enlace copiado', 'success');
        });
    }
}

function generateQRCode() {
    const shareLinkInput = document.getElementById('shareLinkInput');
    const qrContainer = document.getElementById('qrCodeContainer');
    
    if (!shareLinkInput || !qrContainer) return;
    
    const url = shareLinkInput.value;
    
    // Use a simple QR code API
    qrContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" 
                 alt="QR Code para compartir proyecto" 
                 style="border-radius: 8px; border: 2px solid var(--border-color);">
            <p style="margin-top: 12px; font-size: 0.85rem; color: var(--text-secondary);">Escanea para importar el proyecto</p>
        </div>
    `;
    qrContainer.style.display = 'block';
    
    // Hide QR button
    const qrBtn = document.getElementById('qrBtn');
    if (qrBtn) qrBtn.style.display = 'none';
}

// ====================
// PROJECTS LIST RENDERING
// ====================
function renderProjectsList() {
    const container = document.getElementById('projectsList');
    if (!container) return;
    
    if (!state.projects || state.projects.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px; font-size: 0.9rem;">No hay proyectos guardados</p>';
        return;
    }
    
    container.innerHTML = state.projects.map(project => `
        <div class="project-item ${state.currentProjectId === project.id ? 'active' : ''}" onclick="loadProject(${project.id})">
            <div class="project-item-header">
                <span class="project-item-name">${escapeHtml(project.name)}</span>
                <button class="project-item-delete" onclick="event.stopPropagation(); openDeleteModal(${project.id})" title="Eliminar proyecto">✕</button>
            </div>
            <div class="project-item-meta">
                <span class="project-item-category">${project.category || 'Sin categoría'}</span>
                <span class="project-item-date">${new Date(project.updatedAt || project.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
        </div>
    `).join('');
}

function loadProject(projectId) {
    // Verificar si hay cambios sin guardar en el proyecto actual
    if (state.hasUnsavedChanges && state.currentProjectId && state.currentProjectId !== projectId) {
        const result = confirmWithSaveOption('cambiar de proyecto');
        if (result === 'save') {
            saveCurrentProject();
        } else if (result === 'cancel') {
            return; // No hacer nada
        }
        // Si result === 'nosave', continuar sin guardar
    }
    
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    
    state.currentProjectId = projectId;
    state.hasUnsavedChanges = false; // Resetear al cargar nuevo proyecto
    updateSaveButtonState();
    
    if (app) {
        app.currentProject = project;
    }
    
    // Update UI
    document.getElementById('headerTitle').textContent = project.name;
    
    // Hide form/welcome, show project view
    const welcomeScreen = document.getElementById('welcomeScreen');
    const projectForm = document.getElementById('projectForm');
    const projectView = document.getElementById('projectView');
    
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (projectForm) projectForm.style.display = 'none';
    if (projectView) projectView.style.display = 'block';
    
    // If project was already approved, show main tabs
    if (project.overviewApproved) {
        const overview = document.getElementById('overviewSection');
        const mainTabs = document.getElementById('mainTabs');
        const saveBtn = document.getElementById('saveBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (overview) overview.style.display = 'none';
        if (mainTabs) mainTabs.style.display = 'block';
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (exportBtn) exportBtn.style.display = 'inline-flex';
        
        // Populate fields
        if (project.data) {
            populateProjectFields(project.data);
        }
    } else {
        // Show overview for approval
        const overview = document.getElementById('overviewSection');
        const mainTabs = document.getElementById('mainTabs');
        
        if (overview) overview.style.display = 'block';
        if (mainTabs) mainTabs.style.display = 'none';
        
        populateOverview(project);
    }
    
    // Update projects list to show active state
    renderProjectsList();
    
    // Agregar al historial de navegación
    pushNavigationState('project');
    
    if (app) {
        app.showNotification(`Proyecto "${project.name}" cargado`, 'success');
    }
}

// Escape HTML helper (global)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format text with numbered lists to HTML
function formatTextWithLists(text) {
    if (!text) return '';
    
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let listItems = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue; // Skip empty lines
        
        // Check if line starts with a number followed by . or )
        const listMatch = line.match(/^(\d+)[\.\)]\s+(.+)$/);
        
        if (listMatch) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(escapeHtml(listMatch[2]));
        } else {
            // Not a list item
            if (inList) {
                // Close previous list
                html += '<ol style="margin: 8px 0; padding-left: 24px; list-style-type: decimal;">';
                listItems.forEach(item => {
                    html += `<li style="margin: 4px 0; display: list-item;">${item}</li>`;
                });
                html += '</ol>';
                inList = false;
                listItems = [];
            }
            
            html += `<p style="margin: 8px 0;">${escapeHtml(line)}</p>`;
        }
    }
    
    // Close any remaining list
    if (inList) {
        html += '<ol style="margin: 8px 0; padding-left: 24px; list-style-type: decimal;">';
        listItems.forEach(item => {
            html += `<li style="margin: 4px 0; display: list-item;">${item}</li>`;
        });
        html += '</ol>';
    }
    
    return html || escapeHtml(text);
}

// Check for import parameter on load
function checkForImport() {
    const urlParams = new URLSearchParams(window.location.search);
    const importData = urlParams.get('import');
    
    if (importData) {
        try {
            const decoded = JSON.parse(decodeURIComponent(atob(importData)));
            
            if (confirm(`¿Importar el proyecto "${decoded.name}"?`)) {
                const newProject = {
                    id: Date.now(),
                    name: decoded.name,
                    category: decoded.category,
                    description: '',
                    data: decoded.data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    overviewApproved: true
                };
                
                state.projects.push(newProject);
                saveProjects();
                
                // Load the imported project
                loadProject(newProject.id);
                
                if (app) {
                    app.showNotification(`Proyecto "${decoded.name}" importado`, 'success');
                }
            }
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Error importing project:', error);
            if (app) {
                app.showNotification('Error al importar el proyecto', 'error');
            }
        }
    }
}

// ====================
// PREVIEW TAB FUNCTIONS
// ====================

function initPreviewTab() {
    const tierSelect = document.getElementById('previewTier');
    const screenSelect = document.getElementById('previewScreen');
    const templateSelect = document.getElementById('previewTemplate');
    const deviceSelect = document.getElementById('previewDevice');
    
    // Auto-update on select changes
    [tierSelect, screenSelect, templateSelect, deviceSelect].forEach(select => {
        if (select) {
            select.addEventListener('change', updatePreview);
        }
    });
    
    // Populate tier select on flows tab activation
    const flowsTabBtn = document.querySelector('[data-tab="flows"]');
    if (flowsTabBtn) {
        const originalClick = flowsTabBtn.onclick;
        flowsTabBtn.addEventListener('click', () => {
            setTimeout(() => {
                populatePreviewSelectors();
            }, 100);
        });
    }
}

function populatePreviewSelectors() {
    if (!window.currentFlows || !window.currentFlows._architecture) return;
    
    const tierSelect = document.getElementById('previewTier');
    const flows = window.currentFlows;
    
    if (!tierSelect) return;
    
    // Populate tiers
    tierSelect.innerHTML = '<option value="">Selecciona un tier</option>';
    ['mvp', 'intermediate', 'complete'].forEach(tier => {
        if (flows[tier] && flows[tier].length > 0) {
            const option = document.createElement('option');
            option.value = tier;
            option.textContent = tier === 'mvp' ? 'MVP' : tier === 'intermediate' ? 'Intermedio' : 'Completo';
            tierSelect.appendChild(option);
        }
    });
    
    // Clear screen select
    const screenSelect = document.getElementById('previewScreen');
    if (screenSelect) {
        screenSelect.innerHTML = '<option value="">Primero selecciona un tier</option>';
        screenSelect.disabled = true;
    }
}

function updatePreview() {
    const tierSelect = document.getElementById('previewTier');
    const screenSelect = document.getElementById('previewScreen');
    const templateSelect = document.getElementById('previewTemplate');
    const deviceSelect = document.getElementById('previewDevice');
    const iframe = document.getElementById('previewFrame');
    
    if (!tierSelect || !screenSelect || !templateSelect || !deviceSelect || !iframe) {
        console.error('Preview elements not found');
        return;
    }
    
    const tier = tierSelect.value;
    
    // Update screen selector when tier changes
    if (!screenSelect.value || tierSelect === document.activeElement) {
        updateScreenSelector(tier);
        return;
    }
    
    const screenIndex = parseInt(screenSelect.value);
    const template = templateSelect.value;
    const device = deviceSelect.value;
    
    if (!tier || screenIndex === '' || isNaN(screenIndex)) {
        iframe.srcdoc = '<body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;text-align:center;"><div><div style="font-size:3rem;margin-bottom:1rem;">👁️</div><div>Selecciona un tier y una pantalla para ver la vista previa</div></div></body>';
        return;
    }
    
    if (!window.currentFlows || !window.currentFlows[tier]) {
        iframe.srcdoc = '<body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;"><div>No hay flujos disponibles</div></body>';
        return;
    }
    
    const flow = window.currentFlows[tier][screenIndex];
    if (!flow) {
        iframe.srcdoc = '<body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#666;"><div>Pantalla no encontrada</div></body>';
        return;
    }
    
    const projectName = window.currentFlows._architecture?.metadata?.projectName || '';
    const html = PreviewGenerator.generateHTMLPreview(flow, template, device, projectName);
    iframe.srcdoc = html;
}

function updateScreenSelector(tier) {
    const screenSelect = document.getElementById('previewScreen');
    if (!screenSelect || !tier) return;
    
    screenSelect.innerHTML = '<option value="">Selecciona una pantalla</option>';
    screenSelect.disabled = false;
    
    if (!window.currentFlows || !window.currentFlows[tier]) {
        screenSelect.innerHTML = '<option value="">No hay pantallas disponibles</option>';
        screenSelect.disabled = true;
        return;
    }
    
    const flows = window.currentFlows[tier];
    flows.forEach((flow, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${index + 1}. ${flow.screen}`;
        screenSelect.appendChild(option);
    });
}

function downloadPreviewHTML() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe || !iframe.srcdoc) {
        alert('No hay vista previa disponible para descargar');
        return;
    }
    
    const html = iframe.srcdoc;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const tierSelect = document.getElementById('previewTier');
    const screenSelect = document.getElementById('previewScreen');
    const tier = tierSelect ? tierSelect.value : 'screen';
    const screenText = screenSelect ? screenSelect.options[screenSelect.selectedIndex]?.text : 'preview';
    const filename = `${tier}-${screenText.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    if (window.app) {
        app.showNotification('✅ HTML descargado correctamente', 'success');
    }
}

function copyPreviewHTML() {
    const iframe = document.getElementById('previewFrame');
    if (!iframe || !iframe.srcdoc) {
        alert('No hay vista previa disponible para copiar');
        return;
    }
    
    const html = iframe.srcdoc;
    
    navigator.clipboard.writeText(html).then(() => {
        if (window.app) {
            app.showNotification('✅ HTML copiado al portapapeles', 'success');
        } else {
            alert('HTML copiado al portapapeles');
        }
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        alert('Error al copiar al portapapeles');
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderProjectsList();
    checkForImport();
    
    // Inicializar mejoras de accesibilidad
    A11yEnhancements.init();
    
    // Verificar si hay proyecto para importar via URL
    ProjectSharing.importFromLink();
    
    // Inicializar navegación en home
    pushNavigationState('home');
    updateNavigationButtons();
    
    // Inicializar Preview Tab
    initPreviewTab();
});