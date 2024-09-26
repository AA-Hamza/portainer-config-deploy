import { PortainerApi } from './api'
import path from 'path'
import fs from 'fs'
import * as core from '@actions/core'
import { isAxiosError } from 'axios'

type DeployConfig = {
  portainerHost: string
  username: string
  password: string
  endpointId: number
  configName: string
  configPath: string
  rejectUnauthorized?: boolean
}

function getConfigContent(relativePath: string): string {
  const configFullPath = path.join((process.env.GITHUB_WORKSPACE as string) || '.', relativePath)

  core.info(`Reading config file from ${configFullPath}`)
  const configContent = fs.readFileSync(configFullPath, 'utf8')
  if (!configContent) {
    throw new Error(`Could not find config file: ${configFullPath}`)
  }

  return configContent
}

async function deployConfig({
  portainerHost,
  username,
  password,
  endpointId,
  configName,
  configPath,
  rejectUnauthorized
}: DeployConfig): Promise<void> {
  const portainerApi = new PortainerApi(portainerHost, endpointId, rejectUnauthorized)

  const configContent = getConfigContent(configPath)

  if (configContent) {
    core.debug(configContent)
  }

  core.info('Logging in to Portainer instance...')
  await portainerApi.login({
    username,
    password
  })

  try {
    const allConfigs = await portainerApi.getAllConfigs()
    const existingConfig = allConfigs.find(s => {
      return s.Spec.Name === configName
    })

    if (existingConfig) {
      core.info(`Found existing config with name: ${configName}`)

      if (existingConfig.Spec.Data === Buffer.from(configContent).toString('base64')) {
        core.info(`Remote config matches local one, passing ...`)
        return
      }
      core.info('Taking backup of existing config...')

      const oldName = `${configName}_${new Date(existingConfig.CreatedAt).toISOString().replace(/:/g, '_')}`
      await portainerApi.createConfig(oldName, existingConfig.Spec.Data, true)

      core.info('Deleting existing config...')
      await portainerApi.deleteConfig(existingConfig.ID)

      core.info('Creating new config...')
      await portainerApi.createConfig(configName, configContent, false)
      core.info(`Successfully created new config with name: ${configName}`)
    } else {
      core.info('Deploying new config...')
      await portainerApi.createConfig(configName, configContent, false)
      core.info(`Successfully created new config with name: ${configName}`)
    }
  } catch (error) {
    core.info('⛔️ Something went wrong during deployment!')
    if (isAxiosError(error) && error.response) {
      const {
        status,
        data,
        config: { url, method }
      } = error.response
      return core.info(
        `AxiosError HTTP Status ${status} (${method} ${url}): ${JSON.stringify(data, null, 2)}`
      )
    } else {
      core.info(`error: ${JSON.stringify(error, null, 2)}`)
    }
    throw error
  }
}

export { deployConfig, DeployConfig }
