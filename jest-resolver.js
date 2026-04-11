// Custom resolver to handle ESM-only @actions/* packages by using the
// "import" export condition, while keeping CJS resolution for everything else.
module.exports = function (request, options) {
  if (request.startsWith('@actions/')) {
    return options.defaultResolver(request, {
      ...options,
      conditions: ['import', 'default', 'node']
    })
  }
  return options.defaultResolver(request, options)
}
