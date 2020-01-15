import { ApolloServer, gql } from 'apollo-server'

import { LoggerExtension } from 'apollo-server-logger'

interface Author {
  name: string
  brithday: string
}

interface Book {
  title: string
  author: Author
}

const books: Book[] = [
  {
    title: 'Harry Potter and the Chamber of Secrets',
    author: {
      name: 'J.K. Rowling',
      brithday: '1995-01-01'
    }
  },
  {
    title: 'Jurassic Park',
    author: {
      name: 'Michael Crichton',
      brithday: '1995-01-01'
    }
  }
]

const typeDefs = gql`
  type Author {
    name: String
    brithday: String
  }

  type Book {
    title: String
    author: Author
  }

  input AuthorInput {
    name: String
    brithday: String
  }

  input CreateBookInput {
    title: String
    author: AuthorInput
  }

  type Query {
    books: [Book]
  }

  type Mutation {
    createBook(payload: CreateBookInput!): Book
  }
`

const resolvers = {
  Query: {
    books: () => books
  },
  Mutation: {
    createBook: (parent, variables) => {
      books.push(variables.payload)
      return variables.payload
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  extensions: [() => new LoggerExtension({ tracing: true })]
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
