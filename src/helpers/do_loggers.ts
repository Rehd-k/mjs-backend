import * as fs from 'fs';
import * as path from 'path';

const logDir = path.resolve('./logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}



const errorStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });
const activitiesStream = fs.createWriteStream(path.join(logDir, 'activities.log'), { flags: 'a' });

function formatTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const millis = date.getMilliseconds().toString().padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`;
}

export const errorLog = (msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') => {
    const timestamp = formatTime(new Date());
    const line = `[${timestamp}] [${level}] ${msg}\n`;
    process.env.NODE_ENV === 'production' ? console.log(line) : errorStream.write(line);
};

export const activitiesLog = (msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') => {
    const timestamp = formatTime(new Date());
    const line = `[${timestamp}] [${level}] ${msg}\n`;
    process.env.NODE_ENV === 'production' ? console.log(line) : activitiesStream.write(line);
};