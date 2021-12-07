const fs = require("fs")
const { exec } = require("child_process")
Object.assign(process.env, JSON.parse(fs.readFileSync(".env")))
const { Telegraf } = require('telegraf')
bot = new Telegraf(process.env.token)
bot.prefix = "k."
bot.owners = [ 2003262457, 950434881 ]
bot.on('message', async (ctx) => {
  const { message } = ctx.update;
  if (!message.text) return;
  const args = message.text.slice(bot.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase()
  if (commandName == "eval" && bot.owners.includes(message.from.id)) {
    try {
    let evaluated = eval(args.join(" "))
    if (evaluated instanceof Promise) await evaluated;
    if (typeof evaluated !== "string") evaluated = require("util").inspect(evaluated, { depth: 0 })
    evaluated = evaluated.replaceAll(ctx.tg.token, "--sensitive--")
    ctx.replyWithMarkdown("```\n" + evaluated + "\n```")
    } catch (e) {
    ctx.replyWithMarkdown("```\n" + e + "\n```")
    }
  }
  if (commandName == "echo" && bot.owners.includes(message.from.id)) {
    if ((await ctx.getChatMember(bot.botInfo.id)).can_delete_messages) ctx.deleteMessage()
    ctx.reply(args.join(" "))
  }
  if (commandName == "exec" && bot.owners.includes(message.from.id)) {
    let proc = exec(args.join(" "), (isErr, out, err) => {
      if (isErr) ctx.reply("Ошибка при выполнении скрипта")
      else ctx.reply("Скрипт завершен успешно")
      if (out) ctx.replyWithMarkdown("```\n" + out.slice(0, 3608) + "\n```")
      if (err) ctx.replyWithMarkdown("```\n" + err.slice(0, 3608) + "\n```")
    })
    // 30s timeout for process
    setTimeout(() => {
      exec(`test -d /proc/${proc.pid}`, (isErr) => {
        if (!isErr) {
          exec(`kill -0 ${proc.pid}`)
          ctx.reply("Убито: таймаут")
        }
      })
    }, 60000)
  }
})
bot.launch()
process.on("unhandledRejection", (e) => { console.log(e)})
process.on("uncaughtException", (e) => { console.log(e)})
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))