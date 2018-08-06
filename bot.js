const r2 = require("r2")
const bb = require("bot-brother")

const config = require('./config')
const texts = require('./texts')

const { key, webHook, polling, baseApiUrl } = config.bot
const options = { key, polling, baseApiUrl }
if (process.env !== 'http://localhost:9000') {
  options.webHook = webHook
}

const bot = module.exports = bb(options)
  .texts(texts.ru, { locale: 'ru' })
  .texts(texts.en, { locale: 'en' })
  .texts(texts.default)
  .keyboard([
    [{ 'button.wakeup': { go: 'wakeup' }}],
    [{ 'button.summary': { go: 'summary' }}],
    [{ 'button.settings': { go: 'settings' }}]
])
.keyboard('backButton', [
  [{
    'button.back': {
      go: '$back',
      isShown: (ctx) => !ctx.hideBackButton
    }
  }]
])
  .keyboard('cancelButton', [
    [{
      'button.cancel': { go: 'start' }
    }]
  ])
  .use('before', (ctx) => {
    const now = Date.now()

    ctx.session.balance = ctx.session.balance || 1000
    ctx.data.balance = ctx.session.balance

    ctx.session.alarmTime = ctx.session.alarmTime || false
    ctx.data.alarmTime = ctx.session.alarmTime

    ctx.data.user = ctx.meta.user

    ctx.settings = ctx.settings || {}
    ctx.setLocale(ctx.session.locale || config.defaults.locale)
    ctx.timezone = ctx.session.timezone || config.defaults.timezone

    if (!/^settings_/.test(ctx.command.name)) {
      if (!ctx.session.locale) {
        return ctx.go('settings_locale')
      }
      if (!ctx.session.timezone) {
        return ctx.go('settings_timezone')
      }
    }
  })

const detectTimezone = async (query) => {
  let latitude, longitude

  if (query.latitude && query.longitude) {
    latitude = query.latitude
    longitude = query.longitude
  } else {
    const queryEncoded = encodeURIComponent(query)
    const response = await r2(`https://maps.googleapis.com/maps/api/geocode/json?language=en&key=${config.googleMapsKey}&address=${queryEncoded}`).json
    const location = response.results[0].geometry.location
    latitude = location.lat
    longitude = location.lng
  }

  const timezone = await r2(`https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}`)

  return timezone
}

const callerChatId = 490694645
const scheduleCall = (wakeupMotivation, time, timezone) => {
  return bot.api.sendMessage(callerChatId, `Motivation: ${wakeupMotivation} Time: ${time} Timezone: ${timezone}`)
}

bot.command('start')
  .invoke(ctx => ctx.sendMessage('main.start'))

bot.command('settings')
  .invoke(ctx => {
    ctx.data.settings = { locale: ctx.getLocale(), timezone: ctx.timezone }
    ctx.sendMessage('settings.main')
  })
  .keyboard([
    [{ 'button.locale': { go: 'settings_locale' }}],
    [{ 'button.timezone': { go: 'settings_timezone' }}],
    'backButton'
  ])

bot.command('settings_timezone', { compliantKeyboard: true})
  .invoke(ctx => {
    if (!ctx.session.timezone)
      ctx.hideBackButton = true

    return ctx.sendMessage('settings.timezone')
  })
  .answer(ctx => {
    return detectTimezone(ctx.message.location || ctx.answer).then(timezone => {
      if (!timezone)
        throw new Error('no timezone')

      ctx.session.timezone = timezone

      return ctx.sendMessage('answer.success').then(() => ctx.goBack())
    }).catch(err => {
      console.error(err, err.stack)
      return ctx.repeat()
    })
  })
  .keyboard(['backButton'])

bot.command('settings_locale')
  .invoke(ctx => {
    if (!ctx.session.locale)
      ctx.hideBackButton = true

    return ctx.sendMessage('settings.locale')
  })
  .answer(ctx => {
    ctx.session.locale = ctx.answer
    ctx.setLocale(ctx.answer)

    return ctx.sendMessage('answer.success').then(() => ctx.goBack())
  })
  .keyboard([[
    { 'buttons.en': 'en' },
    { 'buttons.ru': 'ru' }
  ], 'backButton'])

bot.command('wakeup', { compliantKeyboard: true })
  .use('before', ctx => ctx.hideKeyboard())
  .invoke(ctx => ctx.sendMessage('main.wakeup'))
  .answer(ctx => ctx.go('time', { args: [ctx.answer] }))

bot.command('time', { compliantKeyboard: true })
  .use('before', ctx => ctx.hideKeyboard())
  .invoke(ctx => ctx.sendMessage('main.time'))
  .answer(ctx => {
    const wakeupMotivation = ctx.command.args[0]

    ctx.session.wakeupMotivation = wakeupMotivation
    ctx.session.alarmTime = ctx.answer

    scheduleCall(wakeupMotivation, ctx.session.wakeupMotivation, ctx.timezone)

    return ctx.go('summary')
  })

bot.command('summary').invoke(ctx => ctx.sendMessage('main.summary'))