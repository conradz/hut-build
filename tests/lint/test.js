'use strict';

var test = require('tape');

test('2 + 2 = 4', function(t) {
    t.equal(2 + 2, 4);
})
// Missing semicolon, so lint should fail
