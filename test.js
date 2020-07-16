const messageBusHost = require("./component.messagebus.host.js");
const delegate = require("component.delegate");
(async()=>{ 
    const callingModule = "component.messagebus";
    delegate.register(callingModule, (callback) => {
        return { statusCode: 200, statusMessage: "Success", headers: {}, data: null };
    });
    await messageBusHost.handle({ callingModule, port: 3000 });
})().catch((err)=>{
    console.error(err);
});