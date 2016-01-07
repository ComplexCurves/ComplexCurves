/** @param {string} name
 *  @param {Array<string>} dependencies
 *  @param {function(function())} action
 *  @constructor */
function Task(name, dependencies, action) {
    this.name = name;
    this.dependencies = dependencies;
    this.action = action;
}

/** @param {Array<Task>} tasks
 *  @constructor */
function Schedule(tasks) {
    this.tasks = tasks;
}

Schedule.prototype.completed = {};

/** @param {Task} task
 * @return {boolean} */
Schedule.prototype.isTaskCompleted = function(task) {
    return this.completed[task.name] === true ? true : false;
};

/** @param {Task} task
 * @return {boolean} */
Schedule.prototype.isTaskRunnable = function(task) {
    if (this.running[task.name] === true)
        return false;
    var deps = task.dependencies;
    for (var i = 0; i < deps.length; i++)
        if (this.completed[deps[i]] !== true)
            return false;
    return true;
};

Schedule.prototype.running = {};

Schedule.prototype.run = function() {
    var tasks = this.tasks;
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (!this.isTaskCompleted(task) && this.isTaskRunnable(task))
            this.runTask(task);
    }
};

/** @param {Task} task */
Schedule.prototype.runTask = function(task) {
    this.running[task.name] = true;
    var schedule = this;
    task.action(function() {
        schedule.completed[task.name] = true;
        schedule.running[task.name] = false;
        schedule.run();
    });
};