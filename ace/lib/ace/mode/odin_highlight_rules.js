define(function(require, exports, module){var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var oop = require("../lib/oop");
var DocCommentHighlightRules = require("./doc_comment_highlight_rules").DocCommentHighlightRules;
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var OdinHighlightRules = function () {
    var keywords = "using|transmute|cast|distinct|opaque|where|" +
        "struct|enum|union|bit_field|bit_set|" +
        "if|when|else|do|switch|case|break|fallthrough|" +
        "size_of|offset_of|type_info_if|typeid_of|type_of|align_of|" +
        "or_return|or_else|inline|no_inline|" +
        "import|package|foreign|defer|auto_cast|map|matrix|proc|" +
        "for|continue|not_in|in";
    var cartesian = function () {
        var a = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            a[_i] = arguments[_i];
        }
        return a
            .reduce(function (a, b) { return a.flatMap(function (d) { return b.map(function (e) { return [d, e].flat(); }); }); })
            .map(function (parts) { return parts.join(""); });
    };
    var builtinTypes = __spreadArray(__spreadArray(__spreadArray(__spreadArray([
        "int",
        "uint",
        "uintptr",
        "typeid",
        "rawptr",
        "string",
        "cstring",
        "i8",
        "u8",
        "any",
        "byte",
        "rune",
        "bool",
        "b8",
        "b16",
        "b32",
        "b64"
    ], __read(cartesian(["i", "u"], ["16", "32", "64", "128"], ["", "le", "be"])), false), __read(cartesian(["f"], ["16", "32", "64"], ["", "le", "be"])), false), __read(cartesian(["complex"], ["32", "64", "128"])), false), __read(cartesian(["quaternion"], ["64", "128", "256"])), false).join("|");
    var operators = [
        "\\*",
        "/",
        "%",
        "%%",
        "<<",
        ">>",
        "&",
        "&~",
        "\\+",
        "\\-",
        "~",
        "\\|",
        ">",
        "<",
        "<=",
        ">=",
        "==",
        "!="
    ]
        .concat(":")
        .map(function (operator) { return operator + "="; })
        .concat("=", ":=", "::", "->", "\\^", "&", ":")
        .join("|");
    var builtinFunctions = "new|cap|copy|panic|len|make|delete|append|free";
    var builtinConstants = "nil|true|false";
    var keywordMapper = this.createKeywordMapper({
        keyword: keywords,
        "constant.language": builtinConstants,
        "support.function": builtinFunctions,
        "support.type": builtinTypes
    }, "");
    var stringEscapeRe = "\\\\(?:[0-7]{3}|x\\h{2}|u{4}|U\\h{6}|[abfnrtv'\"\\\\])".replace(/\\h/g, "[a-fA-F\\d]");
    this.$rules = {
        start: [
            {
                token: "comment",
                regex: /\/\/.*$/
            },
            DocCommentHighlightRules.getStartRule("doc-start"),
            {
                token: "comment.start", // multi line comment
                regex: "\\/\\*",
                next: "comment"
            },
            {
                token: "string", // single line
                regex: /"(?:[^"\\]|\\.)*?"/
            },
            {
                token: "string", // raw
                regex: "`",
                next: "bqstring"
            },
            {
                token: "support.constant",
                regex: /#[a-z_]+/
            },
            {
                token: "constant.numeric", // rune
                regex: "'(?:[^\\'\uD800-\uDBFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|" +
                    stringEscapeRe.replace('"', "") +
                    ")'"
            },
            {
                token: "constant.numeric", // hex
                regex: "0[xX][0-9a-fA-F]+\\b"
            },
            {
                token: "constant.numeric", // float
                regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            },
            {
                token: [
                    "entity.name.function",
                    "text",
                    "keyword.operator",
                    "text",
                    "keyword"
                ],
                regex: "([a-zA-Z_$][a-zA-Z0-9_$]*)(\\s+)(::)(\\s+)(proc)\\b"
            },
            {
                token: function (val) {
                    if (val[val.length - 1] == "(") {
                        return [
                            {
                                type: keywordMapper(val.slice(0, -1)) || "support.function",
                                value: val.slice(0, -1)
                            },
                            {
                                type: "paren.lparen",
                                value: val.slice(-1)
                            }
                        ];
                    }
                    return keywordMapper(val) || "identifier";
                },
                regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b\\(?"
            },
            {
                token: "keyword.operator",
                regex: operators
            },
            {
                token: "punctuation.operator",
                regex: "\\?|\\,|\\;|\\."
            },
            {
                token: "paren.lparen",
                regex: "[[({]"
            },
            {
                token: "paren.rparen",
                regex: "[\\])}]"
            },
            {
                token: "text",
                regex: "\\s+"
            }
        ],
        comment: [
            {
                token: "comment.end",
                regex: "\\*\\/",
                next: "start"
            },
            {
                defaultToken: "comment"
            }
        ],
        bqstring: [
            {
                token: "string",
                regex: "`",
                next: "start"
            },
            {
                defaultToken: "string"
            }
        ]
    };
    this.embedRules(DocCommentHighlightRules, "doc-", [
        DocCommentHighlightRules.getEndRule("start")
    ]);
};
oop.inherits(OdinHighlightRules, TextHighlightRules);
exports.OdinHighlightRules = OdinHighlightRules;

});