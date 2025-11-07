    
export default (()=> { 
    return (typeof(console) !== 'undefined') ? console : 
        { log: f, info: f, debug: f, warn: f, error: f };
})();
function f() {} 
