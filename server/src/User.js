import mongoose from 'mongoose'
const UserSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true })
export default mongoose.model('User', UserSchema)
