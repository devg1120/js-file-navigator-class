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
var oop = require("./lib/oop");
var dom = require("./lib/dom");
var event = require("./lib/event");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
dom.importCssString(".ace_editor>.ace_sb-v div, .ace_editor>.ace_sb-h div{\n  position: absolute;\n  background: rgba(128, 128, 128, 0.6);\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  border: 1px solid #bbb;\n  border-radius: 2px;\n  z-index: 8;\n}\n.ace_editor>.ace_sb-v, .ace_editor>.ace_sb-h {\n  position: absolute;\n  z-index: 6;\n  background: none;\n  overflow: hidden!important;\n}\n.ace_editor>.ace_sb-v {\n  z-index: 6;\n  right: 0;\n  top: 0;\n  width: 12px;\n}\n.ace_editor>.ace_sb-v div {\n  z-index: 8;\n  right: 0;\n  width: 100%;\n}\n.ace_editor>.ace_sb-h {\n  bottom: 0;\n  left: 0;\n  height: 12px;\n}\n.ace_editor>.ace_sb-h div {\n  bottom: 0;\n  height: 100%;\n}\n.ace_editor>.ace_sb_grabbed {\n  z-index: 8;\n  background: #000;\n}", "ace_scrollbar.css", false);
/**
 * An abstract class representing a native scrollbar control.
 **/
var ScrollBar = /** @class */ (function () {
    /**
     * Creates a new `ScrollBar`. `parent` is the owner of the scroll bar.
     * @param {Element} parent A DOM element
     * @param {string} classSuffix
     **/
    function ScrollBar(parent, classSuffix) {
        this.element = dom.createElement("div");
        this.element.className = "ace_sb" + classSuffix;
        this.inner = dom.createElement("div");
        this.inner.className = "";
        this.element.appendChild(this.inner);
        this.VScrollWidth = 12;
        this.HScrollHeight = 12;
        parent.appendChild(this.element);
        this.setVisible(false);
        this.skipEvent = false;
        event.addMultiMouseDownListener(this.element, [500, 300, 300], this, "onMouseDown");
    }
    ScrollBar.prototype.setVisible = function (isVisible) {
        this.element.style.display = isVisible ? "" : "none";
        this.isVisible = isVisible;
        this.coeff = 1;
    };
    return ScrollBar;
}());
oop.implement(ScrollBar.prototype, EventEmitter);
/**
 * Represents a vertical scroll bar.
 * @class VScrollBar
 **/
/**
 * Creates a new `VScrollBar`. `parent` is the owner of the scroll bar.
 * @param {Element} parent A DOM element
 * @param {Object} renderer An editor renderer
 *
 * @constructor
 **/
var VScrollBar = /** @class */ (function (_super) {
    __extends(VScrollBar, _super);
    function VScrollBar(parent, renderer) {
        var _this = _super.call(this, parent, '-v') || this;
        _this.scrollTop = 0;
        _this.scrollHeight = 0;
        _this.parent = parent;
        _this.width = _this.VScrollWidth;
        _this.renderer = renderer;
        _this.inner.style.width = _this.element.style.width = (_this.width || 15) + "px";
        _this.$minWidth = 0;
        return _this;
    }
    /**
     * Emitted when the scroll thumb dragged or scrollbar canvas clicked.
     **/
    VScrollBar.prototype.onMouseDown = function (eType, e) {
        if (eType !== "mousedown")
            return;
        if (event.getButton(e) !== 0 || e.detail === 2) {
            return;
        }
        if (e.target === this.inner) {
            var self = this;
            var mousePageY = e.clientY;
            var onMouseMove = function (e) {
                mousePageY = e.clientY;
            };
            var onMouseUp = function () {
                clearInterval(timerId);
            };
            var startY = e.clientY;
            var startTop = this.thumbTop;
            var onScrollInterval = function () {
                if (mousePageY === undefined)
                    return;
                var scrollTop = self.scrollTopFromThumbTop(startTop + mousePageY - startY);
                if (scrollTop === self.scrollTop)
                    return;
                self._emit("scroll", { data: scrollTop });
            };
            event.capture(this.inner, onMouseMove, onMouseUp);
            var timerId = setInterval(onScrollInterval, 20);
            return event.preventDefault(e);
        }
        var top = e.clientY - this.element.getBoundingClientRect().top - this.thumbHeight / 2;
        this._emit("scroll", { data: this.scrollTopFromThumbTop(top) });
        return event.preventDefault(e);
    };
    VScrollBar.prototype.getHeight = function () {
        return this.height;
    };
    /**
     * Returns new top for scroll thumb
     * @param {Number}thumbTop
     * @returns {Number}
     **/
    VScrollBar.prototype.scrollTopFromThumbTop = function (thumbTop) {
        var scrollTop = thumbTop * (this.pageHeight - this.viewHeight) / (this.slideHeight - this.thumbHeight);
        scrollTop = scrollTop >> 0;
        if (scrollTop < 0) {
            scrollTop = 0;
        }
        else if (scrollTop > this.pageHeight - this.viewHeight) {
            scrollTop = this.pageHeight - this.viewHeight;
        }
        return scrollTop;
    };
    /**
     * Returns the width of the scroll bar.
     * @returns {Number}
     **/
    VScrollBar.prototype.getWidth = function () {
        return Math.max(this.isVisible ? this.width : 0, this.$minWidth || 0);
    };
    /**
     * Sets the height of the scroll bar, in pixels.
     * @param {Number} height The new height
     **/
    VScrollBar.prototype.setHeight = function (height) {
        this.height = Math.max(0, height);
        this.slideHeight = this.height;
        this.viewHeight = this.height;
        this.setScrollHeight(this.pageHeight, true);
    };
    /**
     * Sets the inner and scroll height of the scroll bar, in pixels.
     * @param {Number} height The new inner height
     *
     * @param {boolean} force Forcely update height
     **/
    VScrollBar.prototype.setScrollHeight = function (height, force) {
        if (this.pageHeight === height && !force)
            return;
        this.pageHeight = height;
        this.thumbHeight = this.slideHeight * this.viewHeight / this.pageHeight;
        if (this.thumbHeight > this.slideHeight)
            this.thumbHeight = this.slideHeight;
        if (this.thumbHeight < 15)
            this.thumbHeight = 15;
        this.inner.style.height = this.thumbHeight + "px";
        if (this.scrollTop > (this.pageHeight - this.viewHeight)) {
            this.scrollTop = (this.pageHeight - this.viewHeight);
            if (this.scrollTop < 0)
                this.scrollTop = 0;
            this._emit("scroll", { data: this.scrollTop });
        }
    };
    /**
     * Sets the scroll top of the scroll bar.
     * @param {Number} scrollTop The new scroll top
     **/
    VScrollBar.prototype.setScrollTop = function (scrollTop) {
        this.scrollTop = scrollTop;
        if (scrollTop < 0)
            scrollTop = 0;
        this.thumbTop = scrollTop * (this.slideHeight - this.thumbHeight) / (this.pageHeight - this.viewHeight);
        this.inner.style.top = this.thumbTop + "px";
    };
    return VScrollBar;
}(ScrollBar));
VScrollBar.prototype.setInnerHeight = VScrollBar.prototype.setScrollHeight;
/**
 * Represents a horizontal scroll bar.
 **/
var HScrollBar = /** @class */ (function (_super) {
    __extends(HScrollBar, _super);
    /**
     * Creates a new `HScrollBar`. `parent` is the owner of the scroll bar.
     * @param {Element} parent A DOM element
     * @param {Object} renderer An editor renderer
     **/
    function HScrollBar(parent, renderer) {
        var _this = _super.call(this, parent, '-h') || this;
        _this.scrollLeft = 0;
        _this.scrollWidth = 0;
        _this.height = _this.HScrollHeight;
        _this.inner.style.height = _this.element.style.height = (_this.height || 12) + "px";
        _this.renderer = renderer;
        return _this;
    }
    /**
     * Emitted when the scroll thumb dragged or scrollbar canvas clicked.
     **/
    HScrollBar.prototype.onMouseDown = function (eType, e) {
        if (eType !== "mousedown")
            return;
        if (event.getButton(e) !== 0 || e.detail === 2) {
            return;
        }
        if (e.target === this.inner) {
            var self = this;
            var mousePageX = e.clientX;
            var onMouseMove = function (e) {
                mousePageX = e.clientX;
            };
            var onMouseUp = function () {
                clearInterval(timerId);
            };
            var startX = e.clientX;
            var startLeft = this.thumbLeft;
            var onScrollInterval = function () {
                if (mousePageX === undefined)
                    return;
                var scrollLeft = self.scrollLeftFromThumbLeft(startLeft + mousePageX - startX);
                if (scrollLeft === self.scrollLeft)
                    return;
                self._emit("scroll", { data: scrollLeft });
            };
            event.capture(this.inner, onMouseMove, onMouseUp);
            var timerId = setInterval(onScrollInterval, 20);
            return event.preventDefault(e);
        }
        var left = e.clientX - this.element.getBoundingClientRect().left - this.thumbWidth / 2;
        this._emit("scroll", { data: this.scrollLeftFromThumbLeft(left) });
        return event.preventDefault(e);
    };
    /**
     * Returns the height of the scroll bar.
     * @returns {Number}
     **/
    HScrollBar.prototype.getHeight = function () {
        return this.isVisible ? this.height : 0;
    };
    /**
     * Returns new left for scroll thumb
     * @param {Number} thumbLeft
     * @returns {Number}
     **/
    HScrollBar.prototype.scrollLeftFromThumbLeft = function (thumbLeft) {
        var scrollLeft = thumbLeft * (this.pageWidth - this.viewWidth) / (this.slideWidth - this.thumbWidth);
        scrollLeft = scrollLeft >> 0;
        if (scrollLeft < 0) {
            scrollLeft = 0;
        }
        else if (scrollLeft > this.pageWidth - this.viewWidth) {
            scrollLeft = this.pageWidth - this.viewWidth;
        }
        return scrollLeft;
    };
    /**
     * Sets the width of the scroll bar, in pixels.
     * @param {Number} width The new width
     **/
    HScrollBar.prototype.setWidth = function (width) {
        this.width = Math.max(0, width);
        this.element.style.width = this.width + "px";
        this.slideWidth = this.width;
        this.viewWidth = this.width;
        this.setScrollWidth(this.pageWidth, true);
    };
    /**
     * Sets the inner and scroll width of the scroll bar, in pixels.
     * @param {Number} width The new inner width
     * @param {boolean} force Forcely update width
     **/
    HScrollBar.prototype.setScrollWidth = function (width, force) {
        if (this.pageWidth === width && !force)
            return;
        this.pageWidth = width;
        this.thumbWidth = this.slideWidth * this.viewWidth / this.pageWidth;
        if (this.thumbWidth > this.slideWidth)
            this.thumbWidth = this.slideWidth;
        if (this.thumbWidth < 15)
            this.thumbWidth = 15;
        this.inner.style.width = this.thumbWidth + "px";
        if (this.scrollLeft > (this.pageWidth - this.viewWidth)) {
            this.scrollLeft = (this.pageWidth - this.viewWidth);
            if (this.scrollLeft < 0)
                this.scrollLeft = 0;
            this._emit("scroll", { data: this.scrollLeft });
        }
    };
    /**
     * Sets the scroll left of the scroll bar.
     * @param {Number} scrollLeft The new scroll left
     **/
    HScrollBar.prototype.setScrollLeft = function (scrollLeft) {
        this.scrollLeft = scrollLeft;
        if (scrollLeft < 0)
            scrollLeft = 0;
        this.thumbLeft = scrollLeft * (this.slideWidth - this.thumbWidth) / (this.pageWidth - this.viewWidth);
        this.inner.style.left = (this.thumbLeft) + "px";
    };
    return HScrollBar;
}(ScrollBar));
HScrollBar.prototype.setInnerWidth = HScrollBar.prototype.setScrollWidth;
exports.ScrollBar = VScrollBar; // backward compatibility
exports.ScrollBarV = VScrollBar; // backward compatibility
exports.ScrollBarH = HScrollBar; // backward compatibility
exports.VScrollBar = VScrollBar;
exports.HScrollBar = HScrollBar;

});