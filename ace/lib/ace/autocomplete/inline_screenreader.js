define(function(require, exports, module){"use strict";
/**
 * This object is used to communicate inline code completions rendered into an editor with ghost text to screen reader users.
 */
var AceInlineScreenReader = /** @class */ (function () {
    /**
     * Creates the off-screen div in which the ghost text content in redered and which the screen reader reads.
     * @param {import("../editor").Editor} editor
     */
    function AceInlineScreenReader(editor) {
        this.editor = editor;
        this.screenReaderDiv = document.createElement("div");
        this.screenReaderDiv.classList.add("ace_screenreader-only");
        this.editor.container.appendChild(this.screenReaderDiv);
    }
    /**
     * Set the ghost text content to the screen reader div
     * @param {string} content
     */
    AceInlineScreenReader.prototype.setScreenReaderContent = function (content) {
        // Path for when inline preview is used with 'normal' completion popup.
        if (!this.popup && this.editor.completer && /**@type{import("../autocomplete").Autocomplete}*/ (this.editor.completer).popup) {
            this.popup = /**@type{import("../autocomplete").Autocomplete}*/ (this.editor.completer).popup;
            this.popup.renderer.on("afterRender", function () {
                var row = this.popup.getRow();
                var t = this.popup.renderer.$textLayer;
                var selected = t.element.childNodes[row - t.config.firstRow];
                if (selected) {
                    var idString = "doc-tooltip ";
                    for (var lineIndex = 0; lineIndex < this._lines.length; lineIndex++) {
                        idString += "ace-inline-screenreader-line-".concat(lineIndex, " ");
                    }
                    selected.setAttribute("aria-describedby", idString);
                }
            }.bind(this));
        }
        // TODO: Path for when special inline completion popup is used.
        // https://github.com/ajaxorg/ace/issues/5348
        // Remove all children of the div
        while (this.screenReaderDiv.firstChild) {
            this.screenReaderDiv.removeChild(this.screenReaderDiv.firstChild);
        }
        this._lines = content.split(/\r\n|\r|\n/);
        var codeElement = this.createCodeBlock();
        this.screenReaderDiv.appendChild(codeElement);
    };
    AceInlineScreenReader.prototype.destroy = function () {
        this.screenReaderDiv.remove();
    };
    /**
     * Take this._lines, render it as <code> blocks and add those to the screen reader div.
     */
    AceInlineScreenReader.prototype.createCodeBlock = function () {
        var container = document.createElement("pre");
        container.setAttribute("id", "ace-inline-screenreader");
        for (var lineIndex = 0; lineIndex < this._lines.length; lineIndex++) {
            var codeElement = document.createElement("code");
            codeElement.setAttribute("id", "ace-inline-screenreader-line-".concat(lineIndex));
            var line = document.createTextNode(this._lines[lineIndex]);
            codeElement.appendChild(line);
            container.appendChild(codeElement);
        }
        return container;
    };
    return AceInlineScreenReader;
}());
exports.AceInlineScreenReader = AceInlineScreenReader;

});