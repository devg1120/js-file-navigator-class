define(function(require, exports, module){"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
/**
 * @typedef {import("./editor").Editor} Editor
 * @typedef {import("./mouse/mouse_event").MouseEvent} MouseEvent
 * @typedef {import("./edit_session").EditSession} EditSession
 */
var dom = require("./lib/dom");
var event = require("./lib/event");
var Range = require("./range").Range;
var preventParentScroll = require("./lib/scroll").preventParentScroll;
var CLASSNAME = "ace_tooltip";
var Tooltip = /** @class */ (function () {
    /**
     * @param {Element} parentNode
     **/
    function Tooltip(parentNode) {
        this.isOpen = false;
        this.$element = null;
        this.$parentNode = parentNode;
    }
    Tooltip.prototype.$init = function () {
        this.$element = dom.createElement("div");
        this.$element.className = CLASSNAME;
        this.$element.style.display = "none";
        this.$parentNode.appendChild(this.$element);
        return this.$element;
    };
    /**
     * @returns {HTMLElement}
     **/
    Tooltip.prototype.getElement = function () {
        return this.$element || this.$init();
    };
    /**
     * @param {String} text
     **/
    Tooltip.prototype.setText = function (text) {
        this.getElement().textContent = text;
    };
    /**
     * @param {String} html
     **/
    Tooltip.prototype.setHtml = function (html) {
        this.getElement().innerHTML = html;
    };
    /**
     * @param {Number} x
     * @param {Number} y
     **/
    Tooltip.prototype.setPosition = function (x, y) {
        this.getElement().style.left = x + "px";
        this.getElement().style.top = y + "px";
    };
    /**
     * @param {String} className
     **/
    Tooltip.prototype.setClassName = function (className) {
        dom.addCssClass(this.getElement(), className);
    };
    /**
     * @param {import("../ace-internal").Ace.Theme} theme
     */
    Tooltip.prototype.setTheme = function (theme) {
        this.$element.className = CLASSNAME + " " +
            (theme.isDark ? "ace_dark " : "") + (theme.cssClass || "");
    };
    /**
     * @param {String} [text]
     * @param {Number} [x]
     * @param {Number} [y]
     **/
    Tooltip.prototype.show = function (text, x, y) {
        if (text != null)
            this.setText(text);
        if (x != null && y != null)
            this.setPosition(x, y);
        if (!this.isOpen) {
            this.getElement().style.display = "block";
            this.isOpen = true;
        }
    };
    Tooltip.prototype.hide = function (e) {
        if (this.isOpen) {
            this.getElement().style.display = "none";
            this.getElement().className = CLASSNAME;
            this.isOpen = false;
        }
    };
    /**
     * @returns {Number}
     **/
    Tooltip.prototype.getHeight = function () {
        return this.getElement().offsetHeight;
    };
    /**
     * @returns {Number}
     **/
    Tooltip.prototype.getWidth = function () {
        return this.getElement().offsetWidth;
    };
    Tooltip.prototype.destroy = function () {
        this.isOpen = false;
        if (this.$element && this.$element.parentNode) {
            this.$element.parentNode.removeChild(this.$element);
        }
    };
    return Tooltip;
}());
var PopupManager = /** @class */ (function () {
    function PopupManager() {
        /**@type{Tooltip[]} */
        this.popups = [];
    }
    /**
     * @param {Tooltip} popup
     */
    PopupManager.prototype.addPopup = function (popup) {
        this.popups.push(popup);
        this.updatePopups();
    };
    /**
     * @param {Tooltip} popup
     */
    PopupManager.prototype.removePopup = function (popup) {
        var index = this.popups.indexOf(popup);
        if (index !== -1) {
            this.popups.splice(index, 1);
            this.updatePopups();
        }
    };
    PopupManager.prototype.updatePopups = function () {
        var e_1, _a, e_2, _b;
        // @ts-expect-error TODO: could be actually an error
        this.popups.sort(function (a, b) { return b.priority - a.priority; });
        var visiblepopups = [];
        try {
            for (var _c = __values(this.popups), _d = _c.next(); !_d.done; _d = _c.next()) {
                var popup = _d.value;
                var shouldDisplay = true;
                try {
                    for (var visiblepopups_1 = (e_2 = void 0, __values(visiblepopups)), visiblepopups_1_1 = visiblepopups_1.next(); !visiblepopups_1_1.done; visiblepopups_1_1 = visiblepopups_1.next()) {
                        var visiblePopup = visiblepopups_1_1.value;
                        if (this.doPopupsOverlap(visiblePopup, popup)) {
                            shouldDisplay = false;
                            break;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (visiblepopups_1_1 && !visiblepopups_1_1.done && (_b = visiblepopups_1.return)) _b.call(visiblepopups_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                if (shouldDisplay) {
                    visiblepopups.push(popup);
                }
                else {
                    popup.hide();
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * @param {Tooltip} popupA
     * @param {Tooltip} popupB
     * @return {boolean}
     */
    PopupManager.prototype.doPopupsOverlap = function (popupA, popupB) {
        var rectA = popupA.getElement().getBoundingClientRect();
        var rectB = popupB.getElement().getBoundingClientRect();
        return (rectA.left < rectB.right && rectA.right > rectB.left && rectA.top < rectB.bottom && rectA.bottom
            > rectB.top);
    };
    return PopupManager;
}());
var popupManager = new PopupManager();
exports.popupManager = popupManager;
exports.Tooltip = Tooltip;
var HoverTooltip = /** @class */ (function (_super) {
    __extends(HoverTooltip, _super);
    function HoverTooltip(parentNode) {
        if (parentNode === void 0) { parentNode = document.body; }
        var _this = _super.call(this, parentNode) || this;
        _this.timeout = undefined;
        _this.lastT = 0;
        _this.idleTime = 350;
        _this.lastEvent = undefined;
        _this.onMouseOut = _this.onMouseOut.bind(_this);
        _this.onMouseMove = _this.onMouseMove.bind(_this);
        _this.waitForHover = _this.waitForHover.bind(_this);
        _this.hide = _this.hide.bind(_this);
        var el = _this.getElement();
        el.style.whiteSpace = "pre-wrap";
        el.style.pointerEvents = "auto";
        el.addEventListener("mouseout", _this.onMouseOut);
        el.tabIndex = -1;
        el.addEventListener("blur", function () {
            if (!el.contains(document.activeElement))
                this.hide();
        }.bind(_this));
        el.addEventListener("wheel", preventParentScroll);
        return _this;
    }
    /**
     * @param {Editor} editor
     */
    HoverTooltip.prototype.addToEditor = function (editor) {
        editor.on("mousemove", this.onMouseMove);
        editor.on("mousedown", this.hide);
        editor.renderer.getMouseEventTarget().addEventListener("mouseout", this.onMouseOut, true);
    };
    /**
     * @param {Editor} editor
     */
    HoverTooltip.prototype.removeFromEditor = function (editor) {
        editor.off("mousemove", this.onMouseMove);
        editor.off("mousedown", this.hide);
        editor.renderer.getMouseEventTarget().removeEventListener("mouseout", this.onMouseOut, true);
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    };
    /**
     * @param {MouseEvent} e
     * @param {Editor} editor
     */
    HoverTooltip.prototype.onMouseMove = function (e, editor) {
        this.lastEvent = e;
        this.lastT = Date.now();
        var isMousePressed = editor.$mouseHandler.isMousePressed;
        if (this.isOpen) {
            var pos = this.lastEvent && this.lastEvent.getDocumentPosition();
            if (!this.range
                || !this.range.contains(pos.row, pos.column)
                || isMousePressed
                || this.isOutsideOfText(this.lastEvent)) {
                this.hide();
            }
        }
        if (this.timeout || isMousePressed)
            return;
        this.lastEvent = e;
        this.timeout = setTimeout(this.waitForHover, this.idleTime);
    };
    HoverTooltip.prototype.waitForHover = function () {
        if (this.timeout)
            clearTimeout(this.timeout);
        var dt = Date.now() - this.lastT;
        if (this.idleTime - dt > 10) {
            this.timeout = setTimeout(this.waitForHover, this.idleTime - dt);
            return;
        }
        this.timeout = null;
        if (this.lastEvent && !this.isOutsideOfText(this.lastEvent)) {
            this.$gatherData(this.lastEvent, this.lastEvent.editor);
        }
    };
    /**
     * @param {MouseEvent} e
     */
    HoverTooltip.prototype.isOutsideOfText = function (e) {
        var editor = e.editor;
        var docPos = e.getDocumentPosition();
        var line = editor.session.getLine(docPos.row);
        if (docPos.column == line.length) {
            var screenPos = editor.renderer.pixelToScreenCoordinates(e.clientX, e.clientY);
            var clippedPos = editor.session.documentToScreenPosition(docPos.row, docPos.column);
            if (clippedPos.column != screenPos.column
                || clippedPos.row != screenPos.row) {
                return true;
            }
        }
        return false;
    };
    /**
     * @param {any} value
     */
    HoverTooltip.prototype.setDataProvider = function (value) {
        this.$gatherData = value;
    };
    /**
     * @param {Editor} editor
     * @param {Range} range
     * @param {any} domNode
     * @param {MouseEvent} startingEvent
     */
    HoverTooltip.prototype.showForRange = function (editor, range, domNode, startingEvent) {
        var MARGIN = 10;
        if (startingEvent && startingEvent != this.lastEvent)
            return;
        if (this.isOpen && document.activeElement == this.getElement())
            return;
        var renderer = editor.renderer;
        if (!this.isOpen) {
            popupManager.addPopup(this);
            this.$registerCloseEvents();
            this.setTheme(renderer.theme);
        }
        this.isOpen = true;
        this.addMarker(range, editor.session);
        this.range = Range.fromPoints(range.start, range.end);
        var position = renderer.textToScreenCoordinates(range.start.row, range.start.column);
        var rect = renderer.scroller.getBoundingClientRect();
        // clip position to visible area of the editor
        if (position.pageX < rect.left)
            position.pageX = rect.left;
        var element = this.getElement();
        element.innerHTML = "";
        element.appendChild(domNode);
        element.style.maxHeight = "";
        element.style.display = "block";
        // measure the size of tooltip, without constraints on its height
        var labelHeight = element.clientHeight;
        var labelWidth = element.clientWidth;
        var spaceBelow = window.innerHeight - position.pageY - renderer.lineHeight;
        // if tooltip fits above the line, or space below the line is smaller, show tooltip above
        var isAbove = true;
        if (position.pageY - labelHeight < 0 && position.pageY < spaceBelow) {
            isAbove = false;
        }
        element.style.maxHeight = (isAbove ? position.pageY : spaceBelow) - MARGIN + "px";
        element.style.top = isAbove ? "" : position.pageY + renderer.lineHeight + "px";
        element.style.bottom = isAbove ? window.innerHeight - position.pageY + "px" : "";
        // try to align tooltip left with the range, but keep it on screen
        element.style.left = Math.min(position.pageX, window.innerWidth - labelWidth - MARGIN) + "px";
    };
    /**
     * @param {Range} range
     * @param {EditSession} [session]
     */
    HoverTooltip.prototype.addMarker = function (range, session) {
        if (this.marker) {
            this.$markerSession.removeMarker(this.marker);
        }
        this.$markerSession = session;
        this.marker = session && session.addMarker(range, "ace_highlight-marker", "text");
    };
    HoverTooltip.prototype.hide = function (e) {
        if (!e && document.activeElement == this.getElement())
            return;
        if (e && e.target && (e.type != "keydown" || e.ctrlKey || e.metaKey) && this.$element.contains(e.target))
            return;
        this.lastEvent = null;
        if (this.timeout)
            clearTimeout(this.timeout);
        this.timeout = null;
        this.addMarker(null);
        if (this.isOpen) {
            this.$removeCloseEvents();
            this.getElement().style.display = "none";
            this.isOpen = false;
            popupManager.removePopup(this);
        }
    };
    HoverTooltip.prototype.$registerCloseEvents = function () {
        window.addEventListener("keydown", this.hide, true);
        window.addEventListener("wheel", this.hide, true);
        window.addEventListener("mousedown", this.hide, true);
    };
    HoverTooltip.prototype.$removeCloseEvents = function () {
        window.removeEventListener("keydown", this.hide, true);
        window.removeEventListener("wheel", this.hide, true);
        window.removeEventListener("mousedown", this.hide, true);
    };
    HoverTooltip.prototype.onMouseOut = function (e) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.lastEvent = null;
        if (!this.isOpen)
            return;
        if (!e.relatedTarget || this.getElement().contains(e.relatedTarget))
            return;
        if (e && e.currentTarget.contains(e.relatedTarget))
            return;
        if (!e.relatedTarget.classList.contains("ace_content"))
            this.hide();
    };
    return HoverTooltip;
}(Tooltip));
exports.HoverTooltip = HoverTooltip;

});