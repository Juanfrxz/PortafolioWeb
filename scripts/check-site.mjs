#!/usr/bin/env node
/**
 * Validaciones del sitio estatico. Sin dependencias: solo Node.
 *
 * Comprueba lo que se rompe en silencio y no se nota hasta produccion:
 *   1. Rutas locales (src/href) que apuntan a archivos que no existen
 *   2. Claves de i18n faltantes o descompensadas entre es.json y en.json
 *   3. Sintaxis de los JS
 *   4. Assets desproporcionados para una landing
 *
 * Uso: node scripts/check-site.mjs
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

let failures = 0;
let warnings = 0;

const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++; };
const warn = (msg) => { console.warn(`  ! ${msg}`); warnings++; };
const pass = (msg) => console.log(`  ✓ ${msg}`);
const section = (t) => console.log(`\n${t}`);

const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/*==================== 1. RUTAS LOCALES ====================*/
section('1. Rutas locales referenciadas en index.html');
{
    const refs = new Set();
    for (const m of html.matchAll(/(?:src|href)="(?!https?:|#|mailto:|data:|\/\/)([^"]+)"/g)) {
        refs.add(m[1]);
    }

    // Rutas que el JS pide en runtime: no aparecen como src/href
    const runtime = [
        'assets/languages/es.json',
        'assets/languages/en.json',
        'assets/models/avatar_programador.glb',
    ];

    let broken = 0;
    for (const ref of [...refs, ...runtime].sort()) {
        const p = path.join(ROOT, ref.replace(/^\.\//, ''));
        if (!existsSync(p)) {
            fail(`no existe: ${ref}`);
            broken++;
        }
    }
    if (!broken) pass(`${refs.size + runtime.length} rutas verificadas, todas existen`);
}

/*==================== 2. I18N ====================*/
section('2. Traducciones');
{
    const pairs = [...html.matchAll(/data-section="([^"]+)"\s+data-value="([^"]+)"/g)]
        .map(m => [m[1], m[2]]);

    const langs = {};
    for (const lang of ['es', 'en']) {
        const p = path.join(ROOT, `assets/languages/${lang}.json`);
        try {
            langs[lang] = JSON.parse(readFileSync(p, 'utf8'));
        } catch (err) {
            fail(`${lang}.json no es JSON valido: ${err.message}`);
            langs[lang] = {};
        }
    }

    for (const [lang, data] of Object.entries(langs)) {
        const missing = pairs
            .filter(([s, v]) => typeof data?.[s]?.[v] !== 'string')
            .map(([s, v]) => `${s}.${v}`);
        if (missing.length) {
            fail(`${lang}.json: faltan ${[...new Set(missing)].join(', ')}`);
        } else {
            pass(`${lang}.json cubre los ${pairs.length} elementos traducibles`);
        }
    }

    // Ambos idiomas deben tener el mismo juego de claves
    const flat = (d) => new Set(
        Object.entries(d).flatMap(([s, v]) =>
            v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).map(k => `${s}.${k}`) : [])
    );
    const es = flat(langs.es), en = flat(langs.en);
    const onlyEs = [...es].filter(k => !en.has(k));
    const onlyEn = [...en].filter(k => !es.has(k));
    if (onlyEs.length) fail(`solo en es.json: ${onlyEs.join(', ')}`);
    if (onlyEn.length) fail(`solo en en.json: ${onlyEn.join(', ')}`);
    if (!onlyEs.length && !onlyEn.length) pass('es.json y en.json estan sincronizados');

    // El typing del hero necesita una lista, no un string
    for (const [lang, data] of Object.entries(langs)) {
        const roles = data?.home?.roles;
        if (!Array.isArray(roles) || roles.length === 0) {
            fail(`${lang}.json: home.roles debe ser una lista no vacia`);
        }
    }
}

/*==================== 3. SINTAXIS JS ====================*/
section('3. Sintaxis de los scripts');
{
    const files = ['main.js', '3d-model.js', 'particles.js', 'tour.js']
        .map(f => path.join(ROOT, 'assets/js', f))
        .filter(existsSync);

    for (const f of files) {
        try {
            execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
            pass(`${rel(f)}`);
        } catch (err) {
            fail(`${rel(f)}: ${String(err.stderr || err.message).split('\n')[0]}`);
        }
    }
}

/*==================== 4. PESO DE LOS ASSETS ====================*/
section('4. Peso de los assets servidos');
{
    const LIMITS = { '.glb': 5, '.png': 1, '.jpg': 1, '.webp': 1, '.pdf': 2 }; // MB
    const refs = new Set();
    for (const m of html.matchAll(/(?:src|href)="(?!https?:|#|mailto:|data:|\/\/)([^"]+)"/g)) refs.add(m[1]);
    refs.add('assets/models/avatar_programador.glb');

    let total = 0;
    const heavy = [];
    for (const ref of refs) {
        const p = path.join(ROOT, ref.replace(/^\.\//, ''));
        if (!existsSync(p) || !statSync(p).isFile()) continue;
        const mb = statSync(p).size / 1024 / 1024;
        total += mb;
        const limit = LIMITS[path.extname(p).toLowerCase()];
        if (limit && mb > limit) heavy.push(`${ref} pesa ${mb.toFixed(2)} MB (limite ${limit} MB)`);
    }
    heavy.forEach(warn);
    const verdict = total < 6 ? pass : warn;
    verdict(`total referenciado: ${total.toFixed(2)} MB`);
}

/*==================== RESULTADO ====================*/
console.log('\n' + '─'.repeat(50));
if (failures) {
    console.error(`FALLO: ${failures} problema(s)${warnings ? `, ${warnings} aviso(s)` : ''}`);
    process.exit(1);
}
console.log(`OK: sin problemas${warnings ? `, ${warnings} aviso(s)` : ''}`);
