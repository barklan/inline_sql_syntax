"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.getConfiguration = exports.DRIVER = exports.PREFIX = void 0;
const vscode = require("vscode");
exports.PREFIX = 'inlineSQL';
var DRIVER;
(function (DRIVER) {
    DRIVER["mysql"] = "mysql";
    DRIVER["postgres"] = "postgres";
})(DRIVER = exports.DRIVER || (exports.DRIVER = {}));
function getConfiguration() {
    return vscode.workspace.getConfiguration();
}
exports.getConfiguration = getConfiguration;
function get(key) {
    return getConfiguration().get(`${exports.PREFIX}.${key}`);
}
exports.get = get;
//# sourceMappingURL=configuration.js.map