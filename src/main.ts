import * as core from '@actions/core'
import axios from 'axios'
import { DeployConfig, deployConfig } from './deployConfig'

function getInputs(): DeployConfig {
  const portainerHost: string = core.getInput('portainer-host', {
    required: true
  })
  const username: string = core.getInput('username', {
    required: true
  })
  const password: string = core.getInput('password', {
    required: true
  })
  const endpointId: string = core.getInput('endpoint-id', {
    required: false
  })
  const configName: string = core.getInput('config-name', {
    required: true
  })
  const configPath: string = core.getInput('config-definition', {
    required: false
  })
  const rejectUnauthorized: boolean =
    core.getBooleanInput('reject-unauthorized', {
      required: false
    }) == true

  return {
    portainerHost,
    username,
    password,
    endpointId: parseInt(endpointId) || 1,
    configName,
    configPath,
    rejectUnauthorized
  }
}

export async function run(): Promise<void> {
  try {
    const userInputs = getInputs()
    await deployConfig(userInputs)
    core.info('✅ Config Deployment done')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const {
        status,
        data,
        config: { url, method }
      } = error.response
      return core.setFailed(
        `AxiosError HTTP Status ${status} (${method} ${url}): ${JSON.stringify(data, null, 2)}`
      )
    }
    return core.setFailed(error as Error)
  }
}

run()
