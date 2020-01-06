function traverseArray(nodes, parent, visitor) {
  nodes.forEach((node) => traverseNode(node, parent, visitor));
}

function traverseNode(node, parent, visitor) {
  const visit = visitor[node.type];
  if (visit) {
    visit(node, parent);
  }

  switch (node.type) {
  case 'Program':
    traverseArray(node.body, node, visitor);
    return;
  case 'CallExpression':
    traverseNode(node.callee, node, visitor);
    traverseArray(node.list.items, node, visitor);
    return;
  case 'RoundListExpression':
  case 'SquareListExpression':
  case 'FigureListExpression':
    traverseArray(node.items, node, visitor);
    return;
  case 'SymbolLiteral':
  case 'StringLiteral':
  case 'CommentLiteral':
    return;
  default:
    throw new TypeError(`Unknown node type: ${node.type}`);
  }
}

function traverse(ast, visitor) {
  traverseNode(ast, null, visitor);

  return ast;
}

exports.traverse = traverse;
