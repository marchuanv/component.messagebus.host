const messageBusHost = require("./component.messagebus.host.js");
const delegate = require("component.delegate");
const unsecureRequest = require("component.request.unsecure");
const config = require("./config.json");
const utils = require("utils");

(async() => { 
    if (process.env.PORT){
        config.host.port = process.env.PORT;
    }
    const newHostRequest = { host: "localhost", port: 6000 };
    delegate.register("component.messagebus.host.channel", `${config.host.port}${config.host.path}`, ({ name, port }) => {
        return { statusCode: 200, statusMessage: "Success", headers: {}, data: `notified of host started on ${name}:${port}` };
    });
    await messageBusHost.handle();

    //Unsecure Request To Register New Host
    let results = await unsecureRequest.send({ 
        host: config.host.name,
        port: config.host.port,
        path: config.host.path,
        method: "GET",
        username: "marchuanv",
        fromhost: "localhost",
        fromport: 6000,
        data: utils.getJSONString(newHostRequest)
    });
    if (results.statusCode !== 200 && results.statusMessage !== `notified of host started on ${newHostRequest.host}:${newHostRequest.port}`){
        throw "Unsecure Request To Register New Host Test Failed";
    }

    process.exit();
   
})().catch((err)=>{
    console.error(err);
});