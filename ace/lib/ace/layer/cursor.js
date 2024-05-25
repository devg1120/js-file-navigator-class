define(function(require, exports, module){"use strict";
/**
 * @typedef {import("../edit_session").EditSession} EditSession
 */
var dom = require("../lib/dom");
var Cursor = /** @class */ (function () {
    /**
     * @param {HTMLElement} parentEl
     */
    function Cursor(parentEl) {
        this.element = dom.createElement("div");
        this.element.className = "ace_layer ace_cursor-layer";
        parentEl.appendChild(this.element);
        this.isVisible = false;
        this.isBlinking = true;
        this.blinkInterval = 1000;
        this.smoothBlinking = false;
        this.cursors = [];
        this.cursor = this.addCursor();
        dom.addCssClass(this.element, "ace_hidden-cursors");
        this.$updateCursors = this.$updateOpacity.bind(this);
    }
    /**
     * @param {boolean} [val]
     */
    Cursor.prototype.$updateOpacity = function (val) {
        var cursors = this.cursors;
        for (var i = cursors.length; i--;)
            dom.setStyle(cursors[i].style, "opacity", val ? "" : "0");
    };
    Cursor.prototype.$startCssAnimation = function () {
        var cursors = this.cursors;
        for (var i = cursors.length; i--;)
            cursors[i].style.animationDuration = this.blinkInterval + "ms";
        this.$isAnimating = true;
        setTimeout(function () {
            if (this.$isAnimating) {
                dom.addCssClass(this.element, "ace_animate-blinking");
            }
        }.bind(this));
    };
    Cursor.prototype.$stopCssAnimation = function () {
        this.$isAnimating = false;
        dom.removeCssClass(this.element, "ace_animate-blinking");
    };
    /**
     * @param {number} padding
     */
    Cursor.prototype.setPadding = function (padding) {
        this.$padding = padding;
    };
    /**
     * @param {EditSession} session
     */
    Cursor.prototype.setSession = function (session) {
        this.session = session;
    };
    /**
     * @param {boolean} blinking
     */
    Cursor.prototype.setBlinking = function (blinking) {
        if (blinking != this.isBlinking) {
            this.isBlinking = blinking;
            this.restartTimer();
        }
    };
    /**
     * @param {number} blinkInterval
     */
    Cursor.prototype.setBlinkInterval = function (blinkInterval) {
        if (blinkInterval != this.blinkInterval) {
            this.blinkInterval = blinkInterval;
            this.restartTimer();
        }
    };
    /**
     * @param {boolean} smoothBlinking
     */
    Cursor.prototype.setSmoothBlinking = function (smoothBlinking) {
        if (smoothBlinking != this.smoothBlinking) {
            this.smoothBlinking = smoothBlinking;
            dom.setCssClass(this.element, "ace_smooth-blinking", smoothBlinking);
            this.$updateCursors(true);
            this.restartTimer();
        }
    };
    Cursor.prototype.addCursor = function () {
        var el = dom.createElement("div");
        el.className = "ace_cursor";
        this.element.appendChild(el);
        this.cursors.push(el);
        return el;
    };
    Cursor.prototype.removeCursor = function () {
        if (this.cursors.length > 1) {
            var el = this.cursors.pop();
            el.parentNode.removeChild(el);
            return el;
        }
    };
    Cursor.prototype.hideCursor = function () {
        this.isVisible = false;
        dom.addCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    };
    Cursor.prototype.showCursor = function () {
        this.isVisible = true;
        dom.removeCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    };
    Cursor.prototype.restartTimer = function () {
        var update = this.$updateCursors;
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
        this.$stopCssAnimation();
        if (this.smoothBlinking) {
            this.$isSmoothBlinking = false;
            dom.removeCssClass(this.element, "ace_smooth-blinking");
        }
        update(true);
        if (!this.isBlinking || !this.blinkInterval || !this.isVisible) {
            this.$stopCssAnimation();
            return;
        }
        if (this.smoothBlinking) {
            this.$isSmoothBlinking = true;
            setTimeout(function () {
                if (this.$isSmoothBlinking) {
                    dom.addCssClass(this.element, "ace_smooth-blinking");
                }
            }.bind(this));
        }
        if (dom.HAS_CSS_ANIMATION) {
            this.$startCssAnimation();
        }
        else {
            var blink = /**@this{Cursor}*/ function () {
                this.timeoutId = setTimeout(function () {
                    update(false);
                }, 0.6 * this.blinkInterval);
            }.bind(this);
            this.intervalId = setInterval(function () {
                update(true);
                blink();
            }, this.blinkInterval);
            blink();
        }
    };
    /**
     * @param {import("../../ace-internal").Ace.Point} [position]
     * @param {boolean} [onScreen]
     */
    Cursor.prototype.getPixelPosition = function (position, onScreen) {
        if (!this.config || !this.session)
            return { left: 0, top: 0 };
        if (!position)
            position = this.session.selection.getCursor();
        var pos = this.session.documentToScreenPosition(position);
        var cursorLeft = this.$padding + (this.session.$bidiHandler.isBidiRow(pos.row, position.row)
            ? this.session.$bidiHandler.getPosLeft(pos.column)
            : pos.column * this.config.characterWidth);
        var cursorTop = (pos.row - (onScreen ? this.config.firstRowScreen : 0)) *
            this.config.lineHeight;
        return { left: cursorLeft, top: cursorTop };
    };
    Cursor.prototype.isCursorInView = function (pixelPos, config) {
        return pixelPos.top >= 0 && pixelPos.top < config.maxHeight;
    };
    Cursor.prototype.update = function (config) {
        this.config = config;
        var selections = this.session.$selectionMarkers;
        var i = 0, cursorIndex = 0;
        if (selections === undefined || selections.length === 0) {
            selections = [{ cursor: null }];
        }
        for (var i = 0, n = selections.length; i < n; i++) {
            var pixelPos = this.getPixelPosition(selections[i].cursor, true);
            if ((pixelPos.top > config.height + config.offset ||
                pixelPos.top < 0) && i > 1) {
                continue;
            }
            var element = this.cursors[cursorIndex++] || this.addCursor();
            var style = element.style;
            if (!this.drawCursor) {
                if (!this.isCursorInView(pixelPos, config)) {
                    dom.setStyle(style, "display", "none");
                }
                else {
                    dom.setStyle(style, "display", "block");
                    dom.translate(element, pixelPos.left, pixelPos.top);
                    dom.setStyle(style, "width", Math.round(config.characterWidth) + "px");
                    dom.setStyle(style, "height", config.lineHeight + "px");
                }
            }
            else {
                this.drawCursor(element, pixelPos, config, selections[i], this.session);
            }
        }
        while (this.cursors.length > cursorIndex)
            this.removeCursor();
        var overwrite = this.session.getOverwrite();
        this.$setOverwrite(overwrite);
        // cache for textarea and gutter highlight
        this.$pixelPos = pixelPos;
        this.restartTimer();
    };
    /**
     * @param {boolean} overwrite
     */
    Cursor.prototype.$setOverwrite = function (overwrite) {
        if (overwrite != this.overwrite) {
            this.overwrite = overwrite;
            if (overwrite)
                dom.addCssClass(this.element, "ace_overwrite-cursors");
            else
                dom.removeCssClass(this.element, "ace_overwrite-cursors");
        }
    };
    Cursor.prototype.destroy = function () {
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
    };
    return Cursor;
}());
Cursor.prototype.$padding = 0;
Cursor.prototype.drawCursor = null;
exports.Cursor = Cursor;

});