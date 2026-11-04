import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client if key available
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Network Assistant Endpoint
app.post('/api/network-ai', async (req, res) => {
  try {
    const { telemetry, question } = req.body;
    
    // Fallback rule-based response generator if Gemini key is missing or API fails
    const generateFallback = (telemetryData: any, userQ: string) => {
      const avgLatency = telemetryData?.avgLatency || 32;
      const connectedCount = telemetryData?.connectedGroundStations || 0;
      const totalSatellites = telemetryData?.totalSatellites || 60;
      const scenario = telemetryData?.scenario || 'Normal Network Operation';

      let text = `### 🛰️ OrbitNet AI Diagnostic Report (${scenario})\n\n`;
      
      if (userQ && userQ.trim()) {
        text += `**Analysis for Query:** "${userQ}"\n\n`;
      }

      text += `**1. Current Connection & Link Quality:**\n`;
      text += `• The constellation is maintaining ${totalSatellites} active LEO satellites in orbit.\n`;
      text += `• ${connectedCount} ground stations currently have active optical/RF feeder links.\n`;
      text += `• Average global round-trip latency is **${avgLatency.toFixed(1)} ms**, within acceptable bounds for interactive applications.\n\n`;

      text += `**2. Latency & Propagation Insights:**\n`;
      if (avgLatency > 50) {
        text += `• **Notice:** Latency is elevated due to multi-hop Inter-Satellite Laser (ISL) routing across polar planes or current scenario congestion.\n`;
      } else {
        text += `• Direct slant paths between ground stations and zenith satellites provide near line-of-sight propagation (~${(avgLatency * 0.45).toFixed(1)} ms speed-of-light physical delay).\n`;
      }

      text += `\n**3. Ground Station Signal & Handover Advisory:**\n`;
      if (telemetryData?.weakStations && telemetryData.weakStations.length > 0) {
        text += `• Stations with low elevation angle / weak RSSI: **${telemetryData.weakStations.join(', ')}**. A satellite handover will occur in ~45-90 seconds as orbital motion progresses.\n`;
      } else {
        text += `• Elevation angles across active ground terminals exceed the 25° minimum threshold, maintaining link margin > 6 dB.\n`;
      }

      text += `\n**4. Optimization Recommendations:**\n`;
      text += `• Enable ISL cross-links between adjacent planes to reduce ground gateway hop count.\n`;
      text += `• Consider raising satellite altitude by 50-100 km for broader coverage footprint, or increasing satellites per plane to lower slant path attenuation.\n`;

      return text;
    };

    if (!aiClient || !process.env.GEMINI_API_KEY) {
      const fallbackAnalysis = generateFallback(telemetry, question);
      return res.json({ analysis: fallbackAnalysis, isFallback: true });
    }

    const prompt = `You are an expert satellite networking engineer and orbital mechanics specialist for the Satellite Internet Network Simulator.
Analyze the following real-time telemetry from the LEO satellite constellation simulation and answer the user query or provide a diagnostic summary.

CURRENT SIMULATION TELEMETRY:
- Active Scenario: ${telemetry.scenario}
- Total Satellites: ${telemetry.totalSatellites}
- Active Orbiting Satellites: ${telemetry.activeSatellites}
- Connected Ground Stations: ${telemetry.connectedGroundStations} / ${telemetry.totalGroundStations}
- Average Latency: ${telemetry.avgLatency?.toFixed(1)} ms
- Network Throughput: ${telemetry.totalThroughput?.toFixed(1)} Gbps
- Active Laser ISL Links: ${telemetry.activeISLCount}
- Active Downlinks: ${telemetry.activeDownlinks}
- Global Coverage: ${telemetry.coveragePercentage?.toFixed(1)}%
- Transmission Frequency / Power: ${telemetry.frequencyGHz} GHz / ${telemetry.txPowerWatts} W
- Weak / Critical Ground Stations: ${JSON.stringify(telemetry.weakStations || [])}

USER QUESTION / FOCUS: ${question || 'Give a comprehensive diagnostic scan explaining best connections, latency drivers, handovers, and optimization recommendations.'}

FORMAT GUIDELINES:
- Provide clear, professional markdown formatted response with bullet points.
- Address: 1) Best performing connections, 2) Latency & ISL routing analysis, 3) Handover status & weak ground stations, 4) Operational optimization recommendations.
- Keep response under 350 words, readable and authoritative.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const analysis = response.text || generateFallback(telemetry, question);
    res.json({ analysis, isFallback: false });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    // Return fallback gracefully on error
    const telemetry = req.body?.telemetry || {};
    const question = req.body?.question || '';
    const fallbackText = `### 🛰️ Telemetry Diagnostic Scan\n\n• **Status:** Active LEO Constellation (${telemetry.totalSatellites || 60} satellites)\n• **Average Latency:** ${(telemetry.avgLatency || 32).toFixed(1)} ms\n• **Ground Coverage:** ${(telemetry.coveragePercentage || 85).toFixed(1)}%\n\n*Diagnostic Note:* Inter-satellite laser links are actively routing packets through optimal shortest geometric paths. Handover procedures are automated based on elevation geometry.`;
    res.json({ analysis: fallbackText, isFallback: true, error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(
          url,
          `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Satellite Internet Network Simulator</title>
    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
        );
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Satellite Network Simulator running at http://localhost:${PORT}`);
  });
}

startServer();
