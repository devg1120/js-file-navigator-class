define(function(require, exports, module){"use strict";
/**
 * @typedef {import("../edit_session").EditSession} EditSession
 * @typedef {import("../../ace-internal").Ace.LayerConfig} LayerConfig
 */
var dom = require("../lib/dom");
var Lines = /** @class */ (function () {
    /**
     * @param {HTMLElement} element
     * @param {number} [canvasHeight]
     */
    function Lines(element, canvasHeight) {
        this.element = element;
        this.canvasHeight = canvasHeight || 500000;
        this.element.style.height = (this.canvasHeight * 2) + "px";
        this.cells = [];
        this.cellCache = [];
        this.$offsetCoefficient = 0;
    }
    /**
     * @param {LayerConfig} config
     */
    Lines.prototype.moveContainer = function (config) {
        dom.translate(this.element, 0, -((config.firstRowScreen * config.lineHeight) % this.canvasHeight) - config.offset * this.$offsetCoefficient);
    };
    /**
     * @param {LayerConfig} oldConfig
     * @param {LayerConfig} newConfig
     */
    Lines.prototype.pageChanged = function (oldConfig, newConfig) {
        return (Math.floor((oldConfig.firstRowScreen * oldConfig.lineHeight) / this.canvasHeight) !==
            Math.floor((newConfig.firstRowScreen * newConfig.lineHeight) / this.canvasHeight));
    };
    /**
     * @param {number} row
     * @param {Partial<LayerConfig>} config
     * @param {EditSession} session
     */
    Lines.prototype.computeLineTop = function (row, config, session) {
        var screenTop = config.firstRowScreen * config.lineHeight;
        var screenPage = Math.floor(screenTop / this.canvasHeight);
        var lineTop = session.documentToScreenRow(row, 0) * config.lineHeight;
        return lineTop - (screenPage * this.canvasHeight);
    };
    /**
     * @param {number} row
     * @param {LayerConfig} config
     * @param {EditSession} session
     */
    Lines.prototype.computeLineHeight = function (row, config, session) {
        return config.lineHeight * session.getRowLineCount(row);
    };
    Lines.prototype.getLength = function () {
        return this.cells.length;
    };
    /**
     * @param {number} index
     */
    Lines.prototype.get = function (index) {
        return this.cells[index];
    };
    Lines.prototype.shift = function () {
        this.$cacheCell(this.cells.shift());
    };
    Lines.prototype.pop = function () {
        this.$cacheCell(this.cells.pop());
    };
    Lines.prototype.push = function (cell) {
        if (Array.isArray(cell)) {
            this.cells.push.apply(this.cells, cell);
            var fragment = dom.createFragment(this.element);
            for (var i = 0; i < cell.length; i++) {
                fragment.appendChild(cell[i].element);
            }
            this.element.appendChild(fragment);
        }
        else {
            this.cells.push(cell);
            this.element.appendChild(cell.element);
        }
    };
    Lines.prototype.unshift = function (cell) {
        if (Array.isArray(cell)) {
            this.cells.unshift.apply(this.cells, cell);
            var fragment = dom.createFragment(this.element);
            for (var i = 0; i < cell.length; i++) {
                fragment.appendChild(cell[i].element);
            }
            if (this.element.firstChild)
                this.element.insertBefore(fragment, this.element.firstChild);
            else
                this.element.appendChild(fragment);
        }
        else {
            this.cells.unshift(cell);
            this.element.insertAdjacentElement("afterbegin", cell.element);
        }
    };
    Lines.prototype.last = function () {
        if (this.cells.length)
            return this.cells[this.cells.length - 1];
        else
            return null;
    };
    Lines.prototype.$cacheCell = function (cell) {
        if (!cell)
            return;
        cell.element.remove();
        this.cellCache.push(cell);
    };
    Lines.prototype.createCell = function (row, config, session, initElement) {
        var cell = this.cellCache.pop();
        if (!cell) {
            var element = dom.createElement("div");
            if (initElement)
                initElement(element);
            this.element.appendChild(element);
            cell = {
                element: element,
                text: "",
                row: row
            };
        }
        cell.row = row;
        return cell;
    };
    return Lines;
}());
exports.Lines = Lines;

});