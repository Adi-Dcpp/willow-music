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

    timeRange: {
      type: String,
      enum: ["short_term", "medium_term", "long_term"],
      required: true,
    },

    topArtists: [
      {
        id: String,
        name: String,
        imageUrl: String,
        genres: [String],
      },
    ],

    topTracks: [
      {
        id: String,
        name: String,
        artistNames: [String],
        albumImageUrl: String,
      },
    ],

    insights: {
      tasteDriftScore: {
        type: Number,
        default: null,
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