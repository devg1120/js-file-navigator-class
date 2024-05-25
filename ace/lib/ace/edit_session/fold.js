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
/**
 * @typedef {import("./fold_line").FoldLine} FoldLine
 * @typedef {import("../range").Range} Range
 * @typedef {import("../../ace-internal").Ace.Point} Point
 * @typedef {import("../../ace-internal").Ace.IRange} IRange
 */
var RangeList = require("../range_list").RangeList;
/*
 * Simple fold-data struct.
 **/
var Fold = /** @class */ (function (_super) {
    __extends(Fold, _super);
    /**
     * @param {Range} range
     * @param {any} placeholder
     */
    function Fold(range, placeholder) {
        var _this = _super.call(this) || this;
        _this.foldLine = null;
        _this.placeholder = placeholder;
        _this.range = range;
        _this.start = range.start;
        _this.end = range.end;
        _this.sameRow = range.start.row == range.end.row;
        /**@type {Fold[]}*/
        _this.subFolds = _this.ranges = [];
        return _this;
    }
    Fold.prototype.toString = function () {
        return '"' + this.placeholder + '" ' + this.range.toString();
    };
    /**
     * @param {FoldLine} foldLine
     */
    Fold.prototype.setFoldLine = function (foldLine) {
        this.foldLine = foldLine;
        this.subFolds.forEach(function (fold) {
            fold.setFoldLine(foldLine);
        });
    };
    Fold.prototype.clone = function () {
        var range = this.range.clone();
        var fold = new Fold(range, this.placeholder);
        this.subFolds.forEach(function (subFold) {
            fold.subFolds.push(subFold.clone());
        });
        fold.collapseChildren = this.collapseChildren;
        return fold;
    };
    /**
     * @param {Fold} fold
     */
    Fold.prototype.addSubFold = function (fold) {
        if (this.range.isEqual(fold))
            return;
        // transform fold to local coordinates
        consumeRange(fold, this.start);
        var row = fold.start.row, column = fold.start.column;
        for (var i = 0, cmp = -1; i < this.subFolds.length; i++) {
            cmp = this.subFolds[i].range.compare(row, column);
            if (cmp != 1)
                break;
        }
        var afterStart = this.subFolds[i];
        var firstConsumed = 0;
        if (cmp == 0) {
            if (afterStart.range.containsRange(fold))
                return afterStart.addSubFold(fold);
            else
                firstConsumed = 1;
        }
        // cmp == -1
        var row = fold.range.end.row, column = fold.range.end.column;
        for (var j = i, cmp = -1; j < this.subFolds.length; j++) {
            cmp = this.subFolds[j].range.compare(row, column);
            if (cmp != 1)
                break;
        }
        if (cmp == 0)
            j++;
        var consumedFolds = this.subFolds.splice(i, j - i, fold);
        var last = cmp == 0 ? consumedFolds.length - 1 : consumedFolds.length;
        for (var k = firstConsumed; k < last; k++) {
            fold.addSubFold(consumedFolds[k]);
        }
        fold.setFoldLine(this.foldLine);
        return fold;
    };
    /**
     * @param {IRange} range
     */
    Fold.prototype.restoreRange = function (range) {
        return restoreRange(range, this.start);
    };
    return Fold;
}(RangeList));
/**
 * @param {Point} point
 * @param {Point} anchor
 */
function consumePoint(point, anchor) {
    point.row -= anchor.row;
    if (point.row == 0)
        point.column -= anchor.column;
}
/**
 * @param {IRange} range
 * @param {Point} anchor
 */
function consumeRange(range, anchor) {
    consumePoint(range.start, anchor);
    consumePoint(range.end, anchor);
}
/**
 * @param {Point} point
 * @param {Point} anchor
 */
function restorePoint(point, anchor) {
    if (point.row == 0)
        point.column += anchor.column;
    point.row += anchor.row;
}
/**
 * @param {IRange} range
 * @param {Point} anchor
 */
function restoreRange(range, anchor) {
    restorePoint(range.start, anchor);
    restorePoint(range.end, anchor);
}
exports.Fold = Fold;

});