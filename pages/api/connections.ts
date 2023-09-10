import type {NextApiRequest, NextApiResponse} from 'next'
import fetch from 'node-fetch'

import {
    Agent, AriesFrameworkError, ConnectionsModule,
    HttpOutboundTransport,
    InitConfig,
    KeyDerivationMethod,
    WsOutboundTransport
} from '@aries-framework/core';
import {agentDependencies} from "@aries-framework/node";
import {IndySdkModule} from "@aries-framework/indy-sdk";
import indySdk from 'indy-sdk'

const wsOutboundTransport = new WsOutboundTransport()
const httpOutboundTransport = new HttpOutboundTransport()

const agentConfig: InitConfig = {
    label: "Aries Agent",
    endpoints: ["http://localhost:8051"],
    walletConfig: {
        id: `4SWhrkBKsLr4VygppgmASn`,
        key: '2sjyPc3qf5Xs5wN6ahje3VsaAwtx2nnSDwfEH2i5x2a9', // generated using indy.generateWalletKey
        keyDerivationMethod: KeyDerivationMethod.Raw,
    },
    useDidKeyInProtocols: true,
    useDidSovPrefixWhereAllowed: true,
    autoUpdateStorageOnStartup: true
};

const agent = new Agent({
    config: agentConfig,
    modules: {
        indySdk: new IndySdkModule({
            indySdk,
        }),
    },
    dependencies: agentDependencies
});

// Register transports
agent.registerOutboundTransport(wsOutboundTransport)
agent.registerOutboundTransport(httpOutboundTransport)

type ResponseData = {
    connections: string[]
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    await agent.initialize()
    const invitation = await fetch("http://localhost:8051/connections/create-invitation", {
        method: "POST"
    })
    const json = await invitation.json()
    // @ts-ignore
    const invitationUrl = json["invitation_url"]
    const {connectionRecord} = await agent.oob.receiveInvitationFromUrl(invitationUrl)
    if (!connectionRecord) {
        throw new AriesFrameworkError('Connection record for out-of-band invitation was not created.')
    }
    await agent.connections.returnWhenIsConnected(connectionRecord.id)
    console.log("Connected to responder")
    console.log(`Invitation URL: ${invitationUrl}`)
    const connections = (await agent.connections.getAll()).map((connection) => connection.id)
    res.status(200).json({connections})
    console.log("COMPLETE")
}