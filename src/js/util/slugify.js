/* global module, s, console */
'use strict';

export default simpleSlugify;

function simpleSlugify(str) {
    return str.toLowerCase().replace(/\s\W/g, '-');
}
