function transform(ast, visitor) {
  let newAst;
  transformNode(ast, {
    parent: null,
    path: [],
    addChildren(node, [result]) {
      newAst = result;
    },
  }, visitor);

  return newAst;
}

class Visitor {
  constructor(parent, path, replaceWith, setModifier) {
    this.parent = parent;
    this.path = path;
    this.replaceWith = replaceWith;
    this.setModifier = setModifier;
  }
}

class Context {
  constructor(parent, path, result, addChildren) {
    this.parent = parent;
    this.path = path;
    this.result = result;
    this.addChildren = addChildren;
  }
}

function transformNode(node, ctx, visitor) {
  let result;
  let addChildren;

  if (node.type in visitor) {
    visitor[node.type](new Visitor(
      ctx.parent,
      ctx.path,
      (newNode) => {
        result = newNode;
      },
      (newModifier) => {
        addChildren = newModifier;
      },
    ), node);
  }
  else if (isContainerNode(node)) {
    addChildren = getModifierByType(node.type);
  }

  if (! result) {
    result = copyNode(node);
  }

  if (isContainerNode(node) && addChildren) {
    const nextCtx = new Context(
      node,
      [...ctx.path, node.type],
      result,
      addChildren,
    );

    switch (node.type) {
    case 'Program':
      node.body.forEach(
        (childNode) => transformNode(childNode, nextCtx, visitor)
      );
      break;
    case 'CallExpression':
      node.params.forEach(
        (childNode) => transformNode(childNode, nextCtx, visitor)
      );
      break;
    case 'ListExpression':
      node.elements.forEach(
        (childNode) => transformNode(childNode, nextCtx, visitor)
      );
      break;
    }
  }

  ctx.addChildren(
    ctx.result,
    Array.isArray(result) ? result : [result]
  );
}

function programModifier(node, children) {
  node.body.push(...children);
}

function callModifier(node, children) {
  node.params.push(...children);
}

function listModifier(node, children) {
  node.elements.push(...children);
}

function getModifierByType(type) {
  switch (type) {
  case 'Program':
    return programModifier;
  case 'CallExpression':
    return callModifier;
  case 'ListExpression':
    return listModifier;
  default:
    throw new Error(`Modifier for type "${type}" not defined`);
  }
}

function isContainerNode(node) {
  return [
    'Program',
    'CallExpression',
    'ListExpression',
  ].includes(node.type);
}

function copyNode(origin) {
  const node = {...origin};

  switch (node.type) {
  case 'CallExpression':
    node.params = [];
    break;
  case 'ListExpression':
    node.elements = [];
    break;
  case 'Program':
    node.body = [];
    break;
  }

  return node;
}

exports.transform = transform;
