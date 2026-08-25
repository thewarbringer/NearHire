const Razorpay = require('razorpay')

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpayInstance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
})

module.exports = {
  razorpayInstance,
  razorpayKeyId,
  razorpayKeySecret,
}
