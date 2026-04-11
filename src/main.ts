import * as core from '@actions/core'
import {installBats} from './installer'

export async function run(): Promise<void> {
  try {
    const version = core.getInput('version', {required: true})
    const token = core.getInput('token')
    const resolvedVersion = await installBats(version, token)
    core.setOutput('version', resolvedVersion)
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

/* istanbul ignore next */
if (require.main === module) {
  run()
}
