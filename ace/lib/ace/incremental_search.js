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
var Range = require("./range").Range;
var Search = require("./search").Search;
var SearchHighlight = require("./search_highlight").SearchHighlight;
var iSearchCommandModule = require("./commands/incremental_search_commands");
var ISearchKbd = iSearchCommandModule.IncrementalSearchKeyboardHandler;
// regexp handling
function isRegExp(obj) {
    return obj instanceof RegExp;
}
/**
 * @param {RegExp} re
 */
function regExpToObject(re) {
    var string = String(re), start = string.indexOf('/'), flagStart = string.lastIndexOf('/');
    return {
        expression: string.slice(start + 1, flagStart),
        flags: string.slice(flagStart + 1)
    };
}
/**
 * @param {string} string
 * @param {string} flags
 * @return {RegExp|string}
 */
function stringToRegExp(string, flags) {
    try {
        return new RegExp(string, flags);
    }
    catch (e) {
        return string;
    }
}
function objectToRegExp(obj) {
    return stringToRegExp(obj.expression, obj.flags);
}
/**
 * Implements immediate searching while the user is typing. When incremental
 * search is activated, keystrokes into the editor will be used for composing
 * a search term. Immediately after every keystroke the search is updated:
 * - so-far-matching characters are highlighted
 * - the cursor is moved to the next match
 *
 **/
var IncrementalSearch = /** @class */ (function (_super) {
    __extends(IncrementalSearch, _super);
    /**
     * Creates a new `IncrementalSearch` object.
     **/
    function IncrementalSearch() {
        var _this = _super.call(this) || this;
        _this.$options = { wrap: false, skipCurrent: false };
        _this.$keyboardHandler = new ISearchKbd(_this);
        return _this;
    }
    /**
     * @param {boolean} backwards
     */
    IncrementalSearch.prototype.activate = function (editor, backwards) {
        this.$editor = editor;
        this.$startPos = this.$currentPos = editor.getCursorPosition();
        this.$options.needle = '';
        this.$options.backwards = backwards;
        editor.keyBinding.addKeyboardHandler(this.$keyboardHandler);
        // we need to completely intercept paste, just registering an event handler does not work
        this.$originalEditorOnPaste = editor.onPaste;
        editor.onPaste = this.onPaste.bind(this);
        this.$mousedownHandler = editor.on('mousedown', this.onMouseDown.bind(this));
        this.selectionFix(editor);
        this.statusMessage(true);
    };
    /**
     * @param {boolean} [reset]
     */
    IncrementalSearch.prototype.deactivate = function (reset) {
        this.cancelSearch(reset);
        var editor = this.$editor;
        editor.keyBinding.removeKeyboardHandler(this.$keyboardHandler);
        if (this.$mousedownHandler) {
            editor.off('mousedown', this.$mousedownHandler);
            delete this.$mousedownHandler;
        }
        editor.onPaste = this.$originalEditorOnPaste;
        this.message('');
    };
    /**
     * @param {Editor} editor
     */
    IncrementalSearch.prototype.selectionFix = function (editor) {
        // Fix selection bug: When clicked inside the editor
        // editor.selection.$isEmpty is false even if the mouse click did not
        // open a selection. This is interpreted by the move commands to
        // extend the selection. To only extend the selection when there is
        // one, we clear it here
        if (editor.selection.isEmpty() && !editor.session.$emacsMark) {
            editor.clearSelection();
        }
    };
    /**
     * @param {RegExp} regexp
     */
    IncrementalSearch.prototype.highlight = function (regexp) {
        var sess = this.$editor.session, hl = sess.$isearchHighlight = sess.$isearchHighlight || sess.addDynamicMarker(new SearchHighlight(null, "ace_isearch-result", "text"));
        hl.setRegexp(regexp);
        sess._emit("changeBackMarker"); // force highlight layer redraw
    };
    /**
     * @param {boolean} [reset]
     */
    IncrementalSearch.prototype.cancelSearch = function (reset) {
        var e = this.$editor;
        this.$prevNeedle = this.$options.needle;
        this.$options.needle = '';
        if (reset) {
            e.moveCursorToPosition(this.$startPos);
            this.$currentPos = this.$startPos;
        }
        else {
            e.pushEmacsMark && e.pushEmacsMark(this.$startPos, false);
        }
        this.highlight(null);
        return Range.fromPoints(this.$currentPos, this.$currentPos);
    };
    /**
     * @param {boolean} moveToNext
     * @param {Function} needleUpdateFunc
     */
    IncrementalSearch.prototype.highlightAndFindWithNeedle = function (moveToNext, needleUpdateFunc) {
        if (!this.$editor)
            return null;
        var options = this.$options;
        // get search term
        if (needleUpdateFunc) {
            options.needle = needleUpdateFunc.call(this, options.needle || '') || '';
        }
        if (options.needle.length === 0) {
            this.statusMessage(true);
            return this.cancelSearch(true);
        }
        // try to find the next occurrence and enable  highlighting marker
        options.start = this.$currentPos;
        var session = this.$editor.session, found = this.find(session), shouldSelect = this.$editor.emacsMark ?
            !!this.$editor.emacsMark() : !this.$editor.selection.isEmpty();
        if (found) {
            if (options.backwards)
                found = Range.fromPoints(found.end, found.start);
            this.$editor.selection.setRange(Range.fromPoints(shouldSelect ? this.$startPos : found.end, found.end));
            if (moveToNext)
                this.$currentPos = found.end;
            // highlight after cursor move, so selection works properly
            this.highlight(options.re);
        }
        this.statusMessage(found);
        return found;
    };
    /**
     * @param {string} s
     */
    IncrementalSearch.prototype.addString = function (s) {
        return this.highlightAndFindWithNeedle(false, function (needle) {
            if (!isRegExp(needle))
                return needle + s;
            var reObj = regExpToObject(needle);
            reObj.expression += s;
            return objectToRegExp(reObj);
        });
    };
    /**
     * @param {any} c
     */
    IncrementalSearch.prototype.removeChar = function (c) {
        return this.highlightAndFindWithNeedle(false, function (needle) {
            if (!isRegExp(needle))
                return needle.substring(0, needle.length - 1);
            var reObj = regExpToObject(needle);
            reObj.expression = reObj.expression.substring(0, reObj.expression.length - 1);
            return objectToRegExp(reObj);
        });
    };
    IncrementalSearch.prototype.next = function (options) {
        // try to find the next occurrence of whatever we have searched for
        // earlier.
        // options = {[backwards: BOOL], [useCurrentOrPrevSearch: BOOL]}
        options = options || {};
        this.$options.backwards = !!options.backwards;
        this.$currentPos = this.$editor.getCursorPosition();
        return this.highlightAndFindWithNeedle(true, function (needle) {
            return options.useCurrentOrPrevSearch && needle.length === 0 ?
                this.$prevNeedle || '' : needle;
        });
    };
    IncrementalSearch.prototype.onMouseDown = function (evt) {
        // when mouse interaction happens then we quit incremental search
        this.deactivate();
        return true;
    };
    /**
     * @param {string} text
     */
    IncrementalSearch.prototype.onPaste = function (text) {
        this.addString(text);
    };
    IncrementalSearch.prototype.convertNeedleToRegExp = function () {
        return this.highlightAndFindWithNeedle(false, function (needle) {
            return isRegExp(needle) ? needle : stringToRegExp(needle, 'ig');
        });
    };
    IncrementalSearch.prototype.convertNeedleToString = function () {
        return this.highlightAndFindWithNeedle(false, function (needle) {
            return isRegExp(needle) ? regExpToObject(needle).expression : needle;
        });
    };
    IncrementalSearch.prototype.statusMessage = function (found) {
        var options = this.$options, msg = '';
        msg += options.backwards ? 'reverse-' : '';
        msg += 'isearch: ' + options.needle;
        msg += found ? '' : ' (not found)';
        this.message(msg);
    };
    IncrementalSearch.prototype.message = function (msg) {
        if (this.$editor.showCommandLine) {
            this.$editor.showCommandLine(msg);
            this.$editor.focus();
        }
    };
    return IncrementalSearch;
}(Search));
exports.IncrementalSearch = IncrementalSearch;
/**
 *
 * Config settings for enabling/disabling [[IncrementalSearch `IncrementalSearch`]].
 *
 **/
var dom = require('./lib/dom');
dom.importCssString("\n.ace_marker-layer .ace_isearch-result {\n  position: absolute;\n  z-index: 6;\n  box-sizing: border-box;\n}\ndiv.ace_isearch-result {\n  border-radius: 4px;\n  background-color: rgba(255, 200, 0, 0.5);\n  box-shadow: 0 0 4px rgb(255, 200, 0);\n}\n.ace_dark div.ace_isearch-result {\n  background-color: rgb(100, 110, 160);\n  box-shadow: 0 0 4px rgb(80, 90, 140);\n}", "incremental-search-highlighting", false);
// support for default keyboard handler
var commands = require("./commands/command_manager");
(function () {
    this.setupIncrementalSearch = function (editor, val) {
        if (this.usesIncrementalSearch == val)
            return;
        this.usesIncrementalSearch = val;
        var iSearchCommands = iSearchCommandModule.iSearchStartCommands;
        var method = val ? 'addCommands' : 'removeCommands';
        this[method](iSearchCommands);
    };
}).call(commands.CommandManager.prototype);
// incremental search config option
var Editor = require("./editor").Editor;
require("./config").defineOptions(Editor.prototype, "editor", {
    useIncrementalSearch: {
        set: function (val) {
            this.keyBinding.$handlers.forEach(function (handler) {
                if (handler.setupIncrementalSearch) {
                    handler.setupIncrementalSearch(this, val);
                }
            });
            this._emit('incrementalSearchSettingChanged', { isEnabled: val });
        }
    }
});

});