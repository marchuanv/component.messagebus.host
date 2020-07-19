const utils = require("utils");
const delegate = require("component.delegate");
const requestHandlerSecure = require("component.request.handler.secure");
const logging = require("logging");
logging.config.add("MessageBus Host");
module.exports = {
    hosts: [],
    handle: async (callingModule, options) => {
        const clonedOptions = JSON.parse(JSON.stringify(options));
        clonedOptions.path = "/host";
        const thisModule = `component.messagebus.host.${clonedOptions.publicHost}.${clonedOptions.publicPort}`;
        delegate.register(thisModule, async ({ headers: {  username, passphrase, publichost, publicport, privatehost, privateport } }) => {
            let message = "";
            if ( !publichost || !publicport || !privatehost || !privateport){
                message = "required http headers: publichost, publicport, privatehost and privateport";
                return { headers: { "Content-Type":"text/plain", "Content-Length": Buffer.byteLength(message) }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            if (isNaN(Number(publicport)) || isNaN(Number(privateport)) ){
                message = "publicport or privateport is not a number";
                return { headers: { "Content-Type":"text/plain", "Content-Length": Buffer.byteLength(message) }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            publicport = Number(publicport);
            privateport = Number(privateport);
            const exists = module.exports.hosts.find( h => h.username === username && h.publicHost === publichost && h.publicPort === publicport);
            if (exists){
                message = "host already registered";
                return { headers: { "Content-Type":"text/plain", "Content-Length": Buffer.byteLength(message) }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            let newHost;
            if (passphrase){
                const { hashedPassphrase, hashedPassphraseSalt } = utils.hashPassphrase(passphrase);
                newHost = { id: utils.generateGUID(), username, hashedPassphrase, hashedPassphraseSalt, publicHost: publichost, publicPort: publicport,  privateHost: privatehost, privatePort: privateport };
            } else {
                newHost = { id: utils.generateGUID(), username, publicHost: publichost, publicPort: publicport,  privateHost: privatehost, privatePort: privateport };
            }
            logging.write(`MessageBus Host`,`new host registered`);
            module.exports.hosts.push(newHost)
            await delegate.call(callingModule, { hosts: module.exports.hosts });
            return {
                headers: { "Content-Type":"text/plain", "Content-Length": Buffer.byteLength(statusMessage) },
                statusCode: 200,
                statusMessage: "Success",
                data: `${newHost.name} created.`
            };
        });
        await requestHandlerSecure.handle(thisModule, clonedOptions);
    }
};