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
        delegate.register(thisModule, async ({ headers, data }) => {
            let message = "";
            let { publichost, publicport, privatehost, privateport } = utils.getJSONObject(data) || {};
            let { passphrase } = headers;
            if ( !publichost || !publicport || !privatehost || !privateport){
                message = "publichost, publicport, privatehost and privateport is required to create a host";
                return { headers: { "Content-Type":"text/plain" }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            if (isNaN(Number(publicport)) || isNaN(Number(privateport)) ){
                message = "publicport or privateport is not a number";
                return { headers: { "Content-Type":"text/plain" }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            publicport = Number(publicport);
            privateport = Number(privateport);
          
            let newHost;
            if (passphrase){
                const { hashedPassphrase, hashedPassphraseSalt } = utils.hashPassphrase(passphrase);
                newHost = { id: utils.generateGUID(), hashedPassphrase, hashedPassphraseSalt, publicHost: publichost, publicPort: publicport,  privateHost: privatehost, privatePort: privateport };
            } else {
                newHost = { id: utils.generateGUID(), publicHost: publichost, publicPort: publicport,  privateHost: privatehost, privatePort: privateport };
            }
            logging.write(`MessageBus Host`,`new host created`);
            await delegate.call(callingModule, { host: newHost });
            const response = `${newHost.publicHost} created.`;
            return {
                headers,
                statusCode: 200,
                statusMessage: "Success",
                data: response
            };
        });
        await requestHandlerSecure.handle(thisModule, clonedOptions);
    }
};