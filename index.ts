import {
  execFile as execFileCallback,
} from 'node:child_process';
import {
  readdir,
  rename,
  stat,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  promisify,
} from 'node:util'
import {
  catchError,
  combineLatest,
  EMPTY,
  filter,
  from,
  groupBy,
  ignoreElements,
  map,
  merge,
  mergeAll,
  mergeMap,
  of,
  take,
  tap,
} from 'rxjs'

import {
  replaceAudioFormatByChannelCount,
} from './audioHelpers'
import {
  replaceHdrFormat,
} from './hdrHelpers'
import {
  replaceResolutionName,
} from './resolutionHelpers'

process.on('uncaughtException', (exception) => {
  console.error(exception)
})

const execFile = (
  promisify(
    execFileCallback
  )
)

type Track = {
  '@type': string,
  '@typeorder': string,
  'BitDepth': string,
  'ChannelLayout_Original': string,
  'ChannelLayout': string,
  'ChannelPositions': string,
  'Channels': string,
  'colour_primaries': string,
  'DisplayAspectRatio': string,
  'extra': (
    Record<
      string,
      string
    >
  ),
  'Format_AdditionalFeatures': string,
  'Format_Commercial_IfAny': string,
  'Format_Commercial': string,
  'Format': string,
  'Format_Settings_Mode': string,
  'Format/Info': string,
  'HDR_Format/String': string,
  'Height': string,
  'Title': string,
  'Width': string,
}

export type MediaInfo = {
  media: {
    '@ref': string,
    track: Track[],
  },
}

export type FormattedTrack = {
  bitDepth: string,
  channelLayout: string,
  channelLayoutOriginal: string,
  channels: string,
  channelPositions: string,
  colorSpace: string,
  displayAspectRatio: string,
  filename: string,
  format: string,
  formatAdditionalFeatures: string,
  formatCommercial: string,
  formatCommercialIfAny: string,
  formatInfo: string,
  formatSettingsMode: string,
  hdrFormat: string,
  height: string,
  title: string,
  type: string,
  typeOrder: string,
  width: string,
}

// -----------------------------------------------------

const parentDirectory = process.argv[2]

if (!parentDirectory) {
  throw new Error('You need to enter a parent directory.')
}

from(
  readdir(
    parentDirectory
  )
)
.pipe(
  mergeAll(),
  filter((
    filename,
  ) => (
    filename !== "[CableLabs] Life Untouched {4K HDR10 & Mono}.mkv"
    && !filename.includes('Auro-3D')
    && !filename.includes('Trinnov')

    // -------------------------------------
    // UNCOMMENT THIS TIME TO TEST A SINGLE FILE
    // && filename.includes(' {IMAX')
    // -------------------------------------
  )),
  map((
    filename,
  ) => (
    parentDirectory
    .concat(
      path.sep,
      filename,
    )
  )),
  // take(12),
  mergeMap((
    filename,
  ) => (
    combineLatest([
      (
        of(
          filename
        )
      ),
      (
        from(
          stat(
            filename
          )
        )
        .pipe(
          map((
            stats,
          ) => ({
            isFile: stats.isFile(),
          })),
        )
      ),
    ])
  )),
  map(([
    filename,
    fileStats,
  ]) => ({
    ...fileStats,
    filename,
  })),
  filter(({
    isFile,
  }) => (
    isFile
  )),
  map(({
    filename,
  }) => (
    execFile(
      'MediaInfo_CLI_23.04_Windows_x64/MediaInfo.exe',
      [
        '--Output=JSON',
        filename,
      ],
    )
  )),
  mergeAll(
    os
    .cpus()
    .length
  ),
  map(({
    stderr,
    stdout,
  }) => {
    if (stderr) {
      throw new Error(stderr)
    }

    return stdout
  }),
  map((
    mediaInfoJsonString,
  ) => (
    JSON
    .parse(
      mediaInfoJsonString
    )
  )),
  // -------------------------------------
  // UNCOMMENT THIS TO VIEW A SINGLE TRACK
  // -------------------------------------
  // tap(({
  //   media
  // }) => {
  //   console.log(media.track[1])
  // }),
  // -------------------------------------
  map(({
    media,
  }: (
    MediaInfo
  )) => (
    media
    .track
    .map((
      track,
    ) => ({
      ...track,
      filename: (
        media
        ['@ref']
      ),
    }))
  )),
  mergeAll(),
  map<
    (
      Track
      & {
        filename: string,
      }
    ),
    FormattedTrack
  >(({
    '@type': type,
    '@typeorder': typeOrder,
    'BitDepth': bitDepth,
    'ChannelLayout_Original': channelLayoutOriginal,
    'ChannelLayout': channelLayout,
    'ChannelPositions': channelPositions,
    'Channels': channels,
    'colour_primaries': colorSpace,
    'DisplayAspectRatio': displayAspectRatio,
    'Format': format,
    'Format_AdditionalFeatures': formatAdditionalFeatures,
    'Format_Commercial_IfAny': formatCommercialIfAny,
    'Format_Commercial': formatCommercial,
    'Format_Settings_Mode': formatSettingsMode,
    'Format/Info': formatInfo,
    'HDR_Format/String': hdrFormat,
    'Height': height,
    'Title': title,
    'Width': width,
    filename,
  }) => ({
    bitDepth,
    channelLayout,
    channelLayoutOriginal,
    channelPositions,
    channels,
    colorSpace,
    displayAspectRatio,
    filename,
    format,
    formatAdditionalFeatures,
    formatCommercial,
    formatCommercialIfAny,
    formatInfo,
    formatSettingsMode,
    hdrFormat,
    height,
    title,
    type,
    typeOrder,
    width,
  })),
  filter<
    FormattedTrack
  >(({
    typeOrder,
  }) => (
    (
      typeOrder
      && typeOrder === '1'
    )
    || !typeOrder
  )),
  groupBy<
    FormattedTrack,
    string
  >(({
    type,
  }) => (
    type
  )),
  mergeMap((
    group$,
  ) => (
    merge(
      (
        group$
        .pipe(
          filter<
            FormattedTrack
          >(({
            type,
          }) => (
            type === 'Audio'
          )),
          map(({
            channelLayout,
            channelLayoutOriginal,
            channelPositions,
            channels,
            filename,
            format,
            formatAdditionalFeatures,
            formatCommercial,
            formatCommercialIfAny,
            formatInfo,
            formatSettingsMode,
            title,
            type,
          }) => ({
            channelLayout: (
              channelLayoutOriginal
              || channelLayout
            ),
            channelPositions,
            channels,
            formatAdditionalFeatures,
            formatCommercial: (
              formatCommercialIfAny
              || formatCommercial
              || format
            ),
            formatInfo,
            formatSettingsMode,
            filename,
            title,
            type,
          })),
          map(({
            channelLayout,
            filename,
            formatAdditionalFeatures,
            formatCommercial,
            formatSettingsMode,
          }) => ({
            nextFilename: (
              replaceAudioFormatByChannelCount({
                channelLayout,
                filename,
                formatAdditionalFeatures,
                formatCommercial,
                formatSettingsMode,
              })
            ),
            previousFilename: filename,
          })),
          catchError((
            error,
          ) => {
            console
            .error(
              error
            )

            return EMPTY
          }),
        )
      ),
      (
        group$
        .pipe(
          filter<
            FormattedTrack
          >(({
            type,
          }) => (
            type === 'Video'
          )),
          map(({
            bitDepth,
            colorSpace,
            filename,
            hdrFormat,
            height,
            title,
            type,
            width,
          }) => ({
            bitDepth,
            colorSpace,
            height,
            hdrFormat,
            filename,
            title,
            type,
            width,
          })),
          map(({
            colorSpace,
            filename,
            hdrFormat,
            height,
            width,
          }) => ({
            nextFilename: (
              replaceResolutionName({
                filename: (
                  replaceHdrFormat({
                    colorSpace,
                    filename,
                    hdrFormat,
                  })
                ),
                height,
                width,
              })
            ),
            previousFilename: filename,
          })),
          catchError((
            error,
          ) => {
            console
            .error(
              error
            )

            return EMPTY
          }),
        )
      ),
    )
  )),
  filter(({
    nextFilename,
    previousFilename,
  }) => (
    nextFilename
    !== previousFilename
  )),
  tap(({
    nextFilename,
    previousFilename,
  }) => {
    console.log(previousFilename)
    console.log(nextFilename)
    console.log()
  }),
  // -------------------------------------
  // UNCOMMENT THIS TO SAFELY DEBUG CHANGES
  // -------------------------------------
  // ignoreElements(),
  // -------------------------------------
  map(({
    nextFilename,
    previousFilename,
  }) => (
    rename(
      previousFilename,
      nextFilename,
    ))
  ),
  mergeAll(
    os
    .cpus()
    .length
  ),
  catchError((
    error,
  ) => {
    console
    .error(
      error
    )

    return EMPTY
  }),
)
.subscribe()
