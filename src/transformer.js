const {
  Program,
  CallExpression,
} = require('./types');

function transform(ast, visitor) {
  return transformNode(ast, {
    parent: null,
    path: [],
  }, visitor);
}

class Visitor {
  constructor(parent, path, replaceWith) {
    this.parent = parent;
    this.path = path;
    this.replaceWith = replaceWith;
  }
}

class Context {
  constructor(parent, path) {
    this.parent = parent;
    this.path = path;
  }
}

function transformNode(node, ctx, visitor) {
  let transformChildren = true;

  if (node.type in visitor) {
    visitor[node.type](new Visitor(
      ctx.parent,
      ctx.path,
      (newNode, stop = false) => {
        node = newNode;
        ctx = new Context(
          ctx.parent,
          [...ctx.path.slice(0, -1), node.type],
        );

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
      return new Program(children);
    }
    break;
  }
  case 'CallExpression': {
    const children = traverseChildren(node.list, node.list.items, new Context(node.list), visitor);

    if (node.list.items !== children) {
      return new CallExpression(
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
      const newNode = transformNode(childNode, new Context(node, [...ctx.path, childNode.type]), visitor);
      if (newNode !== childNode) {
        hasChanges = true;
      }
      newChildren[i] = newNode;
    }
  );
  return hasChanges ? newChildren : children;
}

// function programModifier(node, children) {
//   node.body.push(...children);
// }
//
// function callModifier(node, children) {
//   node.list.items.push(...children);
// }
//
// function listModifier(node, children) {
//   node.items.push(...children);
// }

// function getModifierByType(type) {
//   switch (type) {
//   case 'Program':
//     return programModifier;
//   case 'CallExpression':
//     return callModifier;
//   case 'RoundListExpression':
//   case 'SquareListExpression':
//   case 'FigureListExpression':
//     return listModifier;
//   default:
//     throw new Error(`Modifier for type "${type}" not defined`);
//   }
// }

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
