const {Token, Source} = require('./types');

function createTokenizerState({
  offset = {line:1, pos:0},
  source = new Source(':'),
} = {}) {
  return {
    line: offset.line,
    pos: offset.pos,
    index: 0,
    substate: null,
    tokens: [],
    source: source,
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

const EOF = '\0';
const ROUND_PAREN_LEFT = '(';
const ROUND_PAREN_RIGHT = ')';
const SQUARE_PAREN_LEFT = '[';
const SQUARE_PAREN_RIGHT = ']';
const FIGURE_PAREN_LEFT = '{';
const FIGURE_PAREN_RIGHT = '}';
const NL = '\n';
const SPACE = ' ';
const COMMENT_START = ';';
const STRING_START = '\'';
const NON_SYMBOL = [
  ROUND_PAREN_LEFT,
  ROUND_PAREN_RIGHT,
  SQUARE_PAREN_LEFT,
  SQUARE_PAREN_RIGHT,
  FIGURE_PAREN_LEFT,
  FIGURE_PAREN_RIGHT,
  NL,
  SPACE,
  COMMENT_START,
  STRING_START,
  EOF,
];
const ESCAPE_START = '\\';

function unescapeSymbol(char) {
  switch (char) {
  case ROUND_PAREN_LEFT:
  case SQUARE_PAREN_LEFT:
  case FIGURE_PAREN_LEFT:
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
  let source = state.source;
  let line = state.line;
  let pos = state.pos;
  let i = 0;

  if (isLast) {
    str += '\0';
  }

  let hasNewLine = false;
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
        source,
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
        source,
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
      substate.value,
    );
    substate = null;
  };

  scanLoop:
  for (; i < str.length; i++) {
    const char = str[i];

    if (hasNewLine) {
      line += 1;
      pos = 0;
      hasNewLine = false;
    }
    else {
      pos += 1;
    }

    const isNewLine = (char === NL);
    if (isNewLine) {
      hasNewLine = true;
    }

    charLoop:
    while (true) {
      if (! substate) {
        // Parse from root
        switch (char) {
        case ROUND_PAREN_LEFT:
        case ROUND_PAREN_RIGHT:
        case SQUARE_PAREN_LEFT:
        case SQUARE_PAREN_RIGHT:
        case FIGURE_PAREN_LEFT:
        case FIGURE_PAREN_RIGHT: {
          newToken(T_PAREN, char);
          break;
        }
        case COMMENT_START: {
          startState(T_COMMENT);
          break;
        }
        case STRING_START: {
          startState(T_STRING);
          substate.charsEaten = 1;
          break;
        }
        case EOF:
        case NL:
        case SPACE: {
          break;
        }
        default: {
          startState(T_SYMBOL, char);
        }
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
