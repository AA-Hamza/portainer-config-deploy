import axios from 'axios'
import * as https from 'node:https'

type ConfigData = {
  CreatedAt: string
  ID: string
  Portainer: {
    ResourceControl: {
      Id: number
      ResourceId: string
      SubResourceIds: []
      Type: number
      UserAccesses: []
      TeamAccesses: []
      Public: boolean
      AdministratorsOnly: boolean
      System: boolean
    }
  }
  Spec: {
    Data: string
    // "Labels": {},
    Name: string
  }
  UpdatedAt: string
  Version: {
    Index: number
  }
}

export class PortainerApi {
  private axiosInstance
  private endpointId = 1

  constructor(host: string, endpointId = 1, rejectUnauthorized = true) {
    this.endpointId = endpointId
    this.axiosInstance = axios.create({
      baseURL: `${host}/api`,
      httpsAgent:
        rejectUnauthorized === false
          ? new https.Agent({
              rejectUnauthorized
            })
          : undefined
    })
  }

  async login({ username, password }: { username: string; password: string }): Promise<void> {
    const { data } = await this.axiosInstance.post<{ jwt: string }>('/auth', {
      username,
      password
    })
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.jwt}`
  }

  async getAllConfigs(): Promise<ConfigData[]> {
    const { data } = await this.axiosInstance.get<ConfigData[]>(
      `/endpoints/${this.endpointId}/docker/configs`
    )
    return data
  }

  async createConfig(name: string, data: string, isBase64Encoded = false): Promise<void> {
    const base64Data = isBase64Encoded ? data : Buffer.from(data).toString('base64')
    console.log('NAME: ', name)
    await this.axiosInstance.post(`/endpoints/${this.endpointId}/docker/configs/create`, {
      Name: name,
      Data: base64Data
    })
  }

  async deleteConfig(id: string): Promise<void> {
    await this.axiosInstance.delete(`/endpoints/${this.endpointId}/docker/configs/${id}`)
  }

  async getConfig(id: string): Promise<ConfigData> {
    const { data } = await this.axiosInstance.get<ConfigData>(
      `/endpoints/${this.endpointId}/docker/configs/${id}`
    )
    return data
  }

  async cloneConfig(id: string, newName: string): Promise<void> {
    const config = await this.getConfig(id)
    await this.createConfig(newName, config.Spec.Data, true)
  }
}
