
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

class CommentLiteral extends AstNode {
  constructor(text, location) {
    super('CommentLiteral');

    this.text = text;
    this.loc = location;
  }

  clone() {
    return new this.constructor(this.text, this.loc);
  }
}

class StringLiteral extends AstNode {
  constructor(value, location) {
    super('StringLiteral');

    this.value = value;
    this.loc = location;
  }

  clone() {
    return new this.constructor(this.value, this.loc);
  }
}

class SymbolLiteral extends AstNode {
  constructor(value, location) {
    super('SymbolLiteral');

    this.value = value;
    this.loc = location;
  }

  clone() {
    return new this.constructor(this.value, this.loc);
  }
}

class CallExpression extends AstNode {
  constructor(callee, params, location) {
    super('CallExpression');

    this.callee = callee;
    this.params = params || [];
    this.loc = location;
  }

  clone() {
    return new this.constructor(
      this.callee.clone(),
      this.params.map((node) => node.clone()),
      this.loc
    );
  }
}

class ListExpression extends AstNode {
  constructor(elements, location) {
    super('ListExpression');

    this.elements = elements || [];
    this.loc = location;
  }

  clone() {
    return new this.constructor(
      this.elements.map((node) => node.clone()),
      this.loc
    );
  }
}

class Token {
  constructor(type, value, start, end) {
    this.type = type;
    this.value = value;
    this.loc = new Location(start, end);
  }
}

class Location {
  constructor(start, end) {
    this.start = new Coordinate(start.line, start.pos, start.index);
    this.end = new Coordinate(end.line, end.pos, end.index);

    Object.freeze(this);
  }

  setStart(start) {
    return new this.constructor(start, this.end);
  }

  setEnd(end) {
    return new this.constructor(this.start, end);
  }
}

class Coordinate {
  constructor(line, pos, index) {
    this.line = line;
    this.pos = pos;
    this.index = index;
    Object.freeze(this);
  }

  toString() {
    return `${this.line}:${this.pos}`;
  }
}

exports.AstNode = AstNode;
exports.Program = Program;
exports.CommentLiteral = CommentLiteral;
exports.SymbolLiteral = SymbolLiteral;
exports.StringLiteral = StringLiteral;
exports.CallExpression = CallExpression;
exports.ListExpression = ListExpression;
exports.Token = Token;
exports.Location = Location;
exports.Coordinate = Coordinate;
