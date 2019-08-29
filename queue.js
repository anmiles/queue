var extend = require('extend');

function Queue() {
    var self = this;
    var queue = [];
    var args = Array.prototype.slice.call(arguments, 0);

    if (Array.isArray(args[0])) {
        queue = args.shift();
    }

    var options = args.shift() || {};

    var defaultOptions = {name : '', interval: 0, debug: true};
    options = extend(defaultOptions, options);

    var onDequeue = async () => {};
    
    self.name = options.name;
    self.onExit = () => {};    
    self.getStatus = () => {({state: state, length: queue.length})};
    
    self.push = function() {
        if (queue === undefined) throw 'Attempt to push into stopped queue';
        debug('push', queue);
        var args = Array.prototype.slice.call(arguments, 0);
        queue.push(args.length === 1 ? args[0] : args);
        self.dequeue();
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
        if (queue.length > 0) {
            debug('dequeued', queue);

            if (options.interval === 0) {
                await onDequeue(queue.splice(0, 1)[0]);
                self.dequeue();
            } else {
                onDequeue(queue.splice(0, 1)[0]);
                setTimeout(self.dequeue, options.interval);
            }
        } else {
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