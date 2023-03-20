const extend = require('extend');

function Queue() {
    var self = this;
    var running = false;
    var queue = [];
    var args = Array.prototype.slice.call(arguments, 0);

    if (Array.isArray(args[0])) {
        queue = args.shift();
    }

    var options = args.shift() || {};

    var defaultOptions = {name : '', interval: 0, debug: false};
    options = extend(defaultOptions, options);

    var onDequeue = async () => {};

    self.name = options.name;
    self.onExit = () => {};

    self.push = function() {
        if (queue === undefined) throw 'Attempt to push into stopped queue';
        var args = Array.prototype.slice.call(arguments, 0);
        queue.push(args.length === 1 ? args[0] : args);
        if (!running) {
            debug('push => dequeue', queue);
            self.dequeue();
        } else {
            debug('push => nothing', queue);
        }
        return self;
    };

    self.callback = _onDequeue => {
        onDequeue = _onDequeue;
        self.dequeue();
        return self;
    };

    self.done = onExit => {
        self.onExit = () => {
            debug('stopped', queue);
            onExit();
            queue = undefined;
        }

        return self;
    }

    self.dequeue = async () => {
        debug('running', queue);
        running = true;

        if (queue.length > 0) {
            debug('dequeued', queue);
            await onDequeue(queue.splice(0, 1)[0], queue.length);
            setTimeout(() => {
                self.dequeue();
            }, options.interval);
        } else {
            debug('paused', queue);
            running = false;
            self.onExit();
        }

        return self;
    }

    var debug = function(state, _queue) {
        if (!options.debug) return;
        console.log(`Queue ${options.name} ${state} (${_queue.length})`);
    }

    self.debug = _debug => {
        debug = _debug;
        return self;
    }
}

module.exports = {
    create: function (initialQueue, options) {
        return new Queue(initialQueue, options);
    }
};
