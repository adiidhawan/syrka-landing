// Lets Node's test runner load the app's TypeScript modules, which import each other without file extensions
// (the bundler convention). Registered with `node --import`; Node strips the types itself.
import { register } from 'node:module'

register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (err) {
    if (err?.code !== 'ERR_MODULE_NOT_FOUND' || !/^\\.{1,2}\\//.test(specifier) || /\\.[cm]?[jt]s$/.test(specifier)) throw err
    return next(specifier + '.ts', context)
  }
}
`))
