var undef;
var nextTick, isFunc = function(f) {
    return typeof f === "function";
}, isArray = function(a) {
    return Array.isArray ? Array.isArray(a) : a instanceof Array;
}, isObjOrFunc = function(o) {
    return !!(o && (typeof o).match(/function|object/));
}, isNotVal = function(v) {
    return v === false || v === undef || v === null;
}, slice = function(a, offset) {
    return [].slice.call(a, offset);
}, undefStr = "undefined", tErr = typeof TypeError === undefStr ? Error : TypeError;
if (typeof process !== undefStr && process.nextTick) {
    nextTick = process.nextTick;
} else if (typeof MessageChannel !== undefStr) {
    var ntickChannel = new MessageChannel, queue = [];
    ntickChannel.port1.onmessage = function() {
    queue.length && queue.shift()();
    };
    nextTick = function(cb) {
    queue.push(cb);
    ntickChannel.port2.postMessage(0);
    };
} else {
    nextTick = function(cb) {
    setTimeout(cb, 0);
    };
}
function rethrow(e) {
    nextTick(function() {
    throw e;
    });
}
function promise_success(fulfilled) {
    return this.then(fulfilled, undef);
}
function promise_error(failed) {
    return this.then(undef, failed);
}
function promise_apply(fulfilled, failed) {
    return this.then(function(a) {
    return isFunc(fulfilled) ? fulfilled.apply(null, isArray(a) ? a : [a]) : defer.onlyFuncs ? a : fulfilled;
    }, failed || undef);
}
function promise_ensure(cb) {
    function _cb() {
    cb();
    }
    this.then(_cb, _cb);
    return this;
}
function promise_nodify(cb) {
    return this.then(function(a) {
    return isFunc(cb) ? cb.apply(null, isArray(a) ? a.splice(0, 0, undefined) && a : [undefined, a]) : defer.onlyFuncs ? a : cb;
    }, function(e) {
    return cb(e);
    });
}
function promise_rethrow(failed) {
    return this.then(undef, failed ? function(e) {
    failed(e);
    throw e;
    } : rethrow);
}
var defer = function(alwaysAsync) {
    var alwaysAsyncFn = (undef !== alwaysAsync ? alwaysAsync : defer.alwaysAsync) ? nextTick : function(fn) {
    fn();
    }, status = 0, pendings = [], value, _promise = {
    then: function(fulfilled, failed) {
        var d = defer();
        pendings.push([
        function(value2) {
            try {
            if (isNotVal(fulfilled)) {
                d.resolve(value2);
            } else {
                d.resolve(isFunc(fulfilled) ? fulfilled(value2) : defer.onlyFuncs ? value2 : fulfilled);
            }
            } catch (e) {
            d.reject(e);
            }
        },
        function(err) {
            if (isNotVal(failed) || !isFunc(failed) && defer.onlyFuncs) {
            d.reject(err);
            }
            if (failed) {
            try {
                d.resolve(isFunc(failed) ? failed(err) : failed);
            } catch (e) {
                d.reject(e);
            }
            }
        }
        ]);
        status !== 0 && alwaysAsyncFn(execCallbacks);
        return d.promise;
    },
    success: promise_success,
    error: promise_error,
    otherwise: promise_error,
    apply: promise_apply,
    spread: promise_apply,
    ensure: promise_ensure,
    nodify: promise_nodify,
    rethrow: promise_rethrow,
    isPending: function() {
        return status === 0;
    },
    getStatus: function() {
        return status;
    }
    };
    _promise.toSource = _promise.toString = _promise.valueOf = function() {
    return value === undef ? this : value;
    };
    function execCallbacks() {
    if (status === 0) {
        return;
    }
    var cbs = pendings, i = 0, l = cbs.length, cbIndex = ~status ? 0 : 1, cb;
    pendings = [];
    for (;i < l; i++) {
        (cb = cbs[i][cbIndex]) && cb(value);
    }
    }
    function _resolve(val) {
    var done = false;
    function once(f) {
        return function(x) {
        if (done) {
            return;
        } else {
            done = true;
            return f(x);
        }
        };
    }
    if (status) {
        return this;
    }
    try {
        var then = isObjOrFunc(val) && val.then;
        if (isFunc(then)) {
        if (val === _promise) {
            throw new tErr("Promise can't resolve itself");
        }
        then.call(val, once(_resolve), once(_reject));
        return this;
        }
    } catch (e) {
        once(_reject)(e);
        return this;
    }
    alwaysAsyncFn(function() {
        value = val;
        status = 1;
        execCallbacks();
    });
    return this;
    }
    function _reject(Err) {
    status || alwaysAsyncFn(function() {
        try {
        throw Err;
        } catch (e) {
        value = e;
        }
        status = -1;
        execCallbacks();
    });
    return this;
    }
    return {
    promise: _promise,
    resolve: _resolve,
    fulfill: _resolve,
    reject: _reject
    };
};
defer.deferred = defer.defer = defer;
defer.nextTick = nextTick;
defer.alwaysAsync = true;
defer.onlyFuncs = true;
defer.resolved = defer.fulfilled = function(value) {
    return defer(true).resolve(value).promise;
};
defer.rejected = function(reason) {
    return defer(true).reject(reason).promise;
};
defer.wait = function(time) {
    var d = defer();
    setTimeout(d.resolve, time || 0);
    return d.promise;
};
defer.delay = function(fn, delay) {
    var d = defer();
    setTimeout(function() {
    try {
        d.resolve(isFunc(fn) ? fn.apply(null) : fn);
    } catch (e) {
        d.reject(e);
    }
    }, delay || 0);
    return d.promise;
};
defer.promisify = function(promise) {
    if (promise && isFunc(promise.then)) {
    return promise;
    }
    return defer.resolved(promise);
};
function multiPromiseResolver(callerArguments, returnPromises) {
    var promises = slice(callerArguments);
    if (promises.length === 1 && isArray(promises[0])) {
    if (!promises[0].length) {
        return defer.fulfilled([]);
    }
    promises = promises[0];
    }
    var args = [], d = defer(), c = promises.length;
    if (!c) {
    d.resolve(args);
    } else {
    var resolver = function(i2) {
        promises[i2] = defer.promisify(promises[i2]);
        promises[i2].then(function(v) {
        args[i2] = returnPromises ? promises[i2] : v;
        --c || d.resolve(args);
        }, function(e) {
        if (!returnPromises) {
            d.reject(e);
        } else {
            args[i2] = promises[i2];
            --c || d.resolve(args);
        }
        });
    };
    for (var i = 0, l = c;i < l; i++) {
        resolver(i);
    }
    }
    return d.promise;
}
function sequenceZenifier(promise, zenValue) {
    return promise.then(isFunc(zenValue) ? zenValue : function() {
    return zenValue;
    });
}
function sequencePromiseResolver(callerArguments) {
    var funcs = slice(callerArguments);
    if (funcs.length === 1 && isArray(funcs[0])) {
    funcs = funcs[0];
    }
    var d = defer(), i = 0, l = funcs.length, promise = defer.resolved();
    for (;i < l; i++) {
    promise = sequenceZenifier(promise, funcs[i]);
    }
    d.resolve(promise);
    return d.promise;
}
defer.all = function() {
    return multiPromiseResolver(arguments, false);
};
defer.resolveAll = function() {
    return multiPromiseResolver(arguments, true);
};
defer.sequence = function() {
    return sequencePromiseResolver(arguments);
};
defer.nodeCapsule = function(subject, fn) {
    if (!fn) {
    fn = subject;
    subject = undefined;
    }
    return function() {
    var d = defer(), args = slice(arguments);
    args.push(function(err, res) {
        err ? d.reject(err) : d.resolve(arguments.length > 2 ? slice(arguments, 1) : res);
    });
    try {
        fn.apply(subject, args);
    } catch (e) {
        d.reject(e);
    }
    return d.promise;
    };
};
// if (typeof define === "function" && define.amd) {
//   define("D.js", [], function() {
//     return defer;
//   });
// } else if (typeof module2 !== undefStr && module2.exports) {
//   module2.exports = defer;
// } else if (typeof window !== undefStr) {
//   var oldD = window.D;
//   defer.noConflict = function() {
//     window.D = oldD;
//     return defer;
//   };
//   window.D = defer;
// }
export default defer;