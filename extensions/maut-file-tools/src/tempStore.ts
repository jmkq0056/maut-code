import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function getTempRoot(): string {
	const dir = path.join(os.homedir(), '.maut-tmp', String(Date.now()).slice(0, -3));
	try { fs.mkdirSync(dir, { recursive: true }); } catch { /* noop */ }
	return dir;
}

export function sanitize(s: string): string {
	return s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

/**
 * Builds a clean output path with the source folder tail embedded in the name so the user
 * can read it later: e.g. `~/.maut-tmp/<ts>/<parentDir>__<basename>--pages-3-5.pdf`.
 */
export function buildOutName(sourcePath: string, suffix: string, ext: string): string {
	const parent = sanitize(path.basename(path.dirname(sourcePath)));
	const base = sanitize(path.basename(sourcePath, path.extname(sourcePath)));
	return path.join(getTempRoot(), `${parent}__${base}${suffix}.${ext}`);
}
