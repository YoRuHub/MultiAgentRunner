import * as cp from 'child_process';
import * as util from 'util';

const exec = util.promisify(cp.exec);

export async function validateCliAvailability(command: string): Promise<boolean> {
    try {
        const checkCommand = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
        await exec(checkCommand);
        return true;
    } catch (error) {
        return false;
    }
}
