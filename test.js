const messageBusHost = require("./component.messagebus.host.js");
const delegate = require("component.delegate");
const request = require("component.request");
(async()=>{ 
    const callingModule = "component.messagebus.publisher";
    delegate.register(callingModule, ({hosts}) => {
        return { statusCode: 200, statusMessage: "Success", headers: {}, data: null };
    });
    await messageBusHost.handle({
        channel: "apples", 
        host: "localhost", 
        port: 3000
    });
    //Register New Host
    let results = await request.send({ 
        host: "localhost",
        port: 3000,
        path: "/host",
        method: "GET",
        headers: { 
            username: "marchuanv",
            fromhost: "localhost",
            fromport: 6000,
            passphrase: "secure1"
        }, 
        data: `{ "host": "localhost", "port": "6000" }`,
        retryCount: 1
    });
    if (results.statusCode !== 200){
        throw "New Request To Register New Host Test Failed";
    }
    //New Request To Registered Secured Host
    results = await request.send({
        host: "localhost",
        port: 6000,
        path: "/newhost",
        method: "GET",
        headers: { 
            username: "marchuanv",
            fromhost: "localhost",
            fromport: 6000,
            passphrase: "secure1"
        }, 
        data: "",
        retryCount: 1
    });
    if (results.statusCode !== 200){
        throw "New Request To Registered Host Test Failed";
    }
})().catch((err)=>{
    console.error(err);
});