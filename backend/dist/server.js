import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env from project root (backend/dist/ → backend/ → root)
// __dirname = backend/dist/ → '../..' = project root (Kyron Medical/)
// override: true forces dotenv to overwrite any empty env vars already set by the OS
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), override: true });
dotenv.config({ override: true }); // fallback: .env in cwd
import chatRouter from './routes/chat.js';
import appointmentsRouter from './routes/appointments.js';
import voiceRouter from './routes/voice.js';
const app = express();
const PORT = parseInt(process.env.PORT || '3001');
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/voice', voiceRouter);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Kyron Medical AI Assistant',
        timestamp: new Date().toISOString(),
    });
});
// ─── Serve Frontend ───────────────────────────────────────────────────────────
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
// SPA fallback
app.get('*', (_req, res) => {
    const indexPath = path.join(frontendDist, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(200).json({
                message: 'Kyron Medical API is running. Frontend not built yet.',
                endpoints: ['/api/health', '/api/chat', '/api/appointments', '/api/voice'],
            });
        }
    });
});
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  🏥 Kyron Medical AI Assistant');
    console.log(`  🚀 Server running on port ${PORT}`);
    console.log(`  🌐 http://localhost:${PORT}`);
    console.log('');
    console.log('  API Endpoints:');
    console.log('  - POST /api/chat           (streaming AI chat)');
    console.log('  - GET  /api/appointments   (doctors & slots)');
    console.log('  - POST /api/voice/initiate (outbound call)');
    console.log('  - POST /api/voice/webhook  (Vapi webhook)');
    console.log('');
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    console.log(`  ANTHROPIC_API_KEY: ${hasKey ? '✅ set' : '❌ NOT SET — chat will fail'}`);
    console.log('');
});
export default app;
//# sourceMappingURL=server.js.map