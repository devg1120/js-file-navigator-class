define(function(require, exports, module){"use strict";
var isNodeEnvironment = require("../test/util").isNodeEnvironment;
if (!isNodeEnvironment()) {
    require("amd-loader");
}
var assert = require("../test/assertions");
var tokenize = require("./simple_tokenizer").tokenize;
var JsonHighlightRules = require("../mode/json_highlight_rules").JsonHighlightRules;
var JavaScriptHighlightRules = require("../mode/javascript_highlight_rules").JavaScriptHighlightRules;
module.exports = {
    "test: can tokenize JSON": function () {
        var content = "{\n            \"name\": \"John\",\n            \"age\": 30,\n            \"car\": null\n        }";
        var result = tokenize(content, new JsonHighlightRules());
        var expectedResult = [
            [{ className: "ace_paren ace_lparen", value: "{" }],
            [
                { className: undefined, value: '            ' },
                { className: "ace_variable", value: '"name"' },
                { className: undefined, value: ": " },
                { className: "ace_string", value: '"John"' },
                { className: "ace_punctuation ace_operator", value: "," }
            ],
            [
                { className: undefined, value: '            ' },
                { className: "ace_variable", value: '"age"' },
                { className: undefined, value: ": " },
                { className: "ace_constant ace_numeric", value: "30" },
                { className: "ace_punctuation ace_operator", value: "," }
            ],
            [
                { className: undefined, value: '            ' },
                { className: "ace_variable", value: '"car"' },
                { className: undefined, value: ": null" }
            ],
            [
                { className: undefined, value: '        ' },
                { className: "ace_paren ace_rparen", value: "}" }
            ]
        ];
        assert.deepEqual(result, expectedResult);
    },
    "test: can tokenize Javascript": function () {
        var content = "console.log(\"content\")";
        var result = tokenize(content, new JavaScriptHighlightRules());
        var expectedResult = [
            [
                { className: 'ace_storage ace_type', value: 'console' },
                { className: 'ace_punctuation ace_operator', value: '.' },
                { className: 'ace_support ace_function ace_firebug', value: 'log' },
                { className: 'ace_paren ace_lparen', value: '(' },
                { className: 'ace_string', value: '"content"' },
                { className: 'ace_paren ace_rparen', value: ')' }
            ]
        ];
        assert.deepEqual(result, expectedResult);
    }
};

});