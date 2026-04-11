import {
  spyOn,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  type Mock
} from 'bun:test'
import * as core from '@actions/core'
import * as installer from '../src/installer'
import {run} from '../src/main'

let installBatsMock: Mock
let getInputSpy: Mock
let setOutputSpy: Mock
let setFailedSpy: Mock

beforeEach(() => {
  installBatsMock = spyOn(installer, 'installBats')
  getInputSpy = spyOn(core, 'getInput')
  setOutputSpy = spyOn(core, 'setOutput').mockImplementation(() => {})
  setFailedSpy = spyOn(core, 'setFailed').mockImplementation(() => {})

  getInputSpy.mockImplementation((name: string) => {
    if (name === 'version') return '1.13.0'
    if (name === 'token') return 'ghp_test'
    return ''
  })

  installBatsMock.mockResolvedValue('1.13.0')
})

afterEach(() => {
  installBatsMock.mockRestore()
  getInputSpy.mockRestore()
  setOutputSpy.mockRestore()
  setFailedSpy.mockRestore()
})

describe('run', () => {
  it('calls installBats with version and token inputs', async () => {
    await run()
    expect(installer.installBats).toHaveBeenCalledWith('1.13.0', 'ghp_test')
  })

  it('sets the version output on success', async () => {
    await run()
    expect(setOutputSpy).toHaveBeenCalledWith('version', '1.13.0')
  })

  it('calls setFailed when installBats throws an Error', async () => {
    installBatsMock.mockRejectedValueOnce(new Error('download failed'))
    await run()
    expect(setFailedSpy).toHaveBeenCalledWith('download failed')
    expect(setOutputSpy).not.toHaveBeenCalled()
  })

  it('does not set output when installBats fails', async () => {
    installBatsMock.mockRejectedValueOnce(new Error('network error'))
    await run()
    expect(setOutputSpy).not.toHaveBeenCalled()
  })
})
