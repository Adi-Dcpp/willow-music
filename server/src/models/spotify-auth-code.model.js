import mongoose from "mongoose";

const spotifyAuthCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// expireAfterSeconds: 0 means the document expires at the Date stored in expiresAt.
spotifyAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SpotifyAuthCode = mongoose.model("SpotifyAuthCode", spotifyAuthCodeSchema);
