const globalThis = (function() { return this; })();

function func(...args) {
    const thisString = this === globalThis ? 'global object' : '{ id: ' + this.id + ' }';
    console.log('called func() with this = ' + thisString + ' and arguments = ' + args.join(', '));
    return thisString + ': ' + args.join(', ');
}

Function.prototype.mybind = function(object, ...args) {
    const callback = this;

    const bindedFunc = (...local) => {
        return callback.apply(object, [...args, ...local]);
    };

    const updatedPrototype = function() {
        this.mybind = (newObject, ...newArgs) => {
            object = newObject;
            args.push(...newArgs);
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
