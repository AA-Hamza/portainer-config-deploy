<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Portainer Config Deploy

Portainer-config -deploy is a GitHub Action for deploying a newly updated config to portainer, if the config already exists it takes a backup then creates a new one

**Currently works on Portainer API v2.**

**This repo is a fork of [carlrygart/portainer-stack-deploy](https://github.com/carlrygart/portainer-stack-deploy) with some minor changes.**

## Action Inputs

| Input               | Description                                                                                                  | Default      |
| ------------------- | ------------------------------------------------------------------------------------------------------------ | ------------ |
| portainer-host      | Portainer host, eg. `https://myportainer.instance.com`                                                       | **Required** |
| username            | Username for the Portainer login. **NOTE: Do not use admin account!** Create a new CI specific login instead | **Required** |
| password            | Password for the Portainer login                                                                             | **Required** |
| endpoint-id         | ID of the Portainer node to deploy to                                                                        | 1            |
| config-name         | Name for the Portainer config                                                                                | **Required** |
| config-definition   | The path to the config file from repo root, eg. `config.json`, `app.settings.json`                           | **Required** |
| reject-unauthorized | If set to `false`, the action will skip self authorized certificates.                                        | true         |

## Example

The example below shows how the `portainer-config-deploy` action can be used to deploy a fresh version of your app to Portainer using ghcr.io.

```yaml
name: Deploy

on:
  push:
    branches:
      - master

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    timeout-minutes: 20

    env:
      GITHUB_REF: ${{ github.ref }}
      DOCKER_REGISTRY: ghcr.io
      DOCKER_IMAGE: github-username/my-awesome-web-app

    steps:
      - uses: actions/checkout@v2

      - name: Creating envs
        run: |
          echo "IMAGE_TAG=sha-$(git rev-parse --short HEAD)" >> $GITHUB_ENV
          echo "DOCKER_IMAGE_URI=${{ env.DOCKER_REGISTRY }}/${{ env.DOCKER_IMAGE }}" >> $GITHUB_ENV

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v1
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build docker image and push
        uses: docker/build-push-action@v2
        with:
          context: .
          push: true
          tags: ${{ env.DOCKER_IMAGE_URI }}:${{ env.IMAGE_TAG }},${{ env.DOCKER_IMAGE_URI }}:latest

      - name: Sleep for 10 seconds
        run: sleep 10s
        shell: bash

      - name: Deploy stack to Portainer
        uses: AA-Hamza/portainer-config-deploy@v1
        with:
          portainer-host: ${{ secrets.PORTAINER_HOST }}
          username: ${{ secrets.PORTAINER_USERNAME }}
          password: ${{ secrets.PORTAINER_PASSWORD }}
          endpoint-id: 1
          config-name: 'app-config'
          config-definition: 'app.settings.json'
          reject-unauthorized: false
```

### Build, check linting, run tests

```sh
npm run all
```
