define(function(require, exports, module){"use strict";
var Tokenizer = require("../tokenizer").Tokenizer;
var isTextToken = require("../layer/text_util").isTextToken;
var SimpleTokenizer = /** @class */ (function () {
    /**
     * @param {string} content
     * @param {Tokenizer} tokenizer
     */
    function SimpleTokenizer(content, tokenizer) {
        this._lines = content.split(/\r\n|\r|\n/);
        this._states = [];
        this._tokenizer = tokenizer;
    }
    /**
     * @param {number} row
     * @returns {import("../../ace-internal").Ace.Token[]}
     */
    SimpleTokenizer.prototype.getTokens = function (row) {
        var line = this._lines[row];
        var previousState = this._states[row - 1];
        var data = this._tokenizer.getLineTokens(line, previousState);
        this._states[row] = data.state;
        return data.tokens;
    };
    /**
     * @returns {number}
     */
    SimpleTokenizer.prototype.getLength = function () {
        return this._lines.length;
    };
    return SimpleTokenizer;
}());
/**
 * Parses provided content according to provided highlighting rules and return tokens.
 * Tokens either have the className set according to Ace themes or have no className if they are just pure text tokens.
 * Result is a list of list of tokens, where each line from the provided content is a separate list of tokens.
 *
 * @param {string} content to tokenize
 * @param {import("../../ace-internal").Ace.HighlightRules} highlightRules defining the language grammar
 * @returns {import("../../ace-internal").Ace.TokenizeResult} tokenization result containing a list of token for each of the lines from content
 */
function tokenize(content, highlightRules) {
    var tokenizer = new SimpleTokenizer(content, new Tokenizer(highlightRules.getRules()));
    var result = [];
    for (var lineIndex = 0; lineIndex < tokenizer.getLength(); lineIndex++) {
        var lineTokens = tokenizer.getTokens(lineIndex);
        result.push(lineTokens.map(function (token) { return ({
            className: isTextToken(token.type) ? undefined : "ace_" + token.type.replace(/\./g, " ace_"),
            value: token.value
        }); }));
    }
    return result;
}
module.exports = {
    tokenize: tokenize
};

});