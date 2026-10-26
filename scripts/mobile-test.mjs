/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * UTILIDAD: Emulador Móvil de Hardware Real con Playwright (iPhone 15 / Pixel 7)
 * ARCHIVO: scripts/mobile-test.mjs
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza cualquier ruta de SAFE con emulación física de dispositivo móvil
 * real (eventos touch, DPR Retina 3x, Safe Area Insets, sin scrollbar de PC).
 * Guarda la captura en scratch/mobile-<nombre>.png para inspección inmediata.
 * ==============================================================================
 */

import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

const route = process.argv[2] || '/';
const deviceName = process.argv[3] || 'iPhone 15';

async function runMobileAudit() {
  const deviceConfig = devices[deviceName] || devices['iPhone 15'];
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...deviceConfig,
    locale: 'es-EC',
    timezoneId: 'America/Guayaquil',
  });

  const page = await context.newPage();
  const url = `http://localhost:3000${route.startsWith('/') ? route : `/${route}`}`;
  
  console.log(`📱 [Emulador Móvil] Abriendo ${url} con perfil físico de ${deviceName}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {
    console.log(`⚠️ Red lenta o streaming continuo, esperando DOMContentLoaded...`);
  });

  const cleanName = route.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'home';
  const outDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `mobile_${cleanName}_${deviceName.replace(/\s+/g, '')}.png`);
  await page.screenshot({ path: outPath, fullPage: false });

  console.log(`✅ [Emulador Móvil] Captura física guardada en: ${outPath}`);
  await browser.close();
}

runMobileAudit().catch((err) => {
  console.error('❌ Error en emulación móvil:', err);
  process.exit(1);
});
