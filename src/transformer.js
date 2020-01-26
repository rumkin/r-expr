function transform(ast, visitor) {
  return transformNode(ast, new Context(null), visitor);
}

class Visitor {
  constructor(parent, path, replaceWith) {
    this.parent = parent;
    this.replaceWith = replaceWith;
  }
}

class Context {
  constructor(parent) {
    this.parent = parent;
  }
}

function transformNode(node, ctx, visitor) {
  let transformChildren = true;

  if (node.type in visitor) {
    visitor[node.type](new Visitor(
      ctx.parent,
      (newNode, stop = false) => {
        node = newNode;

        if (stop) {
          transformChildren = false;
        }
      },
    ), node);
  }

  if (isContainerNode(node) && transformChildren) {
    return transformChildNodes(node, ctx, visitor);
  }
  else {
    return node;
  }
}

function transformChildNodes(node, ctx, visitor) {
  switch (node.type) {
  case 'Program': {
    const children = traverseChildren(node, node.body, ctx, visitor);

    if (node.body !== children) {
      return new node.constructor(children);
    }
    break;
  }
  case 'CallExpression': {
    const children = traverseChildren(node.list, node.list.items, new Context(node.list), visitor);

    if (node.list.items !== children) {
      return new node.constructor(
        node.callee,
        new node.list.constructor(children, node.list.loc),
        node.loc,
      );
    }
    break;
  }
  case 'RoundListExpression':
  case 'SquareListExpression':
  case 'FigureListExpression': {
    const children = traverseChildren(node, node.items, ctx, visitor);

    if (node.items !== children) {
      return new node.constructor(children, node.loc);
    }
    break;
  }
  }

  return node;
}

function traverseChildren(node, children, ctx, visitor) {
  const newChildren = new Array(children.length);
  let hasChanges = false;

  children.forEach(
    (childNode, i) => {
      const newNode = transformNode(childNode, new Context(node), visitor);
      if (newNode !== childNode) {
        hasChanges = true;
      }
      newChildren[i] = newNode;
    }
  );
  return hasChanges ? newChildren : children;
}

function isContainerNode(node) {
  return [
    'Program',
    'CallExpression',
    'RoundListExpression',
    'SquareListExpression',
    'FigureListExpression',
  ].includes(node.type);
}

exports.transform = transform;
