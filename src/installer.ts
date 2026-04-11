import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import {HttpClient} from '@actions/http-client'
import * as os from 'os'
import * as path from 'path'

const TOOL_NAME = 'bats'
const OWNER = 'bats-core'
const REPO = 'bats-core'

interface GitHubRelease {
  tag_name: string
}

export function normalizeVersion(version: string): string {
  return version.startsWith('v') ? version.slice(1) : version
}

export async function resolveLatestVersion(token: string): Promise<string> {
  const client = new HttpClient('setup-bats-action', [], {
    allowRetries: true,
    maxRetries: 3
  })
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await client.getJson<GitHubRelease>(url, headers)
  if (response.statusCode !== 200 || !response.result) {
    throw new Error(
      `Failed to resolve latest BATS version: HTTP ${response.statusCode}`
    )
  }
  return normalizeVersion(response.result.tag_name)
}

export function getDownloadUrl(version: string): string {
  const ext = os.platform() === 'win32' ? 'zip' : 'tar.gz'
  return `https://github.com/${OWNER}/${REPO}/archive/v${version}.${ext}`
}

export async function downloadBats(version: string): Promise<string> {
  const cached = tc.find(TOOL_NAME, version)
  if (cached) {
    core.info(`Found BATS ${version} in tool cache at ${cached}`)
    return cached
  }
  const url = getDownloadUrl(version)
  core.info(`Downloading BATS ${version} from ${url}`)
  const archivePath = await tc.downloadTool(url)
  const extractedPath =
    os.platform() === 'win32'
      ? await tc.extractZip(archivePath)
      : await tc.extractTar(archivePath)
  const toolDir = path.join(extractedPath, `${REPO}-${version}`)
  const cachedDir = await tc.cacheDir(toolDir, TOOL_NAME, version)
  core.info(`Cached BATS ${version} to ${cachedDir}`)
  return cachedDir
}

export async function installBats(
  versionInput: string,
  token: string
): Promise<string> {
  let version: string
  if (versionInput.toLowerCase() === 'latest') {
    core.info('Resolving latest BATS version from GitHub API...')
    version = await resolveLatestVersion(token)
    core.info(`Resolved latest BATS version: ${version}`)
  } else {
    version = normalizeVersion(versionInput)
  }
  const installDir = await downloadBats(version)
  core.addPath(path.join(installDir, 'bin'))
  return version
}
