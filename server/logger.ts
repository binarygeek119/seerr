/* eslint-disable no-console */
import { existsSync } from 'fs';
import path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const configDirectory = process.env.CONFIG_DIRECTORY
  ? process.env.CONFIG_DIRECTORY
  : path.join(__dirname, '../config');

const isDocker = existsSync(path.join(configDirectory, 'DOCKER'));

// In Docker, log to stdout by default (avoids EMFILE from rotate + symlinks on low ulimit).
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

type DailyRotateFileTransport = InstanceType<
  typeof winston.transports.DailyRotateFile
>;

const bindLogTransportGuards = (
  transport: DailyRotateFileTransport,
  name: string
) => {
  transport.on('error', (err: Error) => {
    console.error(`Error in ${name} transport:`, err);
  });

  transport.on('open', () => {
    const stream = (
      transport as DailyRotateFileTransport & {
        _stream?: NodeJS.WritableStream;
      }
    )._stream;

    stream?.on?.('error', (err: Error) => {
      console.error(`Error in ${name} stream:`, err.message);
    });
  });
};

const logsDirectory = path.join(configDirectory, 'logs');

const fileTransports: winston.transport[] = [];

if (enableFileLogs) {
  const seerrFileTransport = new winston.transports.DailyRotateFile({
    filename: path.join(logsDirectory, 'seerr-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d',
    createSymlink: !isDocker,
    symlinkName: 'seerr.log',
  });

  const machineLogFileTransport = new winston.transports.DailyRotateFile({
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

  fileTransports.push(seerrFileTransport, machineLogFileTransport);
} else if (isDocker) {
  console.info(
    'Docker: logging to console only. Set LOG_TO_FILE=true to write logs under config/logs.'
  );
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
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.splat(),
        winston.format.timestamp(),
        hformat
      ),
    }),
    ...fileTransports,
  ],
});

logger.on('error', (err) => {
  console.error('Logger error:', err);
});

export default logger;
