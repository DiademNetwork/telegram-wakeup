const r2 = require("r2")
const querystring = require("querystring")

const detectTimezone = async (query) => {
  let latitude, longitude

  if (query.latitude && query.longitude) {
    latitude = query.latitude
    longitude = query.longitude
  } else {
    const queryEncoded = encodeURIComponent(query)
    const response = await r2(`https://maps.googleapis.com/maps/api/geocode/json?language=en&key=&address=${queryEncoded}`).json
    const location = response.results[0].geometry.location
    latitude = location.lat
    longitude = location.lng
  }

  const options = querystring.stringify({ location: `${latitude}, ${longitude}`, timestamp: Math.round((new Date()).getTime() / 1000) })
  const timezone = await r2(`https://maps.googleapis.com/maps/api/timezone/json?${options}`).json

  return timezone
}

detectTimezone("Simferopol").then(console.log)
