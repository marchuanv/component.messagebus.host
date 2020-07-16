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
        delegate.register(thisModule, async ({ headers: {  username, passphrase } }) => {
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
                address: {
                    private: {
                        host: privateHost,
                        port: privatePort
                    },
                    public: {
                        host: publicHost,
                        port: publicPort
                    }
                },
                remote: {
                    hosts: []
                },
                publishedIds: []
            };
            logging.write(`MessageBusHost`,`Started`);
            for(const host of module.exports.hosts){
                for(const remoteHost of module.exports.hosts.filter(h => h.id !== host.id)){
                    await requestSecure.send({
                        host: remoteHost.address.public.host,
                        port: remoteHost.address.public.port,
                        path: `/${remoteHost.channel}/subscribe`,
                        method: "POST",
                        headers: {
                            username: host.username,
                            hashedPassphrase: remoteHost.hashedPassphrase,
                            hashedPassphraseSalt: remoteHost.hashedPassphraseSalt,
                            fromhost: host.address.public.host,
                            fromport: host.address.public.port
                        }, 
                        data: `subscribe ${host.address.public.host}${host.address.public.port} to messages on the ${host.channel} channel`
                    });
                }
            };
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