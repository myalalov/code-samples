const globalThis = (function() { return this; })();

function func(...args) {
    const thisString = this === globalThis ? 'global object' : '{ id: ' + this.id + ' }';
    console.log('called func() with this = ' + thisString + ' and arguments = ' + args.join(', '));
    return thisString + ': ' + args.join(', ');
}

Function.prototype.mybind = function(object, ...args) {
    const settings = {
        object,
        callback: this,
        arguments: [...args]
    };

    const bindedFunc = function(...local) {
        return settings.callback.apply(settings.object, [...settings.arguments, ...local]);
    };

    const updatedPrototype = function() {
        this.mybind = function(newObject, ...newArgs) {
            settings.object = newObject;
            settings.arguments.push(...newArgs);
            return bindedFunc;
        };
    };

    Object.setPrototypeOf(bindedFunc, new updatedPrototype());

    return bindedFunc;
};

const func0 = func;
console.log('func0 returns', func0(1, 2));

const func1 = func0.mybind({ id: 1 }, 1, 2);
console.log('func1 returns', func1(3, 4));

const func2 = func1.mybind({ id: 2 }, 3, 4);
console.log('func2 returns', func2(5, 6));

const func3 = func2.mybind({ id: 3 }, 5, 6);
console.log('func3 returns', func3(7, 8));
