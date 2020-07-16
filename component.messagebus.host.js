const utils = require("utils");
const fs = require("fs");
const delegate = require("component.delegate");

const requestHandlerSecure = require("component.request.handler.secure");
const requestSecure = require("component.request.secure");

const logging = require("logging");
logging.config.add("MessageBus Host");

module.exports = { 
    hosts: [],
    handle: async (callingModule, { publicHost, publicPort, privateHost, privatePort }) => {
        const thisModule = `component.messagebus.host.${publicHost}.${publicPort}`;
        delegate.register(thisModule, async ({ headers: {  username, passphrase, publichost, publicport } }) => {
            let message = "";
            if (!passphrase){
                message = "missing headers: passphrase, publichost and publicport";
                return { 
                    headers: { 
                        "Content-Type":"text/plain", 
                        "Content-Length": Buffer.byteLength(message)
                    },
                    statusCode: 400,
                    statusMessage: "Bad Request",
                    data: message
                };
            }
            const exists = module.exports.hosts.find( h => h.username === username && h.publicHost === publichost && h.publicPort === publicport);
            if (exists){
                message = "host already registered";
                return { 
                    headers: { 
                        "Content-Type":"text/plain", 
                        "Content-Length": Buffer.byteLength(message)
                    },
                    statusCode: 400,
                    statusMessage: "Bad Request",
                    data: message
                };
            }
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
                publicHost: publichost,
                publicPort: Number(publicport)
            };
            logging.write(`MessageBus Host`,`${JSON.stringify(host,null,4)} registered`);
            module.exports.hosts.push(host);
            return await delegate.call(callingModule, { host });
        });
        await requestHandlerSecure.handle(thisModule, { publicHost, publicPort, privateHost, privatePort, path: `/host` });
    }
};