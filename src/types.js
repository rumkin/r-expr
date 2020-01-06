
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
  constructor(callee, list, location) {
    super('CallExpression');

    this.callee = callee;
    this.list = list;
    this.loc = location;
  }

  clone() {
    return new this.constructor(
      this.callee.clone(),
      this.list.clone(),
      this.loc
    );
  }
}

class ListExpression extends AstNode {
  constructor(type, items, location) {
    super(type);

    this.items = items;
    this.loc = location;
  }

  clone() {
    return new this.constructor(
      this.items.map((node) => node.clone()),
      this.loc
    );
  }
}

class RoundListExpression extends ListExpression {
  constructor(items, location) {
    super('RoundListExpression', items || [], location);
  }
}

class SquareListExpression extends ListExpression {
  constructor(items, location) {
    super('SquareListExpression', items || [], location);
  }
}

class FigureListExpression extends ListExpression {
  constructor(items, location) {
    super('FigureListExpression', items || [], location);
  }
}

class Source {
  constructor(filename) {
    this.filename = filename;
  }
}

class Token {
  constructor(type, value, start, end, source) {
    this.type = type;
    this.value = value;
    this.loc = new Location(start, end, source);
  }
}

class Location {
  constructor(start, end, source) {
    this.start = new Cursor(start.line, start.pos, start.index);
    this.end = new Cursor(end.line, end.pos, end.index);
    this.source = source;

    Object.freeze(this);
  }

  setStart(start) {
    return new this.constructor(start, this.end, this.source);
  }

  setEnd(end) {
    return new this.constructor(this.start, end, this.source);
  }
}

class Cursor {
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
exports.RoundListExpression = RoundListExpression;
exports.SquareListExpression = SquareListExpression;
exports.FigureListExpression = FigureListExpression;
exports.Token = Token;
exports.Location = Location;
exports.Source = Source;
exports.Cursor = Cursor;
