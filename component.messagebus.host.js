const utils = require("utils");
const delegate = require("component.delegate");
const requestHandlerSecure = require("component.request.handler.secure");
const logging = require("logging");
logging.config.add("MessageBus Host");
module.exports = { 
    handle: async (callingModule, { publicHost, publicPort, privateHost, privatePort }) => {
        const thisModule = `component.messagebus.host.${publicHost}.${publicPort}`;
        const hosts = [];
        delegate.register(thisModule, async ({ headers: {  username, passphrase, channel, publichost, publicport, privatehost, privateport } }) => {
            let message = "";
            if (!passphrase || !publichost || !publicport || !channel || !privatehost || !privateport){
                message = "missing headers: passphrase, publichost, publicport, privatehost, privateport and channel";
                return { headers: { "Content-Type":"text/plain", "Content-Length": Buffer.byteLength(message) }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            if (isNaN(Number(publicport)) || isNaN(Number(privateport)) ){
                message = "publicport or privateport is not a number";
                return { headers: { "Content-Type":"text/plain", "Content-Length": Buffer.byteLength(message) }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            publicport = Number(publicport);
            privateport = Number(privateport);
            const exists = hosts.find( h => h.username === username && h.publicHost === publichost && h.publicPort === publicport);
            if (exists){
                message = "host already registered";
                return { headers: { "Content-Type":"text/plain", "Content-Length": Buffer.byteLength(message) }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            const { hashedPassphrase, hashedPassphraseSalt } = utils.hashPassphrase(passphrase);
            const newHost = { id: utils.generateGUID(), channel, username, hashedPassphrase, hashedPassphraseSalt, publicHost: publichost, publicPort: publicport,  privateHost: privatehost, privatePort: privateport };
            hosts.push(newHost)
            logging.write(`MessageBus Host`,`new host registered`);
            return await delegate.call(callingModule, { newHost, hosts });
        });
        await requestHandlerSecure.handle(thisModule, { publicHost, publicPort, privateHost, privatePort, path: `/host` });
    }
};