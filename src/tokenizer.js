const {Token} = require('./types');

function createTokenizerState({offset={line:1, pos:0}} = {}) {
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
    charsEaten: 0,
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

function isWhiteSpace(char) {
  return char === NL || char === SPACE;
}

function unescapeSymbol(char) {
  switch (char) {
  case OPEN_PAREN:
  case COMMENT_START:
  case SPACE:
  case STRING_START:
  case ESCAPE_START:
    return char;
  default: null;
  }
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
          index: substate.start.index + (substate.charsEaten || value.length),
          line,
          pos,
        },
      ));
    }
    else {
      const index = getIndex();
      const end = {index: index + value.length};
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
      pos = 0;
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
          substate.charsEaten = 1;
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
            const unescaped = unescapeSymbol(char);
            if (unescaped === null) {
              throw new Error(`Unexpected escape sequence "\\${char}"`);
            }

            substate.hasSequence = false;
            substate.value += ' ';
          }
          else if (NON_SYMBOL.includes(char)) {
            endState();
            // TODO Replace with stepback
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
            substate.charsEaten += 1;
            substate.value += value;
            substate.hasSequence = false;
          }
          else if (char === '\'') {
            substate.charsEaten += 1;
            endState();
          }
          else if (char === EOF) {
            endState();
          }
          else if (char === '\\') {
            substate.charsEaten += 1;
            substate.hasSequence = true;
          }
          else {
            substate.charsEaten += 1;
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
