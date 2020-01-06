const {
  Program,
  CommentLiteral,
  StringLiteral,
  SymbolLiteral,
  CallExpression,
  ListExpression,
  RoundListExpression,
  SquareListExpression,
  FigureListExpression,
} = require('./types');

function createParserState(ast = new Program()) {
  return {
    ast,
    stack: [],
    tokens: [],
  };
}

function parse(state, tokens) {
  const result = parseStream(state, tokens);

  if (result.stack.length) {
    throw new Error('Unexpected end of input');
  }
  else if (result.tokens.length !== tokens.length) {
    const token = tokens[result.tokens.length].type;
    throw new Error(
      `Unexpected parsing stop at token ${token.type} at ${token.loc.start}`
    );
  }

  return {
    ast: result.ast,
    stack: [], // Stack should be empty
    tokens, // Handled tokens should be equal tokens input
  };
}

function isParenLeft(value) {
  switch (value) {
  case '(':
  case '[':
  case '{':
    return true;
  default:
    return false;
  }
}

function isParenRight(value) {
  switch (value) {
  case ')':
  case ']':
  case '}':
    return true;
  default:
    return false;
  }
}

function getListExpression(paren) {
  switch (paren) {
  case '(':
  case ')': {
    return RoundListExpression;
  }
  case '[':
  case ']': {
    return SquareListExpression;
  }
  case '{':
  case '}': {
    return FigureListExpression;
  }
  }
}

function isMatchingParen(node, token) {
  const ctor = getListExpression(token.value);

  if (node instanceof ListExpression) {
    return node instanceof ctor;
  }
  else if (node instanceof CallExpression) {
    return node.list instanceof ctor;
  }
  else {
    return false;
  }
}

/* eslint-disable max-depth */
/* eslint-disable  max-statements */
function parseStream(state, newTokens) {
  const tokens = [...state.tokens];
  const stack = [...state.stack];
  const nodes = [...state.ast.body];

  let token;
  let stackNode = null;
  if (stack.length) {
    stackNode = stack[nodes.length];
  }

  function hasPrevToken() {
    return tokens.length > 0;
  }

  function getPrevToken() {
    return tokens[tokens.length - 1];
  }

  function isNeighbours(left, right) {
    return left.loc.end.index === right.loc.start.index;
  }

  function pushNode(node) {
    if (! stackNode) {
      nodes.push(node);
    }
    else if (stackNode.type === 'CallExpression') {
      stackNode.list.items.push(node);
    }
    else {
      stackNode.items.push(node);
    }
  }

  function popNode() {
    if (! stackNode) {
      return nodes.pop();
    }
    else if (stackNode.type === 'CallExpression') {
      return stackNode.list.items.pop();
    }
    else {
      return stackNode.items.pop();
    }
  }

  function commitSingle(node) {
    pushNode(node);
  }

  function commitNode(node) {
    pushNode(node);
    stack.push(node);
    stackNode = node;
  }

  for (let i = 0; i < newTokens.length; i++) {
    token = newTokens[i];
    switch (token.type) {
    case 'symbol': {
      if (hasPrevToken()) {
        const prev = getPrevToken();

        if (
          isNeighbours(prev, token) &&
          (prev.type !== 'paren' || ! isParenLeft(prev.value))
        ) {
          throw new Error(`Unexpected 'symbol' at ${token.loc.start}`);
        }
      }

      const node = new SymbolLiteral(token.value, token.loc);
      commitSingle(node);
      break;
    }
    case 'string': {
      if (hasPrevToken()) {
        const prev = getPrevToken();

        if (
          isNeighbours(prev, token) &&
          (prev.type !== 'paren' || prev.value !== '(')
        ) {
          throw new Error(`Unexpected 'string' at ${token.loc.start}`);
        }
      }

      const node = new StringLiteral(token.value, token.loc);
      commitSingle(node);
      break;
    }
    case 'comment' : {
      const node = new CommentLiteral(token.value, token.loc);
      commitSingle(node);
      break;
    }
    case 'paren': {
      if (isParenLeft(token.value)) {
        if (! hasPrevToken()) {
          const node = new (getListExpression(token.value))([], token.loc);
          commitNode(node);
          break;
        }

        const prev = getPrevToken();

        if (
          isNeighbours(prev, token)
        ) {
          if (prev.type === 'symbol') {
            const lastNode = popNode();
            const node = new CallExpression(lastNode, new (getListExpression(token.value))([], token.loc), lastNode.loc);

            commitNode(node);
            break;
          }
          else if (prev.type === 'paren') {
            if (isParenRight(prev.value)) {
              const lastNode = popNode();
              if (lastNode.type !== 'CallExpression') {
                throw new Error(`Unexpected 'paren' at ${token.loc.start}`);
              }

              const node = new CallExpression(lastNode, new (getListExpression(token.value))([], token.loc), lastNode.loc);
              commitNode(node);
            }
            else {
              const node = new (getListExpression(token.value))([], token.loc);
              commitNode(node);
            }
            break;
          }
          else {
            throw new Error(`Unexpected 'paren' at ${token.loc.start}`);
          }
        }
        else {
          const node = new (getListExpression(token.value))([], token.loc);
          commitNode(node);
        }
      }
      else {
        if (! stackNode) {
          throw new Error(`Unexpected token 'paren' (${token.value}) at ${token.loc.start}`);
        }

        if (! isMatchingParen(stackNode, token)) {
          throw new Error(`Unexpeted token 'paren' ("${token.value}") at ${token.loc.start}`);
        }

        stackNode.loc = stackNode.loc.setEnd(token.loc.end);
        stack.pop();
        if (stack.length) {
          stackNode = stack[stack.length - 1];
        }
        else {
          stackNode = null;
        }
      }
      break;
    }
    }
    tokens.push(token);
  }

  return {
    tokens,
    stack,
    ast: new Program(nodes),
  };
}

exports.parse = parse;
exports.parseStream = parseStream;
exports.createParserState = createParserState;
