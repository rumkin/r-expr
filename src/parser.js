function createParserState(ast = createAst()) {
  return {
    ast,
    // current,
  };
}

function createAst() {
  return {
    type: 'Program',
    body: [],
  };
}

function parse(state, tokens) {
  let current = 0;
  // let isEnded = false;

  const hasNext = () => tokens.length > (current + 1);
  const getNext = () => tokens[current + 1];
  const nextIs = (type) => getNext().type === type;
  const nextValue = (value) => getNext().value === value;
  const areNeibours = (before, after) => before.location.end.index === after.location.start.index;

  const walk = () => {
    let token = tokens[current];

    if (token.type === 'comment') {
      current +=1;

      return {
        type: 'Comment',
        text: token.value,
        location: token.location,
      };
    }
    else if (token.type === 'string') {
      current += 1;

      return {
        type: 'StringLiteral',
        value: token.value,
        location: token.location,
      };
    }
    else if (token.type === 'symbol') {
      if (hasNext() && nextIs('paren') && nextValue('(') && areNeibours(token, getNext())) {
        const node = {
          type: 'CallExpression',
          name: token.value,
          params: [],
          location: {
            start: {
              ...token.location.start,
            },
          },
        };

        token = tokens[current+=2];
        while (token.type !== 'paren' || token.value !== ')') {
          node.params.push(
            walk()
          );
          token = tokens[current];
          if (! token) {
            throw new Error('Unexpected end of tokens');
          }
        }
        ++current;
        node.location.end = {...token.location.end};
        return node;
      }
      else {
        ++current;

        return {
          type: 'SymbolLiteral',
          value: token.value,
          location: token.location,
        };
      }
    }
    else if (token.type === 'paren') {
      if (token.value !== '(') {
        throw new TypeError(`Unexpected closing parenthesis`);
      }

      if (! hasNext()) {
        throw new TypeError('Unexpected end of input');
      }

      const node = {
        type: 'ListExpression',
        location: token.location,
        elements: [],
        location: {
          start: {
            ...token.location.start,
          },
        },
      };
      token = tokens[current += 1];
      while (token.type !== 'paren' || token.value !== ')') {
        node.elements.push(
          walk()
        );
        token = tokens[current];
        if (! token) {
          throw new Error('Unexpected end of tokens');
        }
      }
      ++current;
      node.location.end = {...token.location.end};
      return node;
    }
    else {
      throw TypeError(`Unexpected token type "${token.type}"`);
    }
  };

  while (current < tokens.length) {
    state.ast.body.push(walk());
  }

  return state;
}

exports.parse = parse;
exports.createParserState = createParserState;
