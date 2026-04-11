import * as core from '@actions/core'
import * as installer from '../src/installer'
import {run} from '../src/main'

// Mock the installer module so main.ts doesn't trigger real downloads
jest.mock('../src/installer')

const installerMock = installer as jest.Mocked<typeof installer>

let getInputSpy: jest.SpyInstance
let setOutputSpy: jest.SpyInstance
let setFailedSpy: jest.SpyInstance

beforeEach(() => {
  getInputSpy = jest.spyOn(core, 'getInput')
  setOutputSpy = jest.spyOn(core, 'setOutput').mockImplementation(() => {})
  setFailedSpy = jest.spyOn(core, 'setFailed').mockImplementation(() => {})

  getInputSpy.mockImplementation((name: string) => {
    if (name === 'version') return '1.13.0'
    if (name === 'token') return 'ghp_test'
    return ''
  })

  installerMock.installBats.mockResolvedValue('1.13.0')
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('run', () => {
  it('calls installBats with version and token inputs', async () => {
    await run()
    expect(installerMock.installBats).toHaveBeenCalledWith('1.13.0', 'ghp_test')
  })

  it('sets the version output on success', async () => {
    await run()
    expect(setOutputSpy).toHaveBeenCalledWith('version', '1.13.0')
  })

  it('calls setFailed when installBats throws an Error', async () => {
    installerMock.installBats.mockRejectedValueOnce(
      new Error('download failed')
    )
    await run()
    expect(setFailedSpy).toHaveBeenCalledWith('download failed')
    expect(setOutputSpy).not.toHaveBeenCalled()
  })

  it('does not set output when installBats fails', async () => {
    installerMock.installBats.mockRejectedValueOnce(new Error('network error'))
    await run()
    expect(setOutputSpy).not.toHaveBeenCalled()
  })
})
