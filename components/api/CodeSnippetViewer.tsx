"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export const CodeSnippetViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ts" | "curl" | "py">("ts");
  const [copied, setCopied] = useState(false);

  const snippets = {
    ts: `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function scoreAnomaly(imageBase64: string, category: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            text: \`You are the Wica Weirdness Engine. Analyze this \${category} image.
Return strict JSON with dimensions: absurdity, rarity, craft, cultural_novelty, wit,
one_line_verdict, and flags.\`,
          },
        ],
      },
    ],
  });

  return JSON.parse(response.text.trim());
}`,
    curl: `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=\${GEMINI_API_KEY}" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "contents": [{
      "parts": [
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "'"\${BASE64_IMAGE}"'"
          }
        },
        {
          "text": "Score this anomaly across Absurdity, Rarity, Craft, Cultural Novelty, and Wit. Return strict JSON."
        }
      ]
    }]
  }'`,
    py: `from google import genai
from google.genai import types
import json

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")

def score_anomaly(image_bytes: bytes, category: str):
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            f"Analyze this {category} image for Wica. Score 0-10 on absurdity, rarity, craft, cultural_novelty, wit."
        ]
    )
    return json.loads(response.text)
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden font-mono text-xs">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <button
            onClick={() => setActiveTab("ts")}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "ts" ? "bg-zinc-800 text-cyan" : "text-zinc-400 hover:text-white"
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setActiveTab("curl")}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "curl" ? "bg-zinc-800 text-cyan" : "text-zinc-400 hover:text-white"
            }`}
          >
            cURL / REST
          </button>
          <button
            onClick={() => setActiveTab("py")}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "py" ? "bg-zinc-800 text-cyan" : "text-zinc-400 hover:text-white"
            }`}
          >
            Python
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 sm:p-5 overflow-x-auto text-zinc-300 leading-relaxed">
        <pre>{snippets[activeTab]}</pre>
      </div>
    </div>
  );
};
