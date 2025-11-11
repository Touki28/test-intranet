import puppeteer from 'puppeteer';
import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  try {
    // ✅ Modifie ces variables via Vercel Secrets
    const USER = process.env.HYP_USER;           // ton identifiant Hyperplanning
    const PASS = process.env.HYP_PASS;           // ton mot de passe Hyperplanning
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // PAT GitHub avec droits repo
    const REPO_OWNER = process.env.REPO_OWNER;     // ex: ton pseudo GitHub
    const REPO_NAME = process.env.REPO_NAME;       // ex: nom du repo
    const FILE_PATH = 'public/img/timetable.png';  // chemin du fichier dans le repo

    // Optionnel : protection par query token si tu veux
    const qtoken = req.query.token;
    if (process.env.WEBHOOK_TOKEN && qtoken !== process.env.WEBHOOK_TOKEN) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }

    // --- 1) Lancer Puppeteer et prendre screenshot ---
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 1024 });

    const URL = 'https://hplanning.univ-lehavre.fr/etudiant?identifiant=tfBPsaFYstg6NqsC';
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Login CAS : adapte les sélecteurs si nécessaire
    try {
      await page.waitForSelector('input[name="username"]', { timeout: 8000 });
      await page.type('input[name="username"]', USER, { delay: 50 });
      await page.type('input[name="password"]', PASS, { delay: 50 });
      await Promise.all([
        page.click('button[type="submit"], input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
      ]);
    } catch (err) {
      console.warn('Login automatique CAS impossible, essaye manuellement');
    }

    // Attendre le planning (adapte le sélecteur si besoin)
    try {
      await page.waitForSelector('.planning, .timetable, #edt', { timeout: 8000 });
    } catch (err) {
      console.warn('Planning non trouvé, capture full page.');
    }

    // Screenshot
    const buffer = await page.screenshot({ fullPage: true });
    await browser.close();

    // --- 2) Push sur GitHub via API ---
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // Récupérer le SHA du fichier si existe
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH
      });
      sha = data.sha;
    } catch (err) {
      console.log('Fichier non existant, sera créé');
    }

    // Créer ou mettre à jour le fichier
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: `Update timetable ${new Date().toISOString()}`,
      content: buffer.toString('base64'),
      sha
    });

    res.status(200).json({ ok: true, message: 'Screenshot mis à jour sur GitHub' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
