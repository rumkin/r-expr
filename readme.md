# R-Expressions

R-expressions or Rich Expressions is a markup language inspired by S-
and M-expressions. It's toolkit written with JavaScript. Toolkit contains tokenizer, parser, traverser, and transformer. Tokenizer and parser support streaming mode and could be used for REPL creation.

## Goal

R-expressions are made for:
1. Lisp-like programming languages creation.
2. Language prototyping.

## Example

```
(pseudo-lang ^1.0)

import((Console) from io)

Console.log('Hello, %s!' 'World')
```

## Types

R-Expressions contains symbols, strings, lists, calls and comments.

### Symbol

Symbol is a sequence of characters without whitespaces, single quotes or parenthesis. While whitespace could be escaped by backslash.

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

### List

List is a type which can contain other types symbols, strings, lists, and calls:

```
(null true 1_234 'Hello')
(div
  ((id 'doc') (class 'container'))
  (h1 'Document')
  (p 'This is some document')
)
```

### Call

Call is a type which specifies function call and is presented by symbol followed by list:

```
print('Hello world')
```

Calls could be chained:

```
curry(print 'Hello, %s')('World')
```

### Comment

Comments is a line of text prepended with semicolon `;`. Comments end with new line.
```
; Hi! I'm a comment. I can help you to describe your program
```

## License

MIT © [Rumkin](https://rumk.in)
