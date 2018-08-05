const r2 = require("r2")
const bb = require("bot-brother")

const config = require('./config')
const texts = require('./texts')

const { key, webHook, polling, baseApiUrl } = config.bot
const bot = module.exports = bb({ key, webHook, polling, baseApiUrl })
  .texts(texts.ru, { locale: 'ru' })
  .texts(texts.en, { locale: 'en' })
  .texts(texts.default)
  .keyboard([
    [{ 'button.wakeup': { go: 'wakeup' }}],
    [{ 'button.summary': { go: 'summary' }}],
    [{ 'button.settings': { go: 'settings' }}]
])