import { ImageResponse } from "@vercel/og";
import React from "react";
import { Snapshot } from "../models/snapshot.model.js";

export const generateOGImage = async (req, res) => {
  try {
    const { shareId } = req.params;

    const snapshot = await Snapshot.findOne({
      shareId,
      deletedAt: null,
    });

    if (!snapshot) {
      return res.status(404).send("Snapshot not found");
    }

    const { topArtists, insights } = snapshot;

    const topArtistNames = topArtists
      .slice(0, 3)
      .map((a) => a.name)
      .join(", ");

    const topGenre = insights?.topGenres?.[0]?.genre || "Music";

    const image = new ImageResponse(
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            background: "#0f172a",
            color: "white",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          },
        },
        React.createElement("h1", { style: { fontSize: 60 } }, "🎧 Willow"),
        React.createElement(
          "p",
          { style: { fontSize: 30 } },
          `Top Artists: ${topArtistNames}`
        ),
        React.createElement(
          "p",
          { style: { fontSize: 24 } },
          `Genre: ${topGenre}`
        )
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    res.setHeader("Content-Type", "image/png");
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    return res.send(imageBuffer);
  } catch (err) {
    return res.status(500).send("Failed to generate OG image");
  }
};