import { getSDKs } from './harness/helpers'

const commonConfig = {
    preset: '@trendyol/jest-testcontainers',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {}]
    },
    globalSetup: './jest-global.ts',
    testEnvironment: './jest-environment.ts',
    setupFilesAfterEnv: ['./jest-setup.js'],
}

const projects = [
    {
        ...commonConfig,
        displayName: 'NodeJS',
        globals: {
            JEST_PROJECT_SDK_TO_TEST: 'NodeJS',
        }
    },
    {
        ...commonConfig,
        displayName: 'OF-NodeJS',
        globals: {
            JEST_PROJECT_SDK_TO_TEST: 'OF-NodeJS',
            LOCAL_HOST_BINDING: '0.0.0.0'
        },
        runner: 'jest-serial-runner'
    },
    {
        ...commonConfig,
        displayName: 'DotNet',
        globals: {
            JEST_PROJECT_SDK_TO_TEST: 'DotNet',
            LOCAL_HOST_BINDING: '0.0.0.0'
        }
    },
    {
        ...commonConfig,
        displayName: 'Go',
        globals: {
            JEST_PROJECT_SDK_TO_TEST: 'Go',
            LOCAL_HOST_BINDING: '0.0.0.0'
        }
    },
    {
        ...commonConfig,
        displayName: 'GoNative',
        globals: {
            JEST_PROJECT_SDK_TO_TEST: 'GoNative',
            LOCAL_HOST_BINDING: '0.0.0.0'
        }
    },
    {
        ...commonConfig,
        displayName: 'Ruby',
        globals: {
            JEST_PROJECT_SDK_TO_TEST: 'Ruby',
            LOCAL_HOST_BINDING: '0.0.0.0'
        }
    },
    // TODO uncomment once Java is ready
    // {
    //     ...commonConfig,
    //     displayName: 'Java',
    //     globals: {
    //         JEST_PROJECT_SDK_TO_TEST: 'Java',
    //     }
    // },
    // TODO uncomment once Python is ready
    // {
    //     ...commonConfig,
    //     displayName: 'Python',
    //     globals: {
    //         JEST_PROJECT_SDK_TO_TEST: 'Python',
    //     }
    // },
]
const SDKs = getSDKs().map((sdkName) => sdkName.toLowerCase())
const filteredProjects = projects.filter((project) => SDKs.includes(project.displayName.toLowerCase()))
console.log(`Running jest tests for SDKs: ${filteredProjects.map((project) => project.displayName).join(', ')}`)

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    testTimeout: 60000,
    projects: filteredProjects
}
