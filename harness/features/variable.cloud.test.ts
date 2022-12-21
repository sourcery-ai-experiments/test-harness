import {
    getConnectionStringForProxy,
    forEachSDK,
    describeIf,
    createUser,
    forEachVariableType,
    variablesForTypes,
    CloudTestClient, describeCapability
} from '../helpers'
import { Capabilities, SDKCapabilities } from '../types'
import { getServerScope } from '../nock'

jest.setTimeout(10000)

const scope = getServerScope()

describe('Variable Tests - Cloud', () => {
    forEachSDK((name) => {
        let testClient = new CloudTestClient(name)

        let url = getConnectionStringForProxy(name)

        beforeAll(async () => {
            await testClient.createClient({
                enableCloudBucketing: true
            })
        })

        describeCapability(name, Capabilities.cloud)(name, () => {
            it('will throw error variable called with invalid key', async () => {
                const response = await createUser(url, { user_id: 'user1' })
                const invalidUser = await response.json()

                expect(invalidUser.entityType).toBe('User')
                expect(invalidUser.data.user_id).toBe('user1')

                const userId = response.headers.get('location')
                expect(userId.includes('user/')).toBeTruthy()

                const variableResponse = await testClient.callVariable(userId, null, 'default_value', true)
                const error = await variableResponse.json()
                expect(error.asyncError).toBe('Missing parameter: key')
            })

            it('will throw error variable called with invalid default value', async () => {
                const response = await createUser(url, { user_id: 'user1' })
                const invalidUser = await response.json()

                expect(invalidUser.entityType).toBe('User')
                expect(invalidUser.data.user_id).toBe('user1')

                const userId = response.headers.get('location')
                expect(userId.includes('user/')).toBeTruthy()

                const variableResponse = await testClient.callVariable(userId, 'var_key', null, true)

                const error = await variableResponse.json()
                expect(error.asyncError).toBe('Missing parameter: defaultValue')
            })

            it('should call variables API without edgeDB option', async () => {
                const response = await createUser(url, { user_id: 'user1' })
                await response.json()
                const userId = response.headers.get('location')

                scope
                    .post(`/client/${testClient.clientId}/v1/variables/var_key`, (body) => body.user_id === 'user1')
                    .matchHeader('Content-Type', 'application/json')
                    .matchHeader('authorization', testClient.sdkKey)
                    .query((queryObj) => {
                        return !queryObj.enableEdgeDB
                    })
                    .reply(200, {
                        key: 'var_key',
                        value: 'value',
                        defaultValue: 'default_value',
                        type: 'String',
                        isDefaulted: false
                    })
                const variableResponse = await testClient.callVariable(userId, 'var_key', 'default_value')
                await variableResponse.json()
            })

            it('should call variables API with edgeDB option', async () => {
                const response = await createUser(url, { user_id: 'user1' })
                await response.json()
                const userId = response.headers.get('location')

                const testClient = new CloudTestClient(name)

                await testClient.createClient({
                    enableCloudBucketing: true,
                    enableEdgeDB: true
                })

                scope
                    .post(`/client/${testClient.clientId}/v1/variables/var_key`, (body) => body.user_id === 'user1')
                    .matchHeader('Content-Type', 'application/json')
                    .matchHeader('authorization', testClient.sdkKey)
                    .query((queryObj) => {
                        return !!queryObj.enableEdgeDB
                    })
                    .reply(200, {
                        key: 'var_key',
                        value: 'value',
                        defaultValue: 'default_value',
                        type: 'String',
                        isDefaulted: false
                    })
                const variableResponse = await testClient.callVariable(userId, 'var_key', 'default_value')
                await variableResponse.json()

            })

            it('should return default if mock server\
            returns variable mismatching default value type', async () => {
                const response = await createUser(url, { user_id: 'user1' })
                await response.json()
                const userId = response.headers.get('location')

                scope
                    .post(`/client/${testClient.clientId}/v1/variables/var_key`, (body) => body.user_id === 'user1')
                    .matchHeader('Content-Type', 'application/json')
                    .matchHeader('authorization', testClient.sdkKey)
                    .reply(200, {
                        key: 'var_key',
                        value: 5,
                        type: 'Number',
                        isDefaulted: false
                    })

                const variableResponse = await testClient.callVariable(
                    userId,
                    'var_key',
                    variablesForTypes['string'].defaultValue
                )
                const variable = await variableResponse.json()

                expect(variable).toEqual(expect.objectContaining({
                    entityType: 'Variable',
                    data: {
                        key: 'var_key',
                        value: variablesForTypes['string'].defaultValue,
                        defaultValue: variablesForTypes['string'].defaultValue,
                        type: variablesForTypes['string'].type,
                        isDefaulted: true
                    }
                }))
            })

            forEachVariableType((type) => {
                it(`should return default ${type} variable if mock server returns undefined`, async () => {
                    const response = await createUser(url, { user_id: 'user1' })
                    await response.json()
                    const userId = response.headers.get('location')

                    scope
                        .post(`/client/${testClient.clientId}/v1/variables/var_key`, (body) => body.user_id === 'user1')
                        .matchHeader('Content-Type', 'application/json')
                        .matchHeader('authorization', testClient.sdkKey)
                        .reply(200, undefined)

                    const variableResponse = await testClient.callVariable(
                        userId,
                        'var_key',
                        variablesForTypes[type].defaultValue
                    )
                    const variable = await variableResponse.json()

                    expect(variable).toEqual(expect.objectContaining({
                        entityType: 'Variable',
                        data: {
                            key: 'var_key',
                            value: variablesForTypes[type].defaultValue,
                            defaultValue: variablesForTypes[type].defaultValue,
                            type: variablesForTypes[type].type,
                            isDefaulted: true
                        }
                    }))
                })

                it(`should return ${type} variable if mock server returns \
                proper variable matching default value type`, async () => {
                    const response = await createUser(url, { user_id: 'user1' })
                    await response.json()
                    const userId = response.headers.get('location')

                    scope
                        .post(`/client/${testClient.clientId}/v1/variables/var_key`, (body) => body.user_id === 'user1')
                        .matchHeader('Content-Type', 'application/json')
                        .matchHeader('authorization', testClient.sdkKey)
                        .reply(200, variablesForTypes[type])

                    const variableResponse = await testClient.callVariable(
                        userId,
                        'var_key',
                        variablesForTypes[type].defaultValue
                    )
                    const variable = await variableResponse.json()

                    expect(variable).toEqual(expect.objectContaining({
                        entityType: 'Variable',
                        data: {
                            key: 'var_key',
                            value: variablesForTypes[type].value,
                            defaultValue: variablesForTypes[type].defaultValue,
                            isDefaulted: false,
                            type: variablesForTypes[type].type
                        }
                    }))
                })

                it(`should return defaulted ${type} variable if mock server returns an internal error, \
                after retrying 5 times`, async () => {
                    const response = await createUser(url, { user_id: 'user1' })
                    await response.json()
                    const userId = response.headers.get('location')

                    scope
                        .post(`/client/${testClient.clientId}/v1/variables/var_key`, (body) => body.user_id === 'user1')
                        .matchHeader('Content-Type', 'application/json')
                        .matchHeader('authorization', testClient.sdkKey)
                        // SDK retries the request 5 times + 1 initial request
                        .times(6)
                        .reply(500)

                    const variableResponse = await testClient.callVariable(
                        userId,
                        'var_key',
                        variablesForTypes[type].defaultValue
                    )
                    const variable = await variableResponse.json()

                    expect(variable).toEqual(expect.objectContaining({
                        entityType: 'Variable',
                        data: {
                            key: 'var_key',
                            value: variablesForTypes[type].defaultValue,
                            isDefaulted: true,
                            defaultValue: variablesForTypes[type].defaultValue,
                            type: variablesForTypes[type].type
                        }
                    }))
                })
            })
        })
    })
})
