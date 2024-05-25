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
// on ie maximal element height is smaller than what we get from 4-5K line document
// so scrollbar doesn't work, as a workaround we do not set height higher than MAX_SCROLL_H
// and rescale scrolltop
var MAX_SCROLL_H = 0x8000;
/**
 * An abstract class representing a native scrollbar control.
 **/
var Scrollbar = /** @class */ (function () {
    /**
     * Creates a new `ScrollBar`. `parent` is the owner of the scroll bar.
     * @param {Element} parent A DOM element
     * @param {string} classSuffix
     **/
    function Scrollbar(parent, classSuffix) {
        this.element = dom.createElement("div");
        this.element.className = "ace_scrollbar ace_scrollbar" + classSuffix;
        this.inner = dom.createElement("div");
        this.inner.className = "ace_scrollbar-inner";
        // on safari scrollbar is not shown for empty elements
        this.inner.textContent = "\xa0";
        this.element.appendChild(this.inner);
        parent.appendChild(this.element);
        this.setVisible(false);
        this.skipEvent = false;
        // @ts-expect-error
        event.addListener(this.element, "scroll", this.onScroll.bind(this));
        event.addListener(this.element, "mousedown", event.preventDefault);
    }
    Scrollbar.prototype.setVisible = function (isVisible) {
        this.element.style.display = isVisible ? "" : "none";
        this.isVisible = isVisible;
        this.coeff = 1;
    };
    return Scrollbar;
}());
oop.implement(Scrollbar.prototype, EventEmitter);
/**
 * Represents a vertical scroll bar.
 **/
var VScrollBar = /** @class */ (function (_super) {
    __extends(VScrollBar, _super);
    /**
     * Creates a new `VScrollBar`. `parent` is the owner of the scroll bar.
     * @param {Element} parent A DOM element
     * @param {Object} renderer An editor renderer
     **/
    function VScrollBar(parent, renderer) {
        var _this = _super.call(this, parent, '-v') || this;
        _this.scrollTop = 0;
        _this.scrollHeight = 0;
        // in OSX lion the scrollbars appear to have no width. In this case resize the
        // element to show the scrollbar but still pretend that the scrollbar has a width
        // of 0px
        // in Firefox 6+ scrollbar is hidden if element has the same width as scrollbar
        // make element a little bit wider to retain scrollbar when page is zoomed 
        renderer.$scrollbarWidth =
            _this.width = dom.scrollbarWidth(parent.ownerDocument);
        _this.inner.style.width =
            _this.element.style.width = (_this.width || 15) + 5 + "px";
        _this.$minWidth = 0;
        return _this;
    }
    /**
     * Emitted when the scroll bar, well, scrolls.
     * @event scroll
     **/
    VScrollBar.prototype.onScroll = function () {
        if (!this.skipEvent) {
            this.scrollTop = this.element.scrollTop;
            if (this.coeff != 1) {
                var h = this.element.clientHeight / this.scrollHeight;
                this.scrollTop = this.scrollTop * (1 - h) / (this.coeff - h);
            }
            this._emit("scroll", { data: this.scrollTop });
        }
        this.skipEvent = false;
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
        this.element.style.height = height + "px";
    };
    /**
     * Sets the scroll height of the scroll bar, in pixels.
     * @param {Number} height The new scroll height
     **/
    VScrollBar.prototype.setScrollHeight = function (height) {
        this.scrollHeight = height;
        if (height > MAX_SCROLL_H) {
            this.coeff = MAX_SCROLL_H / height;
            height = MAX_SCROLL_H;
        }
        else if (this.coeff != 1) {
            this.coeff = 1;
        }
        this.inner.style.height = height + "px";
    };
    /**
     * Sets the scroll top of the scroll bar.
     * @param {Number} scrollTop The new scroll top
     **/
    VScrollBar.prototype.setScrollTop = function (scrollTop) {
        // on chrome 17+ for small zoom levels after calling this function
        // this.element.scrollTop != scrollTop which makes page to scroll up.
        if (this.scrollTop != scrollTop) {
            this.skipEvent = true;
            this.scrollTop = scrollTop;
            this.element.scrollTop = scrollTop * this.coeff;
        }
    };
    return VScrollBar;
}(Scrollbar));
/**
 * Sets the inner height of the scroll bar, in pixels.
 * @param {Number} height The new inner height
 * @deprecated Use setScrollHeight instead
 **/
VScrollBar.prototype.setInnerHeight = VScrollBar.prototype.setScrollHeight;
/**
 * Represents a horisontal scroll bar.
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
        // in OSX lion the scrollbars appear to have no width. In this case resize the
        // element to show the scrollbar but still pretend that the scrollbar has a width
        // of 0px
        // in Firefox 6+ scrollbar is hidden if element has the same width as scrollbar
        // make element a little bit wider to retain scrollbar when page is zoomed 
        _this.height = renderer.$scrollbarWidth;
        _this.inner.style.height =
            _this.element.style.height = (_this.height || 15) + 5 + "px";
        return _this;
    }
    /**
     * Emitted when the scroll bar, well, scrolls.
     * @event scroll
     **/
    HScrollBar.prototype.onScroll = function () {
        if (!this.skipEvent) {
            this.scrollLeft = this.element.scrollLeft;
            this._emit("scroll", { data: this.scrollLeft });
        }
        this.skipEvent = false;
    };
    /**
     * Returns the height of the scroll bar.
     * @returns {Number}
     **/
    HScrollBar.prototype.getHeight = function () {
        return this.isVisible ? this.height : 0;
    };
    /**
     * Sets the width of the scroll bar, in pixels.
     * @param {Number} width The new width
     **/
    HScrollBar.prototype.setWidth = function (width) {
        this.element.style.width = width + "px";
    };
    /**
     * Sets the inner width of the scroll bar, in pixels.
     * @param {Number} width The new inner width
     * @deprecated Use setScrollWidth instead
     **/
    HScrollBar.prototype.setInnerWidth = function (width) {
        this.inner.style.width = width + "px";
    };
    /**
     * Sets the scroll width of the scroll bar, in pixels.
     * @param {Number} width The new scroll width
     **/
    HScrollBar.prototype.setScrollWidth = function (width) {
        this.inner.style.width = width + "px";
    };
    /**
     * Sets the scroll left of the scroll bar.
     * @param {Number} scrollLeft The new scroll left
     **/
    HScrollBar.prototype.setScrollLeft = function (scrollLeft) {
        // on chrome 17+ for small zoom levels after calling this function
        // this.element.scrollTop != scrollTop which makes page to scroll up.
        if (this.scrollLeft != scrollLeft) {
            this.skipEvent = true;
            this.scrollLeft = this.element.scrollLeft = scrollLeft;
        }
    };
    return HScrollBar;
}(Scrollbar));
exports.ScrollBar = VScrollBar; // backward compatibility
exports.ScrollBarV = VScrollBar; // backward compatibility
exports.ScrollBarH = HScrollBar; // backward compatibility
exports.VScrollBar = VScrollBar;
exports.HScrollBar = HScrollBar;

});