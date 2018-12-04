process.env["NTBA_FIX_319"] = 1;
const request = require("request")
const config = require("./config")
if(config.clusterIP == "" || config.telegramBotToken == ""){
    console.log("Please setup cluster ip and telegram bot token first.")
    process.exit(1)
}
const tg = require("node-telegram-bot-api");
const telegram = new tg(config.telegramBotToken, {
    polling: true
})

function getBalance(targetAddr, id){
    return new Promise((resolve, reject) => {
        request.post(config.clusterIP, {
            json: true,
            body:{
                jsonrpc: "2.0",
                method: "getAccountData",
                params: {
                    address: targetAddr,
                    include_shards: true,
                },
                id: id
            }
        }, (err, response, body) => {
            if(body.error != null) return reject(body.error)
            if(body == null) return resolve(null)
            if(body.result == null)return resolve(null)
            return resolve(body.result)
        })
    })
}

telegram.onText(/\/bal (.+)/, async (msg, match) => {
    console.log(`${msg.from.id}:${msg.from.username} >> ${match[1]}`)
    try{
        const result = await getBalance(match[1], 0);
        if(result == null) {
            telegram.sendMessage(msg.chat.id, `<b>ERROR</b>: Result is null`, {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            })
        }

        let sum = 0;
        result.shards.forEach((value) => {
            sum +=parseInt(value.balance, 16)
        })
        const balance = (sum / (10 ** 18)).toFixed(1)
        telegram.sendMessage(msg.chat.id, `<b>Balance of</b>: <code>${match[1]}</code> is:\n<b>${balance} tQKC</b>\nMined Block: <b>${balance / 2.5} Blocks</b>`, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        })

    }catch(e){
        console.log(e)
        telegram.sendMessage(msg.chat.id, `<b>ERROR</b>: ${e.message}\n\nProbably the address is invalid.`, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        })
    }
})