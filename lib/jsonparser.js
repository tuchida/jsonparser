/**
 * @param {String} text JSON text
 * @param {{comment: boolean lastComma: boolean}=} opt_allows options
 */
exports.parse = function(text, opt_allows) {
  var pos = 0;
  var allowComment = opt_allows && opt_allows.comment;
  var allowLastComma = opt_allows && opt_allows.lastComma;

  function getChar() {
    return text[pos++];
  }
  function ungetChar(/* unused */c) {
    pos--;
  }
  function peekChar() {
    return text[pos];
  }
  function eof() {
    return pos >= text.length;
  }
  function expect(s) {
    for (var i = 0, c; c = s[i]; i++) {
      if (c !== getChar()) {
        error();
      }
    }
  }
  function error() {
    throw new SyntaxError('invalid JSON');
  }

  function parseString() {
    var result = '';
    var c;
    while ((c = getChar())) {
      if (c === '"') {
        return result;
      } else if (c === '\\') {
        switch (getChar()) {
        case '"':   // quotation mark U+0022
          result += '"';
          break;
        case '\\':  // reverse solidus U+005C
          result += '\\';
          break;
        case '/':   // solidus U+002F
          result += '/';
          break;
        case 'b':   // backspace U+0008
          result += '\u0008';
          break;
        case 'f':   // form feed U+000C
          result += '\u000C';
          break;
        case 'n':   // line feed U+000A
          result += '\u000A';
          break;
        case 'r':   // carriage return U+000D
          result += '\u000D';
          break;
        case 't':   // tab U+0009
          result += '\u0009';
          break;
        case 'u':   // 4HEXDIG
          var digits = '';
          for (var i = 0; i < 4; i++) {
            var c = getChar();
            if (!('0' <= c && c <= '9') &&
                !('A' <= c && c <= 'F') &&
                !('a' <= c && c <= 'z')) {
              error();
            }
            digits += c;
          }
          result += String.fromCharCode(parseInt(digits, 16));
        }
      } else if (c < '\u0020') {  // control charactor
        error();
      } else {
        result += c;
      }
    }
    return error();
  }

  function parseNumber(c) {
    var str = c;
    var decimal = false;

    if (c === '-' && peekChar() === '0') {
      error();
    }

    while ((c = getChar())) {
      if ('0' <= c && c <= '9') {
        str += c;
      } else if (c === '.') {
        str += c;
        decimal = true;
        break;
      } else {
        ungetChar(c);
        break;
      }
    }

    if (decimal) {
      var isExponent = false;
      while ((c = getChar())) {
        if ('0' <= c && c <= '9') {
          str += c;
        } else if (c === 'e' || c === 'E') {
          str += c;
          isExponent = true;
          break;
        } else {
          ungetChar(c);
          break;
        }
      }

      if (isExponent) {
        var c = peekChar();
        if (c === '+' || c === '-') {
          str += getChar();
        }
        while ((c = getChar())) {
          if ('0' <= c && c <= '9') {
            str += c;
          } else {
            ungetChar(c);
            break;
          }
        }
      }
    }

    var result = Number(str);
    if (isNaN(result)) {
      error();
    }
    return result;
  }

  function parseArray() {
    var result = [];
    var obj = undefined;

    skip();
    var c = getChar();
    if (c === ']') {
      return result;
    }

    do {
      if (c === ']') {
        if (obj !== undefined) {
          result.push(obj);
        } else if (!allowLastComma) {
          error();
        }
        return result;
      } else if (c === ',') {
        if (obj === undefined) {
          error();
        }
        result.push(obj);
        obj = undefined;
      } else {
        ungetChar(c);
        obj = parse();
      }
      skip();
    } while ((c = getChar()));
    return error();
  }

  function parseObject() {
    var result = {};
    var key = undefined;
    var value = undefined;

    function put() {
      if (value === undefined) {
        error();
      } else {
        result[key] = value;
      }
      key = undefined;
      value = undefined;
    }

    skip();
    var c = getChar();
    if (c === '}') {
      return result;
    }

    do {
      if (c === '}') {
        if (key !== undefined) {
          put();
        } else if (!allowLastComma) {
          error();
        }
        return result;
      } else if (c === ',') {
        if (key === undefined) {
          error();
        }
        put();
      } else if (c === ':') {
        if (key === undefined && value !== undefined) {
          error();
        }
        skip();
        value = parse();
      } else if (c === '"') {
        if (key !== undefined && value !== undefined) {
          error();
        }
        key = parseString();
      } else {
        error();
      }
      skip();
    } while ((c = getChar()))
    return error();
  }

  function skipComment() {
    if (peekChar() === '/') {
      var c = getChar();
      switch (peekChar()) {

      // single line comment
      case '/':
        getChar();
        while ((c = getChar())) {
          if (c === '\u000A' || c === '\u000D') {
            break;
          }
        }
        return true;

      // multi line comment
      case '*':
        getChar();
        while ((c = getChar())) {
          if (c === '*') {
            if (peekChar() === '/') {
              getChar();
              return true;
            }
          }
        }
        error();

      default:
        ungetChar(c);
      }
    }
    return false;
  }

  function skipWhiteSpace() {
    switch (peekChar()) {
    case '\u0020': // Space
    case '\u0009': // Horizontal tab
    case '\u000A': // Line feed or New line
    case '\u000D': // Carriage return
      getChar();
      return true;
    default:
      return false;
    }
  }

  function skip() {
    while (skipWhiteSpace() || (allowComment && skipComment())) {}
  }

  function parse() {
    var c = getChar();
    switch (c) {

    // String
    case '"':
      return parseString();

    // Number
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
    case '-':
      return parseNumber(c);

    // Array
    case '[':
      return parseArray();

    // Object
    case '{':
      return parseObject();

    // boolean
    case 't':
      expect('rue');
      return true;
    case 'f':
      expect('alse');
      return false;

    // null
    case 'n':
      expect('ull');
      return null;
    }
    return error();
  }

  skip();
  var result = parse();
  skip();
  if (!eof()) {
    error();
  }
  return result;
};
