treeNodes = require("./treeNodes");
execution = require("./execution");
fs = require("file-system");
peg = require("pegjs");

function generateExprNodeChildren(node, params) {
	let leftParams = params[0];
	if (!leftParams.type && leftParams.length > 1) {
		leftParams = leftParams[1];
	}
	const leftSide = generateNode(leftParams);
	node.leftSide = leftSide;
	leftSide.parent = node;
	let rightParams = params[2];
	if (!rightParams.type && rightParams.length > 1) {
		rightParams = rightParams[1];
	}
	const rightSide = generateNode(rightParams);
	node.rightSide = rightSide;
	rightSide.parent = node;
}

function generateNode(statement) {
	if (!statement.type) {
		return {};
	}

	let newNode = {};
	switch(statement.type) {
		case "function":
			const body = statement.body;
				// TODO: generateNode for statement.body
			newNode = new treeNodes.FunctionNode(statement.fcn_name);
			const params = statement.params.map(p => generateNode(p)).filter(p => !!p && !!p.type);
			const paramsNode = new treeNodes.ParamsNode(params);
			newNode.params = paramsNode;
			paramsNode.parent = newNode;
			newNode.body = body;
			// body.parent = newNode;
			break;
		case "integer":
			newNode = new treeNodes.ValueNode(statement.value);
			break;
		case "identifier":
			newNode = new treeNodes.IdentifierNode(statement.name);
			break;
		case "arithmetic_expr":
			const operator = statement.params[1];
			newNode = new treeNodes.ArithmeticExprNode(operator);
			generateExprNodeChildren(newNode, statement.params);
			break;
		case "boolean_expr":
			const op = statement.params[1];
			newNode = new treeNodes.BooleanExprNode(op);
			generateExprNodeChildren(newNode, statement.params);
			break;
		case "variable_dec":
			newNode = new treeNodes.VariableDecNode();
			statement.declarations.forEach(d => {
				const decNode = generateNode(d);
				newNode.declarations.push(decNode);
				decNode.parent = newNode;
			});
			break;
		case "assignment":
			newNode = new treeNodes.AssignmentNode(statement.name);
			const exprNode = generateNode(statement.expr);
			newNode.expr = exprNode;
			exprNode.parent = newNode;
			break;
		case "if":
			newNode = new treeNodes.IfNode();
			newNode.evaluation = generateNode(statement.evaluation);
			newNode.statements = statement.statements.map(s => {
				statementNode = generateNode(s);
				statementNode.parent = newNode;
				return statementNode;
			});
			newNode.elseStatements = statement.else_statements.map(s => {
				statementNode = generateNode(s);
				statementNode.parent = newNode;
				return statementNode;
			});
			break;
		default: 
			console.log(`${statement.type} is an invalid statement type`);
	}
	return newNode;
}

function generateASTNodes(ast) {
	const rootNode = new treeNodes.RootNode();
	nodes = ast.map(statement => generateNode(statement));
	rootNode.addStatements(nodes);
	return rootNode;
}

function executeAST(rootNode) {
	rootNode.statements.forEach(s => execution.ExecuteStatement(s));
}

// const codeExample = 
// "print(1)            #=> 1\n" +
// "print(3 - 1)        #=> 2\n" +
// "print(2+1)          #=> 3\n" +
// "print(2 * 5 - 3*2)  #=> 4\n" +
// "print(4 - -1)       #=> 5\n" +
// "print(5--1)         #=> 6\n" +
// "print(21/3)         #=> 7\n" +
// "print((3-1)*(3+1))  #=> 8\n";

// const codeExample =
// `let a = 3\n
// let b = 4\n\n
// print(b-a)          #=> 1\n
// print(a-1)          #=> 2\n
// print(2+b/a)        #=> 3\n
// print(b)            #=> 4\n\n
// a = a + b\n
// b = b-a\n\n
// print(a)            #=> 7\n
// print(b)            #=> -3\n\n
// let c = a\n
// a = b\n
// b = c\n\n
// print(a)            #=> -3\n
// print(b)            #=> 7\n`;

// const codeExample = 
// `let a = 1\n
// print(a)          #=> 1\n
// let b = a+2\n
// print(b)          #=> 3\n
// let c = a+b\n
// print(c)          #=> 4\n\n
// # multiple declarations in a single let\n\n
// let e = 99, f = 100, g = e+f\n
// print(e,f,g)   #=> 99|100|199\n\n
// # on multiple lines\n\n
// let h = 99,\n
//     i = 200,\n
//     j = h+i\n
// print(h,i,j)   #=> 99|200|299\n`;

const codeExample = 
`if 1 {\n
  print(99)\n
}\n
else {\n
  print(100)\n
}                                        #=> 99\n
# 'if' as an expression\n
print(if 1 { 99 } else { 100 })          #=> 99\n
print(if 0 { 99 } else { 100 })          #=> 100\n\n
# try relops\n\n
print(if 9 < 10 { 1  } else { -1 })      #=> 1\n
print(if 10 < 9 { -1 } else {  1 })      #=> 1\n
print(if 9 < 9  { -1 } else {  1 })      #=> 1\n
print(if  9 <= 10 {  1 } else { -1 })    #=> 1\n
print(if 10 <=  9 { -1 } else {  1 })    #=> 1\n
print(if  9 <=  9 {  1 } else { -1 })    #=> 1\n\n
print(if  9 >= 10 { -1 } else {  1 })    #=> 1\n
print(if 10 >=  9 {  1 } else { -1 })    #=> 1\n
print(if  9 >=  9 {  1 } else { -1 })    #=> 1\n\n
print(if  9 > 10 { -1 } else {  1 })     #=> 1\n
print(if 10 >  9 {  1 } else { -1 })     #=> 1\n
print(if  9 >  9 { -1 } else {  1 })     #=> 1\n\n
print(if  9 ==  9 {  1 } else { -1 })    #=> 1\n
print(if  9 == 10 { -1 } else {  1 })    #=> 1\n
print(if  9 !=  9 { -1 } else {  1 })    #=> 1\n
print(if  9 != 10 {  1 } else { -1 })    #=> 1\n
`;

fs.readFile("grammar.txt", "utf8", function (err, data) {
	if (err) {
		throw err;
		return;
	}

	const grammar = data;
	const parser = peg.generate(grammar);
	const ast = parser.parse(codeExample);
	fs.writeFile("ast.json", JSON.stringify(ast, null, "\t"), function(err) {
		if (err) { console.log(err); }
	})
	const rootNode = generateASTNodes(ast);
	executeAST(rootNode)
});

// run w/ node main.js