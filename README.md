# Apollo-server-logger

[![Coverage Status](https://coveralls.io/repos/github/TingHaooo/apollo-server-logger/badge.svg)](https://coveralls.io/github/TingHaooo/apollo-server-logger)
[![](https://badgen.net/badge/license/MIT/green)](https://github.com/Naereen/StrapDown.js/blob/master/LICENSE)
[![](https://badgen.net/badge/npm/v1.0.1/green)](https://www.npmjs.com/package/apollo-server-logger)

![err](https://i.imgur.com/ZmMIseV.png)

## Installing

npm

```
npm i --save apollo-server-logger
```

yarn

```
yarn add apollo-server-logger
```

## Usage

```typescript
import { LoggerExtension } from 'apollo-server-logger'
...
const server = new ApolloServer({
  typeDefs,
  resolvers,
  extensions: [() => new LoggerExtension({
    // options
    tracing: true
  })]
})
```

[Full Exmaple](https://github.com/TingHaooo/apollo-server-logger/blob/master/examples/src/index.ts)

## Options

```typescript
{
  tracing = false: Boolean // show tracing or not
}
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
