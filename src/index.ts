import {
  DocumentNode,
  GraphQLError,
  GraphQLResolveInfo,
  GraphQLType,
  ResponsePath,
  responsePathAsArray
} from 'graphql'

import { GraphQLExtension } from 'graphql-extensions'
import chalk from 'chalk'

const log = console.log

interface Args {
  tracing: boolean
}

interface ResolverCall {
  path: ResponsePath
  fieldName: string
  parentType: GraphQLType
  returnType: GraphQLType
  startOffset: bigint
  endOffset?: bigint
}

interface RequestDidStartProps {
  request: Pick<Request, 'url' | 'method'>
  operationName?: string
  parsedQuery?: DocumentNode
  queryString?: string
  variables?: {
    [key: string]: any
  }
}

const nanoSecondsToString = (time: bigint) => {
  const numberTime = Number(time)
  if (numberTime < 1e3) {
    return `${numberTime}ns`
  } else if (numberTime >= 1e3 && numberTime < 1e6) {
    return `${Math.floor(numberTime / 1e3)} us`
  } else if (numberTime >= 1e6 && numberTime <= 1e9) {
    return `${Math.floor(numberTime / 1e6)} ms`
  } else {
    return `${Math.floor(numberTime / 1e9)} s`
  }
}

export class LoggerExtension<TContext = any>
  implements GraphQLExtension<TContext> {
  private tracing: boolean
  private hrStartTime?: bigint
  private hrEndTime?: bigint
  private queryString?: string
  private variables?: { [key: string]: any }
  private errorMessage?: string
  private startTime?: Date
  private endTime?: Date
  private duration?: bigint
  private isIntrospection?: boolean
  private resolverCalls: ResolverCall[] = []

  constructor({ tracing = false }: Args) {
    this.tracing = tracing
  }

  public requestDidStart(o: RequestDidStartProps) {
    this.isIntrospection = o.operationName === 'IntrospectionQuery'
    if (this.isIntrospection) {
      return
    }
    this.variables = o.variables
    this.queryString = o.queryString
    this.hrStartTime = process.hrtime.bigint()
    this.startTime = new Date()
  }

  public executionDidStart() {
    if (this.isIntrospection) {
      return
    }

    // It's a little odd that we record the end time after execution rather than
    // at the end of the whole request, but we have to record it before the
    // request is over!
    return () => {
      this.hrEndTime = process.hrtime.bigint()
      this.endTime = new Date()
      if (this.hrStartTime && this.hrEndTime) {
        this.duration = this.hrEndTime - this.hrStartTime
      }
    }
  }

  public willResolveField(
    _source: any,
    _args: { [argName: string]: any },
    _context: TContext,
    info: GraphQLResolveInfo
  ) {
    const resolverCall: ResolverCall = {
      path: info.path,
      fieldName: info.fieldName,
      parentType: info.parentType,
      returnType: info.returnType,
      startOffset: this.hrStartTime
        ? process.hrtime.bigint() - this.hrStartTime
        : process.hrtime.bigint()
    }

    this.resolverCalls.push(resolverCall)

    return () => {
      resolverCall.endOffset = this.hrStartTime
        ? process.hrtime.bigint() - this.hrStartTime
        : process.hrtime.bigint()
    }
  }

  public didEncounterErrors?(errors: ReadonlyArray<GraphQLError>) {
    this.errorMessage = errors[0].message
    log(chalk.black.bgRed(' ERROR '))
    log(this.errorMessage)
  }

  public format(): any {
    if (
      this.errorMessage ||
      typeof this.startTime === 'undefined' ||
      typeof this.endTime === 'undefined' ||
      typeof this.duration === 'undefined'
    ) {
      return
    }
    // status
    log(chalk.black.bgGreen(' SUCCESSFUL '))
    log('\n')
    // basice informations
    log(chalk.black.bgYellow(' QUERY STRING '))
    log(this.queryString)
    log('\n')
    log(chalk.black.bgBlue(' VARIABLES '))
    log(JSON.stringify(this.variables, null, 2))
    log('\n')
    // tracing infromations
    if (this.tracing) {
      log(chalk.black.bgMagenta(' TRACING '))
      log(`startTime: ${this.startTime}`)
      log(`endTime: ${this.endTime}`)
      log(`duration: ${nanoSecondsToString(this.duration)}`)

      this.resolverCalls.forEach(resolverCall => {
        const path = responsePathAsArray(resolverCall.path)
        const isRoot = path.length === 1
        const pathName = isRoot ? path[0] : path.slice(1, path.length).join('.')
        const duration = resolverCall.endOffset
          ? nanoSecondsToString(
              resolverCall.endOffset - resolverCall.startOffset
            )
          : 0
        log(`${pathName} - ${duration}`)
      })
      log('\n')
    }
  }
}
