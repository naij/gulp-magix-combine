var acorn = require('./acorn.js');
var acorn_walk = require('./acorn_walk.js');

var isKissy = function(t) {
    return t.callee.object && t.callee.object.type == 'Identifier' && t.callee.type == 'MemberExpression' && t.callee.object.name == 'KISSY' && t.callee.property.type == 'Identifier' && t.callee.property.name == 'add' && ((t.arguments.length >= 2 && t.arguments[1].type == 'FunctionExpression') || (t.arguments.length >= 1 && t.arguments[0].type == 'FunctionExpression'));
};
var isDefine = function(t) {
    return t.callee.name == 'define' && t.callee.type == 'Identifier' && t.arguments.length > 1;
};
var findBestBody = function(ast) {
    var best, len = -1;
    for (var j = ast.body.length - 1; j >= 0; j--) {
        var body = ast.body[j];
        var expression = body.expression;
        var tl;
        if (body.type == 'ExpressionStatement' && expression && expression.type == 'CallExpression') {
            if (isKissy(expression)) {
                tl = expression.arguments[0].value.length;
                if (tl > len) {
                    best = expression.arguments[1].body.body;
                    len = tl;
                }
            } else if (isDefine(expression)) {
                tl = expression.arguments[0].value.length;
                if (tl > len) {
                    for (var i = 0; i < expression.arguments.length; i++) {
                        if (expression.arguments[i].type == 'FunctionExpression') {
                            best = expression.arguments[i].body.body;
                            break;
                        }
                    }
                }
            }
        }
    }
    return best;
};

module.exports = {
	removeConsoleX: function(s) {
		var ast = acorn.parse(s);
		var arr = [];

		function add(start, end) {
			for (var i = 0; i < arr.length; ++i) {
				if (arr[i][0] <= start && arr[i][1] >= end) return;
			}
			for (var i = arr.length - 1; i >= 0; --i) {
				if (arr[i][0] >= start && arr[i][1] <= end) arr.splice(i, 1);
			}
			arr.push([start, end]);
		}
		acorn_walk.simple(ast, {
			ExpressionStatement: function(node) {
				var x = node.expression;
				if (x.type == 'CallExpression' && x.callee.type == 'MemberExpression' && x.callee.object.type == 'Identifier' && x.callee.object.name == 'console') {
					add(node.start, node.end);
				}
			}
		});
		arr.sort(function(a, b) {
			return a[0] - b[0];
		});
		if (arr.length) {
			arr.push([s.length]);
			var r = '';
			if (arr[0][0] > 0) {
				r = s.slice(0, arr[0][0]);
			}
			for (var i = 1; i < arr.length; ++i) {
				r += ';' + s.slice(arr[i - 1][1], arr[i][0]);
			}
			return r;
		}
		return s;
	},
	addProp4v1: function(s, value) {
		var ast = acorn.parse(s);
		if (ast.body.length == 1) {
			var t = ast.body[0];
			if (t.type == 'ExpressionStatement') {
				t = t.expression;
				if (t.type == 'CallExpression' && t.callee.type == 'MemberExpression' && t.callee.object.type == 'Identifier' && t.callee.object.name == 'KISSY' && t.callee.property.type == 'Identifier' && t.callee.property.name == 'add' && t.arguments.length >= 2 && t.arguments[1].type == 'FunctionExpression') {
					s = 'Magix.tmpl("' + t.arguments[0].value + '",' + JSON.stringify(value) + ');\n' + s;
				}
			}
		}
		return s;
	},
	addProp4v1plus: function(s, value) {
		var ast = acorn.parse(s);
		if (ast.body.length == 1) {
			var t = ast.body[0];
			if (t.type == 'ExpressionStatement') {
				t = t.expression;
				if (t.type == 'CallExpression' && t.callee.type == 'MemberExpression' && t.callee.object.type == 'Identifier' && t.callee.object.name == 'KISSY' && t.callee.property.type == 'Identifier' && t.callee.property.name == 'add' && t.arguments.length >= 2 && t.arguments[1].type == 'FunctionExpression') {
					t = t.arguments[1].body.body; //stmts
					for (var i = 0; i < t.length; ++i) {
						if (t[i].type == 'ReturnStatement') {
							t = t[i].argument;
							var start = t.start;
							var end = t.end;
							s = s.slice(0, start) + '(function(t){t.prototype.template=' + JSON.stringify(value).replace(/[\u2028\u2029]/g, function(a) {
								return a == '\u2028' ? '\\u2028' : '\\u2029';
							}) + ';return t;})(' + s.slice(start, end) + ')' + s.slice(end);
						}
					}
				}
			}
		}
		return s;
	},
	addProp4v2: function(s, value) {
		var ast = acorn.parse(s);
        var body = findBestBody(ast);

        if (body) {
            var t = body;
            var content = JSON.stringify(value).replace(/[\u2028\u2029]/g, function(a) {
                return a == '\u2028' ? '\\u2028' : '\\u2029';
            });
            var key = '___$___temp' + new Date().getTime();
            for (var i = 0; i < t.length; ++i) {
                if (t[i].type == 'ReturnStatement') {
                    t = t[i].argument;
                    var start = t.start;
                    var end = t.end;
                    var returned = s.slice(start, end).replace(/\.extend\s*\(\s*\{/, '.extend({');

                    var tail = s.slice(end);
                    var header = s.slice(0, start);
                    header = header.slice(0, header.lastIndexOf('return'));
                    if (t.arguments && t.arguments.length && t.callee && t.callee.property && t.callee.property.name == 'extend' && t.arguments[0].type == 'ObjectExpression') {
                        var extendIdx = returned.indexOf('.extend({') + 9;
                        var extendedPre = returned.slice(0, extendIdx);
                        var extendTail = returned.slice(extendIdx + 1);
                        s = header + ' return ' + extendedPre + 'template:' + content + ',' + extendTail + tail;
                    } else {
                        s = header + ';var ' + key + '=' + returned + ';' + key + '.prototype.template=' + content + ';return ' + key + ';' + tail;
                    }
                }
            }
        }
        return s;   
    } 
};