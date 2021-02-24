const utils = require("utils");
const delegate = require("component.delegate");
const requestHandlerUnsecure = require("component.request.handler.unsecure");
const logging = require("logging");
const config = require("./config.json");
logging.config.add("MessageBus Host");

module.exports = {
    handle: async () => {
        if (process.env.PORT){
            config.host.port = process.env.PORT;
        }
        delegate.register("component.messagebus.host", `${config.host.port}${config.host.path}`, async ({ headers, data }) => {
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
                newHost = { id: utils.generateGUID(), hashedPassphrase, hashedPassphraseSalt, name: host, port };
            } else {
                newHost = { id: utils.generateGUID(), name: host, port };
            }
            logging.write(`MessageBus Host`,`new host created`);
            return await delegate.call( { context: "component.messagebus.host.channel", name: `${config.host.port}${config.host.path}` }, newHost );
        });
        await requestHandlerUnsecure.handle("component.messagebus.host", config.host);
    }
};