import chalk from 'chalk'
import { createTestClient } from 'apollo-server-testing'
import server from '../testUtil/index'

const client = createTestClient(server)

// '2020-01-22T15:20:58.087Z'
const fakeDateTime = 1579706458087
Date.now = jest.fn(() => fakeDateTime)
const spy = jest.spyOn(console, 'log')

describe('Log Checking', () => {
  describe('Successful Request', () => {
    it('Correctly log successful status and duration', async () => {
      const query = /* GraphQL */ `
        query booksQuery {
          books {
            title
          }
        }
      `
      await client.query({ query, variables: {} })
      expect(spy).toBeCalledWith(chalk.black.bgGreen(' SUCCESSFUL '))
    })

    it('Correctly log query string', async () => {
      const query = /* GraphQL */ `
        query booksQuery {
          books {
            title
          }
        }
      `
      await client.query({ query, variables: {} })
      expect(spy).toBeCalledWith(chalk.black.bgYellow(' QUERY STRING '))
      expect(spy).toBeCalledWith(
        expect.stringMatching(
          /\n(\s+)query booksQuery {\n(\s+)books {\n(\s+)title\n(\s+)\}\n(\s+)\}\n(\s+)/
        )
      )
    })

    it('Correctly log tracing report', async () => {
      const query = /* GraphQL */ `
        query booksQuery {
          books {
            title
            author {
              name
              brithday
            }
          }
        }
      `
      await client.query({ query, variables: {} })
      expect(spy).toBeCalledWith(chalk.black.bgMagenta(' TRACING '))
      expect(spy).toBeCalledWith('duration: 2 s')
      expect(spy).toBeCalledWith(expect.stringMatching(/\d\.title\s-\s/))
      expect(spy).toBeCalledWith(expect.stringMatching(/\d\.author\s-\s/))
      expect(spy).toBeCalledWith(expect.stringMatching(/\d\.author.name\s-\s/))
      expect(spy).toBeCalledWith(
        expect.stringMatching(/\d\.author.brithday\s-\s/)
      )
    })

    it('Correctly log variables', async () => {
      const query = /* GraphQL */ `
        mutation bookMutation($payload: CreateBookInput!) {
          createBook(payload: $payload) {
            title
            author {
              name
              brithday
            }
          }
        }
      `
      const variables = {
        payload: {
          title: 'blah',
          author: {
            name: 'blah',
            brithday: 'blah'
          }
        }
      }
      await client.query({ query, variables })
      expect(spy).toBeCalledWith(chalk.black.bgBlue(' VARIABLES '))
      expect(spy).toBeCalledWith(JSON.stringify(variables, null, 2))
    })
  })

  describe('Failed Request', () => {
    it('Correctly log Error with message when query string is invalid', async () => {
      const query = /* GraphQL */ `
        query booksQuery {
          books {
            gender
          }
        }
      `
      await client.query({ query, variables: {} })
      expect(spy).toBeCalledWith(chalk.black.bgRed(' ERROR '))
      expect(spy).toBeCalledWith('Cannot query field "gender" on type "Book".')
    })
  })
})
