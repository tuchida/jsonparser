var assert = require('assert');
var JSONParser = require('../');

it('String', function() {
  assert.strictEqual(JSONParser.parse('"aaa"'), 'aaa');
  assert.throws(function() { JSONParser.parse('\'aaa\''); });
  assert.strictEqual(JSONParser.parse('"a\\na"'), 'a\na');
  assert.strictEqual(JSONParser.parse('"a\\u2028a"'), 'a\u2028a');
  assert.throws(function() { JSONParser.parse('"a\na"'); });
  assert.strictEqual(JSONParser.parse('""'), '');
  assert.strictEqual(JSONParser.parse('"\\\\"'), '\\');
  assert.throws(function() { JSONParser.parse('"aaa'); });
});

it('Number', function() {
  assert.strictEqual(JSONParser.parse('1'), 1);
  assert.strictEqual(JSONParser.parse('-1'), -1);
  assert.strictEqual(JSONParser.parse('1.5'), 1.5);
  assert.strictEqual(JSONParser.parse('1.5e13'), 1.5e13);
  assert.strictEqual(JSONParser.parse('1.5e+13'), 1.5e+13);
  assert.strictEqual(JSONParser.parse('1.5e-13'), 1.5e-13);
  assert.throws(function() { JSONParser.parse('NaN'); });
  assert.throws(function() { JSONParser.parse('Infinity'); });
  assert.throws(function() { JSONParser.parse('+5'); });
  assert.throws(function() { JSONParser.parse('--5'); });
  assert.throws(function() { JSONParser.parse('05'); });
  assert.throws(function() { JSONParser.parse('.5'); });
});

it('Boolean', function() {
  assert.strictEqual(JSONParser.parse('true'), true);
  assert.strictEqual(JSONParser.parse('false'), false);
  assert.throws(function() { JSONParser.parse('tru'); });
  assert.throws(function() { JSONParser.parse('TRUE'); });
});

it('Null', function() {
  assert.strictEqual(JSONParser.parse('null'), null);
  assert.throws(function() { JSONParser.parse('nul'); });
});

it('Array', function() {
  assert.deepEqual(JSONParser.parse('[]'), []);
  assert.deepEqual(JSONParser.parse('[  ]'), []);
  assert.throws(function() { JSONParser.parse('[,]'); });
  assert.throws(function() { JSONParser.parse('[,]', { lastComma: true }); });
  assert.deepEqual(JSONParser.parse('[1]'), [1]);
  assert.throws(function() { JSONParser.parse('[1,]'); });
  assert.deepEqual(JSONParser.parse('[1,]', { lastComma: true }), [1]);
  assert.throws(function() { JSONParser.parse('[1,2,]'); });
  assert.deepEqual(JSONParser.parse('[1,2,]', { lastComma: true }), [1,2]);
  assert.deepEqual(JSONParser.parse('[1,"abc",true]'), [1,"abc",true]);
  assert.deepEqual(JSONParser.parse('[  1,\n"abc"\t,\ttrue\r]'), [1,"abc",true]);
  assert.deepEqual(JSONParser.parse('[1,"abc",[true]]'), [1,"abc",[true]]);
  assert.throws(function() { JSONParser.parse('['); });
  assert.throws(function() { JSONParser.parse('[/*a*/123,//234\n"456"]'); });
  assert.deepEqual(JSONParser.parse('[/*a*/123,//234\n"456"]', { comment: true }), [123,"456"]);
});

it('Object', function() {
  assert.deepEqual(JSONParser.parse('{}'), {});
  assert.deepEqual(JSONParser.parse('{  }'), {});
  assert.throws(function() { JSONParser.parse('{'); });
  assert.throws(function() { JSONParser.parse('{['); });
  assert.throws(function() { JSONParser.parse('{[}]'); });
  assert.deepEqual(JSONParser.parse('{"bool":false,"str":"xyz","obj":{"a":1}}'), { bool: false, str: "xyz", obj: { a: 1 }});
  assert.deepEqual(JSONParser.parse('{ "bool": false,\n"str":   "xyz"\n,\n"obj" : {"a" : 1 }}'), { bool: false, str: "xyz", obj: { a: 1 }});
  assert.throws(function() { JSONParser.parse('{,}'); });
  assert.throws(function() { JSONParser.parse('{,}', { lastComma: true }); });
  assert.throws(function() { JSONParser.parse('{"a": 1, }'); });
  assert.deepEqual(JSONParser.parse('{"a": 1, }', { lastComma: true }), { a: 1 });
  assert.throws(function() { JSONParser.parse('{"abc"}'); });
  assert.throws(function() { JSONParser.parse('{"abc",}'); });
  assert.throws(function() { JSONParser.parse('{"abc"}', { lastComma: true }); });
  assert.throws(function() { JSONParser.parse('{"abc",}', { lastComma: true }); });
  assert.deepEqual(JSONParser.parse('{"a": 1, "a": 2 }'), { a: 2 });
});

it('Other JavaScript Object', function() {
  assert.throws(function() { JSONParser.parse('undefined'); });
});

it('not empty', function() {
  assert.throws(function() { JSONParser.parse(''); });
  assert.throws(function() { JSONParser.parse('/**/', { comment: true }); });
  assert.throws(function() { JSONParser.parse('//', { comment: true }); });
});

it('one value', function() {
  assert.throws(function() { JSONParser.parse('{}{}'); });
});

it('Comment', function() {
  assert.deepEqual(JSONParser.parse('//\n{}', { comment: true }), {});
  assert.deepEqual(JSONParser.parse('/* [] */{}', { comment: true }), {});
  assert.deepEqual(JSONParser.parse('"abc"/* ["] */', { comment: true }), 'abc');
  assert.throws(function() { JSONParser.parse('{}/*', { comment: true }); });
});
