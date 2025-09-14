/**
 * Enhanced Content Rewriter for Bourbon
 * Inspired by Scramjet's advanced rewriting capabilities
 */

const { JSDOM } = require('jsdom');
const { minify } = require('html-minifier');

class EnhancedRewriter {
    constructor(options = {}) {
        this.proxyUrl = options.proxyUrl || '';
        this.enableMinification = options.enableMinification || false;
        this.enableCompression = options.enableCompression || true;
        this.customScripts = options.customScripts || [];
        this.blockedDomains = options.blockedDomains || [];
        this.rewriteRules = options.rewriteRules || [];
    }

    // Main rewrite method
    async rewriteContent(content, contentType, options = {}) {
        if (!content) return content;

        const { sessionId, targetUrl, headers = {} } = options;

        try {
            if (contentType.includes('text/html')) {
                return await this.rewriteHTML(content, { sessionId, targetUrl, headers });
            } else if (contentType.includes('text/css')) {
                return await this.rewriteCSS(content, { sessionId, targetUrl });
            } else if (contentType.includes('application/javascript')) {
                return await this.rewriteJavaScript(content, { sessionId, targetUrl });
            } else if (contentType.includes('application/json')) {
                return await this.rewriteJSON(content, { sessionId, targetUrl });
            }
        } catch (error) {
            console.error('Content rewriting error:', error);
            return content;
        }

        return content;
    }

    // Rewrite HTML content
    async rewriteHTML(html, options = {}) {
        const { sessionId, targetUrl, headers } = options;
        
        try {
            const dom = new JSDOM(html);
            const document = dom.window.document;

            // Rewrite all URLs
            this.rewriteURLs(document, targetUrl);
            
            // Inject proxy scripts
            this.injectProxyScripts(document, sessionId);
            
            // Handle forms
            this.rewriteForms(document, targetUrl);
            
            // Handle meta tags
            this.rewriteMetaTags(document, targetUrl);
            
            // Handle iframes
            this.rewriteIframes(document, targetUrl);
            
            // Handle WebSocket connections
            this.rewriteWebSockets(document, targetUrl);
            
            // Apply custom rewrite rules
            this.applyCustomRules(document, targetUrl);

            let result = dom.serialize();

            // Minify if enabled
            if (this.enableMinification) {
                result = minify(result, {
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyJS: true,
                    minifyCSS: true
                });
            }

            return result;
        } catch (error) {
            console.error('HTML rewriting error:', error);
            return html;
        }
    }

    // Rewrite URLs in document
    rewriteURLs(document, targetUrl) {
        const elements = document.querySelectorAll('*');
        
        elements.forEach(element => {
            // Rewrite href attributes
            if (element.href) {
                element.href = this.rewriteURL(element.href, targetUrl);
            }
            
            // Rewrite src attributes
            if (element.src) {
                element.src = this.rewriteURL(element.src, targetUrl);
            }
            
            // Rewrite action attributes
            if (element.action) {
                element.action = this.rewriteURL(element.action, targetUrl);
            }
            
            // Rewrite data attributes
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-') && this.isURL(attr.value)) {
                    element.setAttribute(attr.name, this.rewriteURL(attr.value, targetUrl));
                }
            });
        });

        // Rewrite inline styles
        const styleElements = document.querySelectorAll('style');
        styleElements.forEach(style => {
            style.textContent = this.rewriteCSS(style.textContent, { targetUrl });
        });
    }

    // Rewrite CSS content
    async rewriteCSS(css, options = {}) {
        const { targetUrl } = options;
        
        // Rewrite URLs in CSS
        css = css.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
            const rewrittenUrl = this.rewriteURL(url, targetUrl);
            return `url('${rewrittenUrl}')`;
        });

        // Rewrite @import statements
        css = css.replace(/@import\s+['"]([^'"]+)['"]/g, (match, url) => {
            const rewrittenUrl = this.rewriteURL(url, targetUrl);
            return `@import '${rewrittenUrl}'`;
        });

        return css;
    }

    // Rewrite JavaScript content
    async rewriteJavaScript(js, options = {}) {
        const { sessionId, targetUrl } = options;
        
        // Rewrite fetch requests
        js = js.replace(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g, (match, url) => {
            const rewrittenUrl = this.rewriteURL(url, targetUrl);
            return `fetch('${rewrittenUrl}'`;
        });

        // Rewrite XMLHttpRequest URLs
        js = js.replace(/\.open\s*\(\s*['"`]([^'"`]+)['"`]/g, (match, method, url) => {
            const rewrittenUrl = this.rewriteURL(url, targetUrl);
            return `.open('${method}', '${rewrittenUrl}'`;
        });

        // Rewrite WebSocket connections
        js = js.replace(/new\s+WebSocket\s*\(\s*['"`]([^'"`]+)['"`]/g, (match, url) => {
            const rewrittenUrl = this.rewriteWebSocketURL(url, targetUrl);
            return `new WebSocket('${rewrittenUrl}'`;
        });

        // Inject session management
        if (sessionId) {
            js = this.injectSessionManagement(js, sessionId);
        }

        return js;
    }

    // Rewrite JSON content
    async rewriteJSON(json, options = {}) {
        const { targetUrl } = options;
        
        try {
            const data = JSON.parse(json);
            const rewritten = this.rewriteObject(data, targetUrl);
            return JSON.stringify(rewritten);
        } catch (error) {
            return json;
        }
    }

    // Rewrite object recursively
    rewriteObject(obj, targetUrl) {
        if (typeof obj === 'string' && this.isURL(obj)) {
            return this.rewriteURL(obj, targetUrl);
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.rewriteObject(item, targetUrl));
        } else if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.rewriteObject(value, targetUrl);
            }
            return result;
        }
        return obj;
    }

    // Rewrite a single URL
    rewriteURL(url, targetUrl) {
        if (!url || typeof url !== 'string') return url;

        try {
            // Handle relative URLs
            if (url.startsWith('/')) {
                const baseUrl = new URL(targetUrl);
                url = `${baseUrl.protocol}//${baseUrl.host}${url}`;
            } else if (url.startsWith('./') || url.startsWith('../')) {
                const baseUrl = new URL(targetUrl);
                url = new URL(url, baseUrl).href;
            } else if (!url.startsWith('http')) {
                return url; // Skip non-HTTP URLs
            }

            // Check if domain is blocked
            const urlObj = new URL(url);
            if (this.blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
                return url;
            }

            // Rewrite to proxy URL
            return `${this.proxyUrl}/api/gateway?url=${encodeURIComponent(url)}`;
        } catch (error) {
            return url;
        }
    }

    // Rewrite WebSocket URL
    rewriteWebSocketURL(url, targetUrl) {
        try {
            const urlObj = new URL(url);
            const wsUrl = new URL(`${this.proxyUrl}/api/ws`);
            wsUrl.searchParams.set('url', url);
            return wsUrl.href;
        } catch (error) {
            return url;
        }
    }

    // Check if string is a URL
    isURL(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }

    // Inject proxy scripts into document
    injectProxyScripts(document, sessionId) {
        const head = document.head || document.createElement('head');
        
        // Inject session management script
        const sessionScript = document.createElement('script');
        sessionScript.textContent = `
            window.BOURBON_SESSION = '${sessionId || ''}';
            window.BOURBON_PROXY_URL = '${this.proxyUrl}';
        `;
        head.appendChild(sessionScript);

        // Inject custom scripts
        this.customScripts.forEach(script => {
            const scriptElement = document.createElement('script');
            if (typeof script === 'string') {
                scriptElement.src = script;
            } else {
                scriptElement.textContent = script;
            }
            head.appendChild(scriptElement);
        });

        // Inject WebSocket proxy script
        const wsScript = document.createElement('script');
        wsScript.textContent = `
            (function() {
                const originalWebSocket = window.WebSocket;
                window.WebSocket = function(url, protocols) {
                    const proxyUrl = window.BOURBON_PROXY_URL + '/api/ws?url=' + encodeURIComponent(url);
                    return new originalWebSocket(proxyUrl, protocols);
                };
                window.WebSocket.prototype = originalWebSocket.prototype;
            })();
        `;
        head.appendChild(wsScript);
    }

    // Rewrite forms
    rewriteForms(document, targetUrl) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (form.action) {
                form.action = this.rewriteURL(form.action, targetUrl);
            } else {
                form.action = this.rewriteURL(targetUrl, targetUrl);
            }
        });
    }

    // Rewrite meta tags
    rewriteMetaTags(document, targetUrl) {
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(meta => {
            if (meta.content && this.isURL(meta.content)) {
                meta.content = this.rewriteURL(meta.content, targetUrl);
            }
        });
    }

    // Rewrite iframes
    rewriteIframes(document, targetUrl) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            if (iframe.src) {
                iframe.src = this.rewriteURL(iframe.src, targetUrl);
            }
        });
    }

    // Rewrite WebSocket connections
    rewriteWebSockets(document, targetUrl) {
        // This is handled in the JavaScript rewriting
    }

    // Apply custom rewrite rules
    applyCustomRules(document, targetUrl) {
        this.rewriteRules.forEach(rule => {
            if (typeof rule === 'function') {
                rule(document, targetUrl);
            } else if (rule.selector && rule.attribute) {
                const elements = document.querySelectorAll(rule.selector);
                elements.forEach(element => {
                    if (element[rule.attribute]) {
                        element[rule.attribute] = this.rewriteURL(element[rule.attribute], targetUrl);
                    }
                });
            }
        });
    }

    // Inject session management into JavaScript
    injectSessionManagement(js, sessionId) {
        const sessionCode = `
            // Session management
            if (typeof window !== 'undefined') {
                window.BOURBON_SESSION = '${sessionId}';
                
                // Override localStorage
                const originalLocalStorage = window.localStorage;
                window.localStorage = {
                    getItem: function(key) {
                        return originalLocalStorage.getItem('bourbon_' + key);
                    },
                    setItem: function(key, value) {
                        return originalLocalStorage.setItem('bourbon_' + key, value);
                    },
                    removeItem: function(key) {
                        return originalLocalStorage.removeItem('bourbon_' + key);
                    },
                    clear: function() {
                        return originalLocalStorage.clear();
                    },
                    get length() {
                        return originalLocalStorage.length;
                    },
                    key: function(index) {
                        return originalLocalStorage.key(index);
                    }
                };
            }
        `;
        
        return sessionCode + '\n' + js;
    }
}

module.exports = EnhancedRewriter;
