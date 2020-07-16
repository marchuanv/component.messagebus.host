const utils = require("utils");
const fs = require("fs");
const delegate = require("component.delegate");

const requestHandlerSecure = require("component.request.handler.secure");
const requestSecure = require("component.request.secure");

const logging = require("logging");
logging.config.add("MessageBusHost");

module.exports = { 
    hosts: [],
    handle: async (callingModule, { channel, publicHost, publicPort, privateHost, privatePort }) => {
        const thisModule = `component.messagebus.host.${channel}`;
        delegate.register(thisModule, async ({ headers: {  username, passphrase, publicHost, publicPort, data } }) => {
            let { hashedPassphrase, hashedPassphraseSalt } = {};
            if (passphrase){
                ({ hashedPassphrase, hashedPassphraseSalt } = utils.hashPassphrase(passphrase));
            }
            const host = {
                id: utils.generateGUID(),
                channel,
                username,
                hashedPassphrase,
                hashedPassphraseSalt,
                publicHost,
                publicPort,
                remote: {
                    hosts: [data]
                }
            };
            logging.write(`MessageBusHost`,`registered`);
            for(const remoteHost of module.exports.hosts){
                await requestSecure.send({
                    host: remoteHost.publicHost,
                    port: remoteHost.publicPort,
                    path: `/${remoteHost.channel}/host`,
                    method: "POST",
                    headers: {
                        username: host.username,
                        hashedPassphrase: remoteHost.hashedPassphrase,
                        hashedPassphraseSalt: remoteHost.hashedPassphraseSalt,
                        fromhost: host.publicHost,
                        fromport: host.publicPort
                    }, 
                    data: JSON.stringify(host)
                });
            }
            await delegate.call(callingModule, { host });
            module.exports.hosts.push(host);
        });
        await requestHandlerSecure.handle(thisModule, { 
            publicHost, 
            publicPort,
            privateHost,
            privatePort,
            path: `/${channel}/host`
        });
    }
};