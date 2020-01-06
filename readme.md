# R-Expressions

R-expressions or Rich Expressions is a markup language inspired by S-
and M-expressions. It's toolkit written with JavaScript. Toolkit contains:

* ✅ Tokenizer,
* ✅ Parser,
* ✅ Tree traverser,
* ✅ Tree transformer.

Tokenizer and parser support streaming mode with byte-per-byte input and could
be used for REPL creation.

## Application

R-expressions could be used for:

1. Lisp-like programming languages creation.
2. Language prototyping.
3. Transpiler creation.

## Example

```
(pseudo-lang ^1.0)

import({Console} from Core.Io)

Console.log('Hello, %s!' 'World')
```

## Types

R-Expressions contains symbols, strings, lists, calls and comments.

### Symbol

Symbol is a sequence of characters without whitespaces, single quotes or parenthesis.
While whitespace, semicolon, quote or open parenthesis could be escaped by backslash.

These are all symbols:
```
true
1_000_000
^1.*
Console.log
http://github.com/rumkin/r-expressions
~/memories/summer\ vacation\ 2019/
<node>
```


### String

String is value surrounded by single quotes `'`. Single quote within a string should be escaped with a backslash `\`. And backslash could be escaped by another backslash `\\`.

```
'This is a string'
'Hello! I\'m a string too.'
```

### Lists

List is a type which can contain other types symbols, strings, lists, and calls:

R-expressions has three types of lists round, square, and figure, this lists
are enclosed with round, square, or figure parenthesis respectively. They can be used to separate semantic.

```
; Tuple
(null true 1_234 'Hello')

; Object
{ x: 1 y: 2 z: 3 }

; Array
[ 1 2 3 4 5 ]

; Mixed
[ (1 2 {a}) ]

; Empty
()
```

> ⚠️ There should be a space between the closing parenthesis of
> a list and the opening of a following one. While this code `{} {}` is correct, the next one `{}{}` is not. Look at [Call](#call) type.

### Call

Call is a type which specifies function call and is presented by symbol followed by a list:

```
print('Hello world')
```

Calls could be chained:

```
curry(print 'Hello, %s')('World')
; or
print('Hello, %s' ?)('World')
```

Lists types could be mixed for different semantics creation:
```
; HTML like code
div{class: ('badge' 'badge-round' 'badge-red')}(
  p('Users count: 1')
)
```

### Comment

Comment is a line of text prepended with a semicolon `;`. Comment ends with new line char `\n`.

```
; Hi! I'm a comment. I can help you to describe your program
```

## License

MIT © [Rumkin](https://rumk.in)
