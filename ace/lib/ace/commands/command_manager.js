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
/**
 *
 * @typedef {import("../editor").Editor} Editor
 */
var oop = require("../lib/oop");
var MultiHashHandler = require("../keyboard/hash_handler").MultiHashHandler;
var EventEmitter = require("../lib/event_emitter").EventEmitter;
var CommandManager = /** @class */ (function (_super) {
    __extends(CommandManager, _super);
    /**
     * new CommandManager(platform, commands)
     * @param {String} platform Identifier for the platform; must be either `"mac"` or `"win"`
     * @param {any[]} commands A list of commands
     **/
    function CommandManager(platform, commands) {
        var _this = _super.call(this, commands, platform) || this;
        _this.byName = _this.commands;
        _this.setDefaultHandler("exec", function (e) {
            if (!e.args) {
                return e.command.exec(e.editor, {}, e.event, true);
            }
            return e.command.exec(e.editor, e.args, e.event, false);
        });
        return _this;
    }
    /**
     *
     * @param {string | string[] | import("../../ace-internal").Ace.Command} command
     * @param {Editor} editor
     * @param {any} args
     * @returns {boolean}
     */
    CommandManager.prototype.exec = function (command, editor, args) {
        if (Array.isArray(command)) {
            for (var i = command.length; i--;) {
                if (this.exec(command[i], editor, args))
                    return true;
            }
            return false;
        }
        if (typeof command === "string")
            command = this.commands[command];
        if (!command)
            return false;
        if (editor && editor.$readOnly && !command.readOnly)
            return false;
        if (this.$checkCommandState != false && command.isAvailable && !command.isAvailable(editor))
            return false;
        var e = { editor: editor, command: command, args: args };
        e.returnValue = this._emit("exec", e);
        this._signal("afterExec", e);
        return e.returnValue === false ? false : true;
    };
    /**
     * @param {Editor} editor
     * @returns {boolean}
     */
    CommandManager.prototype.toggleRecording = function (editor) {
        if (this.$inReplay)
            return;
        editor && editor._emit("changeStatus");
        if (this.recording) {
            this.macro.pop();
            this.off("exec", this.$addCommandToMacro);
            if (!this.macro.length)
                this.macro = this.oldMacro;
            return this.recording = false;
        }
        if (!this.$addCommandToMacro) {
            this.$addCommandToMacro = function (e) {
                this.macro.push([e.command, e.args]);
            }.bind(this);
        }
        this.oldMacro = this.macro;
        this.macro = [];
        this.on("exec", this.$addCommandToMacro);
        return this.recording = true;
    };
    /**
     * @param {Editor} editor
     */
    CommandManager.prototype.replay = function (editor) {
        if (this.$inReplay || !this.macro)
            return;
        if (this.recording)
            return this.toggleRecording(editor);
        try {
            this.$inReplay = true;
            this.macro.forEach(function (x) {
                if (typeof x == "string")
                    this.exec(x, editor);
                else
                    this.exec(x[0], editor, x[1]);
            }, this);
        }
        finally {
            this.$inReplay = false;
        }
    };
    CommandManager.prototype.trimMacro = function (m) {
        return m.map(function (x) {
            if (typeof x[0] != "string")
                x[0] = x[0].name;
            if (!x[1])
                x = x[0];
            return x;
        });
    };
    return CommandManager;
}(MultiHashHandler));
oop.implement(CommandManager.prototype, EventEmitter);
exports.CommandManager = CommandManager;

});