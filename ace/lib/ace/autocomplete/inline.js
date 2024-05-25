define(function(require, exports, module){"use strict";
/**
 * @typedef {import("../editor").Editor} Editor
 */
var snippetManager = require("../snippets").snippetManager;
var AceInlineScreenReader = require("./inline_screenreader").AceInlineScreenReader;
/**
 * This object is used to manage inline code completions rendered into an editor with ghost text.
 */
var AceInline = /** @class */ (function () {
    /**
     * Creates the inline completion renderer which renders the inline code completions directly in the target editor.
     */
    function AceInline() {
        this.editor = null;
    }
    /**
     * Renders the completion as ghost text to the current cursor position
     * @param {Editor} editor
     * @param {import("../../ace-internal").Ace.Completion} completion
     * @param {string} prefix
     * @returns {boolean} True if the completion could be rendered to the editor, false otherwise
     */
    AceInline.prototype.show = function (editor, completion, prefix) {
        prefix = prefix || "";
        if (editor && this.editor && this.editor !== editor) {
            this.hide();
            this.editor = null;
            this.inlineScreenReader = null;
        }
        if (!editor || !completion) {
            return false;
        }
        if (!this.inlineScreenReader) {
            this.inlineScreenReader = new AceInlineScreenReader(editor);
        }
        var displayText = completion.snippet ? snippetManager.getDisplayTextForSnippet(editor, completion.snippet) : completion.value;
        if (completion.hideInlinePreview || !displayText || !displayText.startsWith(prefix)) {
            return false;
        }
        this.editor = editor;
        this.inlineScreenReader.setScreenReaderContent(displayText);
        displayText = displayText.slice(prefix.length);
        if (displayText === "") {
            editor.removeGhostText();
        }
        else {
            editor.setGhostText(displayText);
        }
        return true;
    };
    AceInline.prototype.isOpen = function () {
        if (!this.editor) {
            return false;
        }
        return !!this.editor.renderer.$ghostText;
    };
    AceInline.prototype.hide = function () {
        if (!this.editor) {
            return false;
        }
        this.editor.removeGhostText();
        return true;
    };
    AceInline.prototype.destroy = function () {
        this.hide();
        this.editor = null;
        if (this.inlineScreenReader) {
            this.inlineScreenReader.destroy();
            this.inlineScreenReader = null;
        }
    };
    return AceInline;
}());
exports.AceInline = AceInline;

});