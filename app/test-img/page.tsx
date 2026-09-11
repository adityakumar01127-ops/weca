"use client";

import React, { useState } from "react";

export default function TestImgPage() {
  const [s1, setS1] = useState("Waiting");
  const [s2, setS2] = useState("Waiting");
  const [s3, setS3] = useState("Waiting");

  const url = "https://qaaeshezrdxfsaxlpmzo.supabase.co/storage/v1/object/public/wica-images/uploads/1789138608646-iqkyib9.png";

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Safari Image Diagnostic with State</h1>

      <div style={{ marginBottom: 20 }}>
        <h2>Result 1: Direct URL {"->"} {s1}</h2>
        <img
          src={url}
          alt="1"
          style={{ width: 200, display: "block" }}
          onLoad={() => setS1("SUCCESS")}
          onError={() => setS1("ERROR")}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>Result 2: No-referrer {"->"} {s2}</h2>
        <img
          src={url}
          referrerPolicy="no-referrer"
          alt="2"
          style={{ width: 200, display: "block" }}
          onLoad={() => setS2("SUCCESS")}
          onError={() => setS2("ERROR")}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>Result 3: CrossOrigin anonymous {"->"} {s3}</h2>
        <img
          src={url}
          crossOrigin="anonymous"
          alt="3"
          style={{ width: 200, display: "block" }}
          onLoad={() => setS3("SUCCESS")}
          onError={() => setS3("ERROR")}
        />
      </div>
    </div>
  );
}
