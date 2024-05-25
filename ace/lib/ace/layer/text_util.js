define(function(require, exports, module){// Tokens for which Ace just uses a simple TextNode and does not add any special className.
var textTokens = new Set(["text", "rparen", "lparen"]);
exports.isTextToken = function (tokenType) {
    return textTokens.has(tokenType);
};

});