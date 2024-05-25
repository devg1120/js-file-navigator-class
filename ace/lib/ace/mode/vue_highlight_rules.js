define(function(require, exports, module){"use strict";
var __read = (this && this.__read) || function (o, n) {
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
var CssHighlightRules = require("./css_highlight_rules").CssHighlightRules;
var TypeScriptHighlightRules = require("./typescript_highlight_rules").TypeScriptHighlightRules;
var CoffeeHighlightRules = require("./coffee_highlight_rules").CoffeeHighlightRules;
var HtmlHighlightRules = require("./html_highlight_rules").HtmlHighlightRules;
var JavaScriptHighlightRules = require("./javascript_highlight_rules").JavaScriptHighlightRules;
var StylusHighlightRules = require("./stylus_highlight_rules").StylusHighlightRules;
var SassHighlightRules = require("./sass_highlight_rules").SassHighlightRules;
var ScssHighlightRules = require("./scss_highlight_rules").ScssHighlightRules;
var LessHighlightRules = require("./less_highlight_rules").LessHighlightRules;
var Tokenizer = require("../tokenizer").Tokenizer;
var SlimHighlightRules = require("./slim_highlight_rules").SlimHighlightRules;
var JadeHighlightRules = require("./jade_highlight_rules").JadeHighlightRules;
var JavaScriptMode = require("./javascript").Mode;
var VueHighlightRules = function (options) {
    /**
     * @param {{new(): Ace.HighlightRules}|Ace.HighlightRulesMap} HighlightRules
     * @param {string} tag
     * @param {string} value
     * @param {string} [attribute]
     */
    this.embedLangRules = function (HighlightRules, tag, value, attribute) {
        var condition = attribute ? "(?=[^>]*" + attribute + "\\s*=\\s*['\"]" + value + "['\"]))" : "(?=\\s|>|$))";
        this.$rules.start.unshift({
            token: ["meta.tag.punctuation.tag-open.xml", "meta.tag." + tag + ".tag-name.xml"],
            regex: "(<)(" + tag + condition,
            next: [
                {
                    token: "meta.tag.punctuation.tag-close." + tag + ".xml",
                    regex: "/?>",
                    next: value + "-start"
                }, { include: "attributes" }
            ]
        });
        this.$rules[tag + "-end"] = [
            { include: "attributes" }, {
                token: "meta.tag.punctuation.tag-close.xml",
                regex: "/?>",
                next: "start",
                onMatch: function (value, currentState, stack) {
                    stack.splice(0);
                    return this.token;
                }
            }
        ];
        this.embedRules(HighlightRules, value + "-", [
            {
                token: ["meta.tag.punctuation.end-tag-open.xml", "meta.tag." + tag + ".tag-name.xml"],
                regex: "(</)(" + tag + "(?=\\s|>|$))",
                next: tag + "-end"
            }, {
                token: "string.cdata.xml",
                regex: "<\\!\\[CDATA\\["
            }, {
                token: "string.cdata.xml",
                regex: "\\]\\]>"
            }
        ]);
    };
    var vueRules = [
        {
            include: "vue-interpolations"
        }
    ];
    var VueRules = new HtmlHighlightRules().getRules();
    VueRules.start = vueRules.concat(VueRules.start);
    VueRules["vue-interpolations"] = [
        {
            token: "punctuation",
            regex: /\{\{\{?/,
            next: "js-interpolation-start"
        }
    ];
    var self = this;
    VueRules.tag_stuff.unshift({
        token: "string",
        regex: /(?:\b(v-)|(:|@))([a-zA-Z\-.]+)(?:\:([a-zA-Z\-]+))?(?:\.([a-zA-Z\-]+))*(\s*)(=)(\s*)(["'])/,
        onMatch: function (value, currentState, stack) {
            var quote = value[value.length - 1];
            stack.unshift(quote, currentState);
            var values = new RegExp(this.regex).exec(value);
            if (!values)
                return "text";
            var tokens = [];
            var types = [
                "entity.other.attribute-name.xml", "punctuation.separator.key-value.xml",
                "entity.other.attribute-name.xml", "entity.other.attribute-name.xml", "entity.other.attribute-name.xml",
                "text", "punctuation.separator.key-value.xml", "text", "string"
            ];
            for (var i = 0, l = types.length; i < l; i++) {
                if (values[i + 1])
                    tokens[tokens.length] = {
                        type: types[i],
                        value: values[i + 1]
                    };
            }
            return tokens;
        },
        next: [
            {
                token: "string",
                regex: /$/,
                next: "tag_stuff"
            }, {
                token: "string",
                regex: /.*/,
                onMatch: function (value, currentState, stack, line) {
                    var quote = stack[0];
                    var parts = value.split(quote);
                    var text = parts[0];
                    this.next = "";
                    if (parts.length > 1) {
                        stack.shift();
                        var nextState = stack.shift();
                        var currentData = new Tokenizer(self.$rules).getLineTokens(parts.slice(1).join(quote), nextState);
                        currentData.tokens.unshift({
                            type: "string",
                            value: quote
                        });
                        this.next = Array.isArray(currentData.state) ? currentData.state[currentData.state.length - 1]
                            : currentData.state;
                    }
                    var data = new JavaScriptMode().getTokenizer().getLineTokens(text, "start");
                    var tokens = data.tokens;
                    if (currentData) {
                        tokens.push.apply(tokens, __spreadArray([], __read(currentData.tokens), false));
                    }
                    return tokens;
                }
            }
        ]
    }, {
        token: "string",
        regex: '"',
        next: [
            {
                token: "string",
                regex: '"|$',
                next: "tag_stuff"
            }, {
                include: "vue-interpolations"
            }, {
                defaultToken: "string"
            }
        ]
    }, {
        token: "string",
        regex: "'",
        next: [
            {
                token: "string",
                regex: "'|$",
                next: "tag_stuff"
            }, {
                include: "vue-interpolations"
            }, {
                defaultToken: "string"
            }
        ]
    });
    this.$rules = VueRules;
    this.embedRules(JavaScriptHighlightRules, "js-interpolation-", [
        {
            token: "punctuation",
            regex: /\}\}\}?/,
            next: "start"
        }
    ]);
    this.embedLangRules(CssHighlightRules, "style", "css");
    this.embedLangRules(StylusHighlightRules, "style", "stylus", "lang");
    //TODO: postcss is missing: this.embedLangRules(StylusHighlightRules, "style", "lang", "postcss");
    this.embedLangRules(SassHighlightRules, "style", "sass", "lang");
    this.embedLangRules(ScssHighlightRules, "style", "scss", "lang");
    this.embedLangRules(LessHighlightRules, "style", "less", "lang");
    this.embedLangRules(TypeScriptHighlightRules, "script", "ts", "lang");
    this.embedLangRules(CoffeeHighlightRules, "script", "coffee", "lang");
    //TODO: this.embedLangRules(CoffeeHighlightRules, "script", "livescript", "lang");
    this.embedLangRules(SlimHighlightRules, "template", "slm", "lang");
    this.embedLangRules(JadeHighlightRules, "template", "jade", "lang");
    //TODO: this.embedLangRules(Pug, "template", "pug", "lang");
    this.embedLangRules(StylusHighlightRules, "template", "stylus", "lang");
    this.normalizeRules();
};
oop.inherits(VueHighlightRules, HtmlHighlightRules);
exports.VueHighlightRules = VueHighlightRules;

});