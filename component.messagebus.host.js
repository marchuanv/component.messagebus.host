const utils = require("utils");
const delegate = require("component.delegate");
const requestHandlerSecure = require("component.request.handler.secure");
const logging = require("logging");
logging.config.add("MessageBus Host");
module.exports = {
    handle: async (options) => {
        const clonedOptions = JSON.parse(JSON.stringify(options));
        clonedOptions.path = "/host";
        const context = `component.messagebus.host`;
        const name = `${options.port}/host`;
        delegate.register(context, name, async ({ headers, data }) => {
            let message = "";
            let { host, port } = utils.getJSONObject(data) || {};
            let { passphrase } = headers;
            if ( !host || !port ){
                message = "a host and port is required to create a host";
                return { headers: { "Content-Type":"text/plain" }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            if (isNaN(Number(port))) {
                message = "specified port is not a number";
                return { headers: { "Content-Type":"text/plain" }, statusCode: 400, statusMessage: "Bad Request", data: message };
            }
            port = Number(port);
          
            let newHost;
            if (passphrase){
                const { hashedPassphrase, hashedPassphraseSalt } = utils.hashPassphrase(passphrase);
                newHost = { id: utils.generateGUID(), hashedPassphrase, hashedPassphraseSalt, host, port };
            } else {
                newHost = { id: utils.generateGUID(), host, port };
            }
            logging.write(`MessageBus Host`,`new host created`);
            await delegate.call( { context: "component.messagebus.host.channel", name: `${options.port}/channel` }, { host: newHost });
            const response = `${newHost.host} created.`;
            return {
                headers,
                statusCode: 200,
                statusMessage: "Success",
                data: response
            };
        });
        const results = await requestHandlerSecure.handle(context, clonedOptions);
    }
};