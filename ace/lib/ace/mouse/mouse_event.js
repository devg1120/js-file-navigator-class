define(function(require, exports, module){"use strict";
var event = require("../lib/event");
var useragent = require("../lib/useragent");
/*
 * Custom Ace mouse event
 */
var MouseEvent = /** @class */ (function () {
    function MouseEvent(domEvent, editor) {
        /** @type {number} */ this.speed;
        /** @type {number} */ this.wheelX;
        /** @type {number} */ this.wheelY;
        this.domEvent = domEvent;
        this.editor = editor;
        this.x = this.clientX = domEvent.clientX;
        this.y = this.clientY = domEvent.clientY;
        this.$pos = null;
        this.$inSelection = null;
        this.propagationStopped = false;
        this.defaultPrevented = false;
    }
    MouseEvent.prototype.stopPropagation = function () {
        event.stopPropagation(this.domEvent);
        this.propagationStopped = true;
    };
    MouseEvent.prototype.preventDefault = function () {
        event.preventDefault(this.domEvent);
        this.defaultPrevented = true;
    };
    MouseEvent.prototype.stop = function () {
        this.stopPropagation();
        this.preventDefault();
    };
    /**
     * Get the document position below the mouse cursor
     *
     * @return {Object} 'row' and 'column' of the document position
     */
    MouseEvent.prototype.getDocumentPosition = function () {
        if (this.$pos)
            return this.$pos;
        this.$pos = this.editor.renderer.screenToTextCoordinates(this.clientX, this.clientY);
        return this.$pos;
    };
    /**
     * Get the relative position within the gutter.
     *
     * @return {Number} 'row' within the gutter.
     */
    MouseEvent.prototype.getGutterRow = function () {
        var documentRow = this.getDocumentPosition().row;
        var screenRow = this.editor.session.documentToScreenRow(documentRow, 0);
        var screenTopRow = this.editor.session.documentToScreenRow(this.editor.renderer.$gutterLayer.$lines.get(0).row, 0);
        return screenRow - screenTopRow;
    };
    /**
     * Check if the mouse cursor is inside of the text selection
     *
     * @return {Boolean} whether the mouse cursor is inside of the selection
     */
    MouseEvent.prototype.inSelection = function () {
        if (this.$inSelection !== null)
            return this.$inSelection;
        var editor = this.editor;
        var selectionRange = editor.getSelectionRange();
        if (selectionRange.isEmpty())
            this.$inSelection = false;
        else {
            var pos = this.getDocumentPosition();
            this.$inSelection = selectionRange.contains(pos.row, pos.column);
        }
        return this.$inSelection;
    };
    /**
     * Get the clicked mouse button
     *
     * @return {Number} 0 for left button, 1 for middle button, 2 for right button
     */
    MouseEvent.prototype.getButton = function () {
        return event.getButton(this.domEvent);
    };
    /**
     * @return {Boolean} whether the shift key was pressed when the event was emitted
     */
    MouseEvent.prototype.getShiftKey = function () {
        return this.domEvent.shiftKey;
    };
    MouseEvent.prototype.getAccelKey = function () {
        return useragent.isMac ? this.domEvent.metaKey : this.domEvent.ctrlKey;
    };
    return MouseEvent;
}());
exports.MouseEvent = MouseEvent;

});