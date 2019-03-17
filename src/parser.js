function createParserState(ast = new Program()) {
  return {
    ast,
    // current,
  };
}

class AstNode {
  constructor(type) {
    this.type = type;
  }

  clone() {
    throw new Error('Clone is not implemented yet');
  }
}

class Program extends AstNode {
  constructor(body = []) {
    super('Program');

    this.body = body;
  }

  clone() {
    return new this.constructor(
      this.body.map((node) => node.clone())
    );
  }
}

class Comment extends AstNode {
  constructor(text, location) {
    super('Comment');

    this.text = text;
    this.location = location;
  }

  clone() {
    return new this.constructor(this.text, this.location);
  }
}

class StringLiteral extends AstNode {
  constructor(value, location) {
    super('StringLiteral');

    this.value = value;
    this.location = location;
  }

  clone() {
    return new this.constructor(this.value, this.location);
  }
}

class SymbolLiteral extends AstNode {
  constructor(value, location) {
    super('SymbolLiteral');

    this.value = value;
    this.location = location;
  }

  clone() {
    return new this.constructor(this.value, this.location);
  }
}

class CallExpression extends AstNode {
  constructor(callee, params, location) {
    super('CallExpression');

    this.callee = callee;
    this.params = params || [];
    this.location = location;
  }

  clone() {
    return new this.constructor(
      this.callee.clone(),
      this.params.map((node) => node.clone()),
      this.location
    );
  }
}

class ListExpression extends AstNode {
  constructor(elements, location) {
    super('ListExpression');

    this.elements = elements || [];
    this.location = location;
  }

  clone() {
    return new this.constructor(
      this.elements.map((node) => node.clone()),
      this.location
    );
  }
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

      return new Comment(token.value, token.location);
    }
    else if (token.type === 'string') {
      current += 1;

      return new StringLiteral(token.value, token.location);
    }
    else if (token.type === 'symbol') {
      if (hasNext() && nextIs('paren') && nextValue('(') && areNeibours(token, getNext())) {
        const node = new CallExpression(new SymbolLiteral(token.value, token.location), [], {
          start: {...token.location.start},
        });

        token = tokens[current+=2];
        while (token.type !== 'paren' || token.value !== ')') {
          node.params.push(walk());
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

        return new SymbolLiteral(token.value, token.location);
      }
    }
    else if (token.type === 'paren') {
      if (token.value !== '(') {
        throw new TypeError(`Unexpected closing parenthesis at ${getLocation(token)}`);
      }

      if (! hasNext()) {
        throw new TypeError('Unexpected end of input');
      }

      const node = new ListExpression([], {
        start: {
          ...token.location.start,
        },
      });
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
      throw TypeError(`Unexpected token type "${token.type}" at ${getLocation(token)}`);
    }
  };

  while (current < tokens.length) {
    state.ast.body.push(walk());
  }

  return state;
}

function getLocation({location}) {
  return `${location.start.line}:${location.start.pos}`;
}

exports.parse = parse;
exports.createParserState = createParserState;
