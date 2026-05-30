/* eslint-disable no-console */
import { existsSync } from 'fs';
import path from 'path';
import * as winston from 'winston';

const configDirectory = process.env.CONFIG_DIRECTORY
  ? process.env.CONFIG_DIRECTORY
  : path.join(__dirname, '../config');

const isDocker = existsSync('/.dockerenv');

// In Docker, log to stdout by default (avoids EMFILE/EBADF from rotate + symlinks on low ulimit).
// Set LOG_TO_FILE=true to persist logs under /app/config/logs.
const enableFileLogs =
  process.env.LOG_TO_FILE === 'true' ||
  (process.env.LOG_TO_FILE !== 'false' && !isDocker);

const hformat = winston.format.printf(
  ({ level, label, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]${
      label ? `[${label}]` : ''
    }: ${message} `;
    if (Object.keys(metadata).length > 0) {
      msg += JSON.stringify(metadata);
    }
    return msg;
  }
);

type DailyRotateFileTransport = winston.transport & {
  on(event: string, listener: (...args: unknown[]) => void): void;
  _stream?: NodeJS.WritableStream;
};

const bindLogTransportGuards = (
  transport: DailyRotateFileTransport,
  name: string
) => {
  transport.on('error', (err: Error) => {
    console.error(`Error in ${name} transport:`, err.message);
  });

  transport.on('open', () => {
    const stream = transport._stream;

    stream?.on?.('error', (err: Error) => {
      console.error(`Error in ${name} stream:`, err.message);
    });
  });
};

const buildFileTransports = (): winston.transport[] => {
  // Load only when needed so Docker console-only mode never touches file-stream-rotator.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('winston-daily-rotate-file');

  const logsDirectory = path.join(configDirectory, 'logs');

  const DailyRotateFile = (
    winston.transports as unknown as {
      DailyRotateFile: new (options: object) => DailyRotateFileTransport;
    }
  ).DailyRotateFile;

  const seerrFileTransport = new DailyRotateFile({
    filename: path.join(logsDirectory, 'seerr-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d',
    createSymlink: !isDocker,
    symlinkName: 'seerr.log',
  });

  const machineLogFileTransport = new DailyRotateFile({
    filename: path.join(logsDirectory, '.machinelogs-%DATE%.json'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '1d',
    createSymlink: !isDocker,
    symlinkName: '.machinelogs.json',
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.timestamp(),
      winston.format.json()
    ),
  });

  bindLogTransportGuards(seerrFileTransport, 'seerr file');
  bindLogTransportGuards(machineLogFileTransport, 'machine log file');

  return [seerrFileTransport, machineLogFileTransport];
};

const fileTransports = enableFileLogs ? buildFileTransports() : [];

if (!enableFileLogs && isDocker) {
  console.info(
    'Docker: logging to console only. Set LOG_TO_FILE=true to write logs under config/logs.'
  );
}

const consoleFormats: winston.Logform.Format[] = [
  winston.format.splat(),
  winston.format.timestamp(),
  hformat,
];

// Colorize breaks on non-TTY Docker logs and can cause stream fd errors.
if (process.stdout.isTTY && !isDocker) {
  consoleFormats.unshift(winston.format.colorize());
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL?.toLowerCase() || 'debug',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp(),
    hformat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(...consoleFormats),
    }),
    ...fileTransports,
  ],
});

logger.on('error', (err) => {
  console.error('Logger error:', err.message);
});

export default logger;
