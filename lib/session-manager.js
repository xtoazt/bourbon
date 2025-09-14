/**
 * Session Management System for Bourbon
 * Inspired by Rammerhead's session functionality
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SessionManager {
    constructor(options = {}) {
        this.sessions = new Map();
        this.sessionDir = options.sessionDir || path.join(__dirname, '../sessions');
        this.maxSessions = options.maxSessions || 1000;
        this.sessionTimeout = options.sessionTimeout || 24 * 60 * 60 * 1000; // 24 hours
        this.cleanupInterval = options.cleanupInterval || 60 * 60 * 1000; // 1 hour
        
        this.initializeSessionDir();
        this.startCleanupTimer();
    }

    async initializeSessionDir() {
        try {
            await fs.mkdir(this.sessionDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create session directory:', error);
        }
    }

    // Generate a unique session ID
    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    // Create a new session
    createSession(options = {}) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            data: {
                cookies: new Map(),
                localStorage: new Map(),
                sessionStorage: new Map(),
                customProxy: options.customProxy || null,
                userAgent: options.userAgent || null,
                headers: options.headers || {},
                settings: {
                    enableJavaScript: true,
                    enableCookies: true,
                    enableLocalStorage: true,
                    enableWebSockets: true,
                    ...options.settings
                }
            }
        };

        this.sessions.set(sessionId, session);
        this.cleanupOldSessions();
        
        return sessionId;
    }

    // Get session by ID
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccessed = Date.now();
        }
        return session;
    }

    // Update session data
    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session.data, updates);
            session.lastAccessed = Date.now();
            return true;
        }
        return false;
    }

    // Set cookie for session
    setCookie(sessionId, name, value, options = {}) {
        const session = this.getSession(sessionId);
        if (session) {
            session.data.cookies.set(name, {
                value,
                domain: options.domain || '',
                path: options.path || '/',
                expires: options.expires,
                httpOnly: options.httpOnly || false,
                secure: options.secure || false,
                sameSite: options.sameSite || 'Lax'
            });
            return true;
        }
        return false;
    }

    // Get cookies for session
    getCookies(sessionId, domain = '', path = '/') {
        const session = this.getSession(sessionId);
        if (!session) return [];

        const cookies = [];
        for (const [name, cookie] of session.data.cookies) {
            if (this.cookieMatches(cookie, domain, path)) {
                cookies.push(`${name}=${cookie.value}`);
            }
        }
        return cookies;
    }

    // Check if cookie matches domain and path
    cookieMatches(cookie, domain, path) {
        if (cookie.domain && !domain.endsWith(cookie.domain)) {
            return false;
        }
        if (cookie.path && !path.startsWith(cookie.path)) {
            return false;
        }
        return true;
    }

    // Set localStorage item
    setLocalStorage(sessionId, key, value) {
        const session = this.getSession(sessionId);
        if (session) {
            session.data.localStorage.set(key, value);
            return true;
        }
        return false;
    }

    // Get localStorage item
    getLocalStorage(sessionId, key) {
        const session = this.getSession(sessionId);
        return session ? session.data.localStorage.get(key) : null;
    }

    // Get all localStorage data
    getAllLocalStorage(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) return {};
        
        const data = {};
        for (const [key, value] of session.data.localStorage) {
            data[key] = value;
        }
        return data;
    }

    // Set sessionStorage item
    setSessionStorage(sessionId, key, value) {
        const session = this.getSession(sessionId);
        if (session) {
            session.data.sessionStorage.set(key, value);
            return true;
        }
        return false;
    }

    // Get sessionStorage item
    getSessionStorage(sessionId, key) {
        const session = this.getSession(sessionId);
        return session ? session.data.sessionStorage.get(key) : null;
    }

    // Delete session
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }

    // Clean up old sessions
    cleanupOldSessions() {
        const now = Date.now();
        const toDelete = [];

        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastAccessed > this.sessionTimeout) {
                toDelete.push(sessionId);
            }
        }

        toDelete.forEach(sessionId => {
            this.sessions.delete(sessionId);
        });

        // If we still have too many sessions, remove oldest ones
        if (this.sessions.size > this.maxSessions) {
            const sortedSessions = Array.from(this.sessions.entries())
                .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
            
            const excess = this.sessions.size - this.maxSessions;
            for (let i = 0; i < excess; i++) {
                this.sessions.delete(sortedSessions[i][0]);
            }
        }
    }

    // Start cleanup timer
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupOldSessions();
        }, this.cleanupInterval);
    }

    // Get session statistics
    getStats() {
        return {
            totalSessions: this.sessions.size,
            maxSessions: this.maxSessions,
            sessionTimeout: this.sessionTimeout,
            sessions: Array.from(this.sessions.values()).map(session => ({
                id: session.id,
                createdAt: session.createdAt,
                lastAccessed: session.lastAccessed,
                cookieCount: session.data.cookies.size,
                localStorageCount: session.data.localStorage.size,
                sessionStorageCount: session.data.sessionStorage.size
            }))
        };
    }

    // Export session data
    exportSession(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) return null;

        return {
            id: session.id,
            createdAt: session.createdAt,
            lastAccessed: session.lastAccessed,
            data: {
                cookies: Array.from(session.data.cookies.entries()),
                localStorage: Array.from(session.data.localStorage.entries()),
                sessionStorage: Array.from(session.data.sessionStorage.entries()),
                customProxy: session.data.customProxy,
                userAgent: session.data.userAgent,
                headers: session.data.headers,
                settings: session.data.settings
            }
        };
    }

    // Import session data
    importSession(sessionData) {
        const session = {
            id: sessionData.id || this.generateSessionId(),
            createdAt: sessionData.createdAt || Date.now(),
            lastAccessed: sessionData.lastAccessed || Date.now(),
            data: {
                cookies: new Map(sessionData.data.cookies || []),
                localStorage: new Map(sessionData.data.localStorage || []),
                sessionStorage: new Map(sessionData.data.sessionStorage || []),
                customProxy: sessionData.data.customProxy || null,
                userAgent: sessionData.data.userAgent || null,
                headers: sessionData.data.headers || {},
                settings: sessionData.data.settings || {}
            }
        };

        this.sessions.set(session.id, session);
        return session.id;
    }
}

module.exports = SessionManager;
