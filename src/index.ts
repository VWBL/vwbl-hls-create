import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as util from "util";
import {Readable} from "stream";

export const makeEncryptedHls = (
  input: string | Readable,
  key: string,
  duration?: number,
  iv?: string,
  outFileName?: string,
  ffmpegOptions?: string[],
  callback?: (err?: Error) => void
) => {
  const command = ffmpeg(input);
  console.log("make hls start");
  command
    .addOption([
      `-hls_enc 1`, // 1 = enable enc
      `-hls_enc_key ${key}`,
      `-hls_enc_iv ${iv || "0".repeat(32)}`,
      `-profile:v baseline`,
      `-level 3.0`,
      `-start_number 0`,
      `-hls_time ${duration || 4}`,
      `-hls_list_size 0`,
      `-f hls`,
    ])
    .addOption(ffmpegOptions || [])
    .output(outFileName || "output.m3u8")
    .on("end", (stdout) => {
      console.log(stdout);
      console.log("make hls end");
      fs.unlinkSync(`${outFileName || "output.m3u8"}.key`);
      callback?.();
    })
    .run();
};

export const asyncMakeEncryptedHls = util.promisify(makeEncryptedHls);

export const calcSplitNumber = async (path: string, duration: number): Promise<number> => {
  const promise = util.promisify(ffmpeg.ffprobe);
  const metadata = (await promise(path)) as any;
  return Math.ceil(metadata.format.duration / duration);
};

export const calcDuration = async (path: string, splitNumber: number): Promise<number> => {
  const promise = util.promisify(ffmpeg.ffprobe);
  const metadata = (await promise(path)) as any;
  return Math.ceil(metadata.format.duration / splitNumber);
};
