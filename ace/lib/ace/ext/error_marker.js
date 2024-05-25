define(function(require, exports, module){"use strict";
var LineWidgets = require("../line_widgets").LineWidgets;
var dom = require("../lib/dom");
var Range = require("../range").Range;
var nls = require("../config").nls;
function binarySearch(array, needle, comparator) {
    var first = 0;
    var last = array.length - 1;
    while (first <= last) {
        var mid = (first + last) >> 1;
        var c = comparator(needle, array[mid]);
        if (c > 0)
            first = mid + 1;
        else if (c < 0)
            last = mid - 1;
        else
            return mid;
    }
    // Return the nearest lesser index, "-1" means "0, "-2" means "1", etc.
    return -(first + 1);
}
/**
 * @param {import("../edit_session").EditSession} session
 * @param {number} row
 * @param {number} dir
 */
function findAnnotations(session, row, dir) {
    var annotations = session.getAnnotations().sort(Range.comparePoints);
    if (!annotations.length)
        return;
    var i = binarySearch(annotations, { row: row, column: -1 }, Range.comparePoints);
    if (i < 0)
        i = -i - 1;
    if (i >= annotations.length)
        i = dir > 0 ? 0 : annotations.length - 1;
    else if (i === 0 && dir < 0)
        i = annotations.length - 1;
    var annotation = annotations[i];
    if (!annotation || !dir)
        return;
    if (annotation.row === row) {
        do {
            annotation = annotations[i += dir];
        } while (annotation && annotation.row === row);
        if (!annotation)
            return annotations.slice();
    }
    var matched = [];
    row = annotation.row;
    do {
        matched[dir < 0 ? "unshift" : "push"](annotation);
        annotation = annotations[i += dir];
    } while (annotation && annotation.row == row);
    return matched.length && matched;
}
/**
 * @param {import("../editor").Editor} editor
 * @param {number} dir
 */
exports.showErrorMarker = function (editor, dir) {
    var session = editor.session;
    if (!session.widgetManager) {
        session.widgetManager = new LineWidgets(session);
        session.widgetManager.attach(editor);
    }
    var pos = editor.getCursorPosition();
    var row = pos.row;
    var oldWidget = session.widgetManager.getWidgetsAtRow(row).filter(function (w) {
        return w.type == "errorMarker";
    })[0];
    if (oldWidget) {
        oldWidget.destroy();
    }
    else {
        row -= dir;
    }
    var annotations = findAnnotations(session, row, dir);
    var gutterAnno;
    if (annotations) {
        var annotation = annotations[0];
        pos.column = (annotation.pos && typeof annotation.column != "number"
            ? annotation.pos.sc
            : annotation.column) || 0;
        pos.row = annotation.row;
        gutterAnno = editor.renderer.$gutterLayer.$annotations[pos.row];
    }
    else if (oldWidget) {
        return;
    }
    else {
        gutterAnno = {
            text: [nls("error-marker.good-state", "Looks good!")],
            className: "ace_ok"
        };
    }
    editor.session.unfold(pos.row);
    editor.selection.moveToPosition(pos);
    var w = {
        row: pos.row,
        fixedWidth: true,
        coverGutter: true,
        el: dom.createElement("div"),
        type: "errorMarker"
    };
    var el = w.el.appendChild(dom.createElement("div"));
    var arrow = w.el.appendChild(dom.createElement("div"));
    arrow.className = "error_widget_arrow " + gutterAnno.className;
    var left = editor.renderer.$cursorLayer
        .getPixelPosition(pos).left;
    arrow.style.left = left + editor.renderer.gutterWidth - 5 + "px";
    w.el.className = "error_widget_wrapper";
    el.className = "error_widget " + gutterAnno.className;
    el.innerHTML = gutterAnno.text.join("<br>");
    el.appendChild(dom.createElement("div"));
    var kb = function (_, hashId, keyString) {
        if (hashId === 0 && (keyString === "esc" || keyString === "return")) {
            w.destroy();
            return { command: "null" };
        }
    };
    w.destroy = function () {
        if (editor.$mouseHandler.isMousePressed)
            return;
        // @ts-ignore
        editor.keyBinding.removeKeyboardHandler(kb);
        session.widgetManager.removeLineWidget(w);
        editor.off("changeSelection", w.destroy);
        editor.off("changeSession", w.destroy);
        editor.off("mouseup", w.destroy);
        editor.off("change", w.destroy);
    };
    // @ts-ignore
    editor.keyBinding.addKeyboardHandler(kb);
    editor.on("changeSelection", w.destroy);
    editor.on("changeSession", w.destroy);
    editor.on("mouseup", w.destroy);
    editor.on("change", w.destroy);
    editor.session.widgetManager.addLineWidget(w);
    w.el.onmousedown = editor.focus.bind(editor);
    editor.renderer.scrollCursorIntoView(null, 0.5, { bottom: w.el.offsetHeight });
};
dom.importCssString("\n    .error_widget_wrapper {\n        background: inherit;\n        color: inherit;\n        border:none\n    }\n    .error_widget {\n        border-top: solid 2px;\n        border-bottom: solid 2px;\n        margin: 5px 0;\n        padding: 10px 40px;\n        white-space: pre-wrap;\n    }\n    .error_widget.ace_error, .error_widget_arrow.ace_error{\n        border-color: #ff5a5a\n    }\n    .error_widget.ace_warning, .error_widget_arrow.ace_warning{\n        border-color: #F1D817\n    }\n    .error_widget.ace_info, .error_widget_arrow.ace_info{\n        border-color: #5a5a5a\n    }\n    .error_widget.ace_ok, .error_widget_arrow.ace_ok{\n        border-color: #5aaa5a\n    }\n    .error_widget_arrow {\n        position: absolute;\n        border: solid 5px;\n        border-top-color: transparent!important;\n        border-right-color: transparent!important;\n        border-left-color: transparent!important;\n        top: -5px;\n    }\n", "error_marker.css", false);

});