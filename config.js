module.exports = {
  bot: {
    key: process.env.TOKEN,
    polling: {
      interval: 100,
      timeout: 0
    },
    webHook: {
      url: process.env.HEROKU_URL + process.env.TOKEN,
      https: true
    },
    baseApiUrl: 'https://api.telegram.org'
  },
  defaults: {
    locale: 'ru',
    timezone: 'Europe/Moscow'
  },
  googleMapsKey: ''
}