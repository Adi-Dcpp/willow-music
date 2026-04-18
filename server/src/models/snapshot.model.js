import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    spotifyUserId: {
      type: String,
      required: true,
      index: true,
    },

    displayName: {
      type: String,
      default: "",
    },

    timeRange: {
      type: String,
      enum: ["short_term", "medium_term", "long_term"],
      required: true,
    },

    topArtists: [
      {
        id: String,
        name: String,
        image: String,
        genres: [String],
      },
    ],

    topTracks: [
      {
        id: String,
        name: String,
        artist: String,
        image: String,
        spotifyUrl: String,
      },
    ],

    summary: {
      topGenres: [String],
      topArtist: String,
      vibe: String,
      depthScore: Number,
    },

    aiReview: {
      type: String,
      default: "",
    },

    insights: {
      tasteDriftScore: {
        type: Number,
        default: null,
      },
      tasteDriftMessage: {
        type: String,
        default: "",
      },
      topGenres: [
        {
          genre: String,
          count: Number,
        },
      ],
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Snapshot = mongoose.model("Snapshot", snapshotSchema);