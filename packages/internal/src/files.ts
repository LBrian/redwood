import fs from 'fs'
import path from 'path'

import fg from 'fast-glob'

import { getNamedExports, hasDefaultExport } from './ast'
import { getPaths } from './paths'

export const findCells = (cwd: string = getPaths().web.src) => {
  const modules = fg.sync('**/*Cell.{js,jsx,ts,tsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules'],
  })
  return modules.filter(isCellFile)
}

export const findPages = (cwd: string = getPaths().web.pages) => {
  const modules = fg.sync('**/*Page.{tsx,js,jsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules'],
  })

  return modules.filter(isPageFile)
}

export const findDirectoryNamedModules = (cwd: string = getPaths().base) => {
  const modules = fg.sync('**/src/**/*[!Cell].{ts,js,jsx,tsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules'],
  })

  return modules.filter(isDirectoryNamedModuleFile)
}

export const findGraphQLSchemas = (cwd: string = getPaths().api.graphql) => {
  return fg
    .sync('**/*.sdl.{ts,js}', { cwd, absolute: true })
    .filter(isGraphQLSchemaFile)
}

export const isCellFile = (p: string) => {
  const { dir, name } = path.parse(p)
  // A Cell must be a directory named module.
  if (!dir.endsWith(name)) {
    return false
  }

  const code = fs.readFileSync(p, 'utf-8')

  // A Cell should not have a default export.
  if (hasDefaultExport(code)) {
    return false
  }

  // A Cell must export QUERY and Success.
  const exports = getNamedExports(code)
  const exportedQUERY = exports.findIndex((v) => v.name === 'QUERY') !== -1
  const exportedSuccess = exports.findIndex((v) => v.name === 'Success') !== -1
  if (!exportedQUERY && !exportedSuccess) {
    return false
  }

  return true
}

export const isPageFile = (p: string) => {
  const { dir, name } = path.parse(p)

  // A page must end with "Page.{jsx, jsx,tsx}".
  if (!name.endsWith('Page')) {
    return false
  }

  // A page should be in the `web/src/pages` directory.
  const pagesDir = getPaths().web.pages
  if (!dir.startsWith(pagesDir)) {
    return false
  }

  // A Page should have a default export.
  const code = fs.readFileSync(p, 'utf-8')
  if (!hasDefaultExport(code)) {
    return false
  }

  return true
}

export const isDirectoryNamedModuleFile = (p: string) => {
  const { dir, name } = path.parse(p)
  return dir.endsWith(name)
}

export const isGraphQLSchemaFile = (p: string) => {
  p.match(/\.sdl\.(ts|js)$/) // ?
  if (!p.match(/\.sdl\.(ts|js)$/)?.[0]) {
    return false
  }

  const code = fs.readFileSync(p, 'utf-8')
  const exports = getNamedExports(code)
  return exports.findIndex((v) => v.name === 'schema') !== -1
}
