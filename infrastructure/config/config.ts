
const configFile = require('./dev.json')
interface Env {
    envName: string | undefined
    account: string | undefined
    region: string | undefined
    apiDomainCertificateArn: string | undefined
    rootDomain: string | undefined
    apiSubdomain: string | undefined
    userPoolArn: string | undefined
    reviewApiBasePath: string | undefined
    reviewableApiBasePath: string | undefined
    authenticatedRoleArn: string | undefined
    unauthenticatedRoleArn: string | undefined
    adminRoleArn: string | undefined
}

interface AppConfig {
    envName: string
    account: string
    region: string
    apiDomainCertificateArn: string
    rootDomain: string
    apiSubdomain: string
    userPoolArn: string
    reviewApiBasePath: string
    reviewableApiBasePath: string
    authenticatedRoleArn: string
    unauthenticatedRoleArn: string
    adminRoleArn: string
}

const getConfig = (): Env => {
    return {
        envName: configFile.envName ? configFile.envName : 'dev' ,
        account: configFile.account ? configFile.account : 'dev' ,
        region: configFile.region ? configFile.region : 'us-east-1' ,
        apiDomainCertificateArn: configFile.apiDomainCertificateArn,
        rootDomain: configFile.rootDomain,
        apiSubdomain: configFile.apiSubdomain,
        userPoolArn: configFile.userPoolArn,
        reviewApiBasePath: configFile.reviewApiBasePath,
        reviewableApiBasePath: configFile.reviewableApiBasePath,
        authenticatedRoleArn: configFile.authenticatedRoleArn,
        unauthenticatedRoleArn: configFile.unauthenticatedRoleArn,
        adminRoleArn: configFile.adminRoleArn
    }
};

const getSanitzedConfig = (config: Env): AppConfig => {
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) {
            throw new Error(`Missing key ${key} in config file`);
        }
    }
    return config as AppConfig;
};

const sanitizedConfig = getSanitzedConfig(getConfig());

export default sanitizedConfig;
