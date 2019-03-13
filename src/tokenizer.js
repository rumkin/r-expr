function createTokenizerState({offset={line:1, pos:1}} = {}) {
  return {
    line: offset.line,
    pos: offset.pos,
    index: 0,
    substate: null,
    tokens: [],
  };
}

function createSubState({type, value = '', start: {index, line, pos}}) {
  return {
    type,
    value,
    hasSequence: false,
    sequence: '',
    start: {index, line, pos},
  };
}

const T_SYMBOL = 'symbol';
const T_STRING = 'string';
const T_COMMENT = 'comment';
const T_PAREN = 'paren';
// const T_EOF = 'eof';

const EOF = '\0';
const OPEN_PAREN = '(';
const CLOSE_PAREN = ')';
const NL = '\n';
const SPACE = ' ';
const COMMENT_START = ';';
const STRING_START = '\'';
const NON_SYMBOL = [
  OPEN_PAREN,
  CLOSE_PAREN,
  NL,
  SPACE,
  COMMENT_START,
  STRING_START,
  EOF,
];
const ESCAPE_START = '\\';

class Token {
  constructor(type, value, start, end) {
    this.type = type;
    this.value = value;
    this.location = {start, end};
  }
}

function isWhiteSpace(char) {
  return char === NL || char === SPACE;
}

function unescape(v) {
  switch (v) {
  case 'n': return '\n';
  case 'r': return '\r';
  case 't': return '\t';
  case '\\': return '\\';
  case '\'': return '\'';
  default:
    return null;
  }
}

/* eslint-disable max-statements */
/* eslint-disable max-depth */
function tokenize(state, str, isLast = true) {
  let line = state.line;
  let pos = state.pos;
  let i = 0;

  if (isLast) {
    str += '\0';
  }

  let needIncrease = false;
  let {substate} = state;
  const tokens = [];

  const getIndex = () => i + state.index;

  const newToken = (type, value) => {
    if (substate) {
      tokens.push(new Token(
        substate.type,
        value,
        substate.start,
        {
          index: getIndex(),
          line,
          pos,
        },
      ));
    }
    else {
      const index = getIndex();
      let end = {index: index + value.length};
      if (value === NL) {
        end.line = line + 1;
        end.pos = 1;
      }
      else {
        end.line = line;
        end.pos = pos + 1;
      };

      tokens.push(new Token(
        type,
        value,
        {index, line, pos},
        end,
      ));
    }
  };

  const startState = (type, value = '') => {
    substate = createSubState({
      type,
      value,
      start: {index: getIndex(), line, pos},
    });
  };

  const endState = () => {
    newToken(
      substate.type,
      substate.value
    );
    substate = null;
  };

  scanLoop:
  for (; i < str.length; i++) {
    const char = str[i];

    if (needIncrease) {
      line += 1;
      pos = 1;
      needIncrease = false;
    }
    else {
      pos += 1;
    }

    const isNewLine = (char === NL);
    if (isNewLine) {
      needIncrease = true;
    }

    charLoop:
    while (true) {
      if (! substate) {
        // Parse from root
        if (char === OPEN_PAREN) {
          newToken(T_PAREN, OPEN_PAREN);
        }
        else if (char === CLOSE_PAREN) {
          newToken(T_PAREN, CLOSE_PAREN);
        }
        else if (char === EOF) {
          // SKIP token
        }
        else if (char === COMMENT_START) {
          startState(T_COMMENT);
        }
        else if (char === STRING_START) {
          startState(T_STRING);
        }
        else if (! isWhiteSpace(char)) {
          startState(T_SYMBOL, char);
        }
        continue scanLoop;
      }
      else {
        switch (substate.type) {
        case T_SYMBOL: {
          if (substate.hasSequence) {
            if (char === SPACE) {
              substate.hasSequence = false;
              substate.value += ' ';
            }
            else {
              throw new Error(`Unexpected escape sequence "\\${char}"`);
            }
          }
          else if (NON_SYMBOL.includes(char)) {
            endState();
            continue charLoop;
          }
          else if (char === ESCAPE_START) {
            substate.hasSequence = true;
          }
          else {
            substate.value += char;
          }
          continue scanLoop;
        }
        case T_STRING: {
          if (substate.hasSequence) {
            const value = unescape(char);
            if (value === null) {
              throw new Error(`Unknown escape sequence "\\${char}"`);
            }
            substate.value += value;
            substate.hasSequence = false;
          }
          else if (char === '\'' || char === EOF) {
            endState();
          }
          else if (char === '\\') {
            substate.hasSequence = true;
          }
          else {
            substate.value += char;
          }
          continue scanLoop;
        }
        case T_COMMENT: {
          if (isNewLine || char === EOF) {
            endState();
          }
          else {
            substate.value += char;
          }
          continue scanLoop;
        }
        default:
          throw new Error(
            `Unexpeted token ${substate.type} ${line}:${pos}`
          );
        }
      }
    }
  }

  state.line = line;
  state.pos = pos;
  state.index += str.length;
  state.substate = substate;
  state.tokens.push(...tokens);

  return state;
}
/* eslint-enable max-statements */
/* eslint-enable max-depth */

exports.tokenize = tokenize;
exports.createTokenizerState = createTokenizerState;
