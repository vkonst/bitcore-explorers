'use strict';

// Inheritance helper borrowed from Babel (babel.io)
function inherits(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
        throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
    }
    subClass.prototype = Object.create(
        superClass && superClass.prototype, // (superclass === null) ? null : superClass.prototype
        {
            constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
        }
    );
    if (superClass) {
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(subClass, superClass);
        } else {
            subClass.__proto__ = superClass; // jshint ignore:line
        }
    }
}

module.exports.inherits = inherits;
