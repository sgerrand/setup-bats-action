import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import {HttpClient} from '@actions/http-client'
import * as os from 'os'
import * as path from 'path'
import {
  normalizeVersion,
  resolveLatestVersion,
  getDownloadUrl,
  downloadBats,
  installBats
} from '../src/installer'

// os.platform is non-configurable, so we mock the whole module
jest.mock('os')

const osMock = os as jest.Mocked<typeof os>

let infoSpy: jest.SpyInstance
let addPathSpy: jest.SpyInstance
let findSpy: jest.SpyInstance
let downloadSpy: jest.SpyInstance
let extractTarSpy: jest.SpyInstance
let extractZipSpy: jest.SpyInstance
let cacheDirSpy: jest.SpyInstance
let getJsonSpy: jest.SpyInstance

beforeEach(() => {
  // Default to linux for all tests unless overridden
  osMock.platform.mockReturnValue('linux')
  infoSpy = jest.spyOn(core, 'info').mockImplementation(() => {})
  addPathSpy = jest.spyOn(core, 'addPath').mockImplementation(() => {})
  findSpy = jest.spyOn(tc, 'find')
  downloadSpy = jest.spyOn(tc, 'downloadTool')
  extractTarSpy = jest.spyOn(tc, 'extractTar')
  extractZipSpy = jest.spyOn(tc, 'extractZip')
  cacheDirSpy = jest.spyOn(tc, 'cacheDir')
  getJsonSpy = jest.spyOn(HttpClient.prototype, 'getJson')
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('normalizeVersion', () => {
  it('strips leading v prefix', () => {
    expect(normalizeVersion('v1.11.0')).toBe('1.11.0')
  })

  it('passes through version without v prefix unchanged', () => {
    expect(normalizeVersion('1.11.0')).toBe('1.11.0')
  })

  it('does not strip v from interior of string', () => {
    expect(normalizeVersion('1.0.0-v2')).toBe('1.0.0-v2')
  })
})

describe('getDownloadUrl', () => {
  it('returns tar.gz URL on Linux', () => {
    osMock.platform.mockReturnValue('linux')
    expect(getDownloadUrl('1.13.0')).toBe(
      'https://github.com/bats-core/bats-core/archive/v1.13.0.tar.gz'
    )
  })

  it('returns tar.gz URL on macOS', () => {
    osMock.platform.mockReturnValue('darwin')
    expect(getDownloadUrl('1.13.0')).toBe(
      'https://github.com/bats-core/bats-core/archive/v1.13.0.tar.gz'
    )
  })

  it('returns zip URL on Windows', () => {
    osMock.platform.mockReturnValue('win32')
    expect(getDownloadUrl('1.13.0')).toBe(
      'https://github.com/bats-core/bats-core/archive/v1.13.0.zip'
    )
  })
})

describe('resolveLatestVersion', () => {
  it('resolves latest version and normalizes tag_name', async () => {
    getJsonSpy.mockResolvedValue({
      statusCode: 200,
      result: {tag_name: 'v1.13.0'}
    })
    const version = await resolveLatestVersion('test-token')
    expect(version).toBe('1.13.0')
  })

  it('throws on non-200 HTTP status', async () => {
    getJsonSpy.mockResolvedValue({statusCode: 403, result: null})
    await expect(resolveLatestVersion('bad-token')).rejects.toThrow(
      'Failed to resolve latest BATS version: HTTP 403'
    )
  })

  it('works without a token', async () => {
    getJsonSpy.mockResolvedValue({
      statusCode: 200,
      result: {tag_name: 'v1.13.0'}
    })
    const version = await resolveLatestVersion('')
    expect(version).toBe('1.13.0')
  })

  it('omits Authorization header when token is empty', async () => {
    getJsonSpy.mockResolvedValue({
      statusCode: 200,
      result: {tag_name: 'v1.13.0'}
    })
    await resolveLatestVersion('')
    const headers = getJsonSpy.mock.calls[0][1] as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('includes Authorization header when token is provided', async () => {
    getJsonSpy.mockResolvedValue({
      statusCode: 200,
      result: {tag_name: 'v1.13.0'}
    })
    await resolveLatestVersion('ghp_test')
    const headers = getJsonSpy.mock.calls[0][1] as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer ghp_test')
  })
})

describe('downloadBats', () => {
  it('returns cached path without downloading when cache hit', async () => {
    findSpy.mockReturnValue('/opt/hostedtoolcache/bats/1.13.0/x64')
    const result = await downloadBats('1.13.0')
    expect(result).toBe('/opt/hostedtoolcache/bats/1.13.0/x64')
    expect(downloadSpy).not.toHaveBeenCalled()
  })

  it('downloads, extracts tar.gz, and caches on Linux', async () => {
    osMock.platform.mockReturnValue('linux')
    findSpy.mockReturnValue('')
    downloadSpy.mockResolvedValue('/tmp/v1.13.0.tar.gz')
    extractTarSpy.mockResolvedValue('/tmp/extract')
    cacheDirSpy.mockResolvedValue('/opt/hostedtoolcache/bats/1.13.0/x64')

    const result = await downloadBats('1.13.0')

    expect(downloadSpy).toHaveBeenCalledWith(
      'https://github.com/bats-core/bats-core/archive/v1.13.0.tar.gz'
    )
    expect(extractTarSpy).toHaveBeenCalledWith('/tmp/v1.13.0.tar.gz')
    expect(extractZipSpy).not.toHaveBeenCalled()
    expect(cacheDirSpy).toHaveBeenCalledWith(
      path.join('/tmp/extract', 'bats-core-1.13.0'),
      'bats',
      '1.13.0'
    )
    expect(result).toBe('/opt/hostedtoolcache/bats/1.13.0/x64')
  })

  it('downloads, extracts zip, and caches on Windows', async () => {
    osMock.platform.mockReturnValue('win32')
    findSpy.mockReturnValue('')
    downloadSpy.mockResolvedValue('C:\\Temp\\v1.13.0.zip')
    extractZipSpy.mockResolvedValue('C:\\Temp\\extract')
    cacheDirSpy.mockResolvedValue('C:\\hostedtoolcache\\bats\\1.13.0\\x64')

    const result = await downloadBats('1.13.0')

    expect(downloadSpy).toHaveBeenCalledWith(
      'https://github.com/bats-core/bats-core/archive/v1.13.0.zip'
    )
    expect(extractZipSpy).toHaveBeenCalledWith('C:\\Temp\\v1.13.0.zip')
    expect(extractTarSpy).not.toHaveBeenCalled()
    expect(result).toBe('C:\\hostedtoolcache\\bats\\1.13.0\\x64')
  })

  it('caches the inner bats-core-<version>/ subdirectory, not the extraction root', async () => {
    osMock.platform.mockReturnValue('linux')
    findSpy.mockReturnValue('')
    downloadSpy.mockResolvedValue('/tmp/archive.tar.gz')
    extractTarSpy.mockResolvedValue('/tmp/outer')
    cacheDirSpy.mockResolvedValue('/cached')

    await downloadBats('1.11.0')

    expect(cacheDirSpy).toHaveBeenCalledWith(
      path.join('/tmp/outer', 'bats-core-1.11.0'),
      'bats',
      '1.11.0'
    )
  })
})

describe('installBats', () => {
  it('resolves latest version when input is "latest"', async () => {
    getJsonSpy.mockResolvedValue({
      statusCode: 200,
      result: {tag_name: 'v1.13.0'}
    })
    findSpy.mockReturnValue('/cached')

    const version = await installBats('latest', 'token')
    expect(version).toBe('1.13.0')
  })

  it('normalizes explicit version with v prefix', async () => {
    findSpy.mockReturnValue('/cached')
    const version = await installBats('v1.11.0', '')
    expect(version).toBe('1.11.0')
    expect(findSpy).toHaveBeenCalledWith('bats', '1.11.0')
  })

  it('adds bin/ subdirectory to PATH', async () => {
    osMock.platform.mockReturnValue('linux')
    findSpy.mockReturnValue('/opt/hostedtoolcache/bats/1.13.0/x64')

    await installBats('1.13.0', '')

    expect(addPathSpy).toHaveBeenCalledWith(
      path.join('/opt/hostedtoolcache/bats/1.13.0/x64', 'bin')
    )
  })

  it('returns the resolved bare version string', async () => {
    findSpy.mockReturnValue('/cached')
    const result = await installBats('v1.11.0', '')
    expect(result).toBe('1.11.0')
  })
})
