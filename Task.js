/** @param {string} name
 *  @param {Array<string>} dependencies
 *  @param {function(function())} action
 *  @constructor */
export default function Task(name, dependencies, action) {
    this.name = name;
    this.dependencies = dependencies;
    this.action = action;
}
