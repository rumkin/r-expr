# TODOLIST

- [ ] Add block strings started with `'''` and ended with `'''`:
  Example:
  ```
  '''
    This is a block string
  '''

  (list with block string '''
    A string inside of list
  ''')
  ```
- [ ] Update comments:
  - [ ] Remove comments started with `;`
  - [ ] Make comments start with `##`.
  - [ ] Add block comments started with `###`:
    ```
    ###
      This is a block comment
    ###
    ```
- [ ] Add logical separators: `,` `;` `:`
- [ ] Remove CallExpressions. It should be language-dependent.
- [ ] Make ParentNode to implement traversal and transformation logic.
- [ ] Make whitespaces meaningless to allow expressions like this: `url"http://github.com"`
- [ ] Configurable parser: set supported type of separators, list types, etc.

# 0.1

- [x] Error reporting
- [x] Parser
  - [x] Naive Parser
  - [x] Streaming Parser
- [x] Traverser
- [x] Transformer
