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
  toArray,
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
  'Format_Settings_Mode': string,
  'Format': string,
  'Format/Info': string,
  'HDR_Format_Compatibility'?: string,
  'HDR_Format'?: string,
  'Height': string,
  'Title': string,
  'transfer_characteristics'?: string,
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
  displayAspectRatio: string,
  filename: string,
  format: string,
  formatAdditionalFeatures: string,
  formatCommercial: string,
  formatCommercialIfAny: string,
  formatInfo: string,
  formatSettingsMode: string,
  hdrFormat?: string,
  hdrFormatCompatibility?: string,
  height: string,
  title: string,
  transferCharacteristics?: string,
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
    // -------------------------------------
    // UNCOMMENT THIS TIME TO TEST A SINGLE FILE
    // && filename.startsWith('[LG]')
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
    from(
      stat(
        filename
      )
    )
    .pipe(
      filter((
        stats
      ) => (
        stats
        .isFile()
      )),
      map(() => (
        filename
      )),
    )
  )),
  map((
    filename,
  ) => (
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
    from(
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
    )
    .pipe(
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
        'DisplayAspectRatio': displayAspectRatio,
        'Format': format,
        'Format_AdditionalFeatures': formatAdditionalFeatures,
        'Format_Commercial_IfAny': formatCommercialIfAny,
        'Format_Commercial': formatCommercial,
        'Format_Settings_Mode': formatSettingsMode,
        'Format/Info': formatInfo,
        'HDR_Format_Compatibility': hdrFormatCompatibility,
        'HDR_Format': hdrFormat,
        'Height': height,
        'Title': title,
        'transfer_characteristics': transferCharacteristics,
        'Width': width,
        filename,
      }) => ({
        bitDepth,
        channelLayout,
        channelLayoutOriginal,
        channelPositions,
        channels,
        displayAspectRatio,
        filename,
        format,
        formatAdditionalFeatures,
        formatCommercial,
        formatCommercialIfAny,
        formatInfo,
        formatSettingsMode,
        hdrFormatCompatibility,
        hdrFormat,
        height,
        title,
        transferCharacteristics,
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
              filter(({
                filename,
              }) => (
                !filename.includes('Auro-3D')
                && !(
                  filename.includes('Trinnov')
                  && filename.includes('DTS-X')
                )
              )),
              map(({
                channelLayout,
                channelLayoutOriginal,
                format,
                formatAdditionalFeatures,
                formatCommercial,
                formatCommercialIfAny,
                formatSettingsMode,
              }) => (
                (
                  filename: string,
                ) => (
                  replaceAudioFormatByChannelCount({
                    channelLayout: (
                      channelLayoutOriginal
                      || channelLayout
                    ),
                    filename,
                    formatAdditionalFeatures,
                    formatCommercial: (
                      formatCommercialIfAny
                      || formatCommercial
                      || format
                    ),
                    formatSettingsMode,
                  })
                )
              )),
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
                hdrFormatCompatibility,
                hdrFormat,
                height,
                transferCharacteristics,
                width,
              }) => (
                (
                  filename: string,
                ) => (
                  replaceResolutionName({
                    filename: (
                      replaceHdrFormat({
                        filename,
                        hdrFormatCompatibility,
                        hdrFormat,
                        transferCharacteristics,
                      })
                    ),
                    height,
                    width,
                  })
                )
              )),
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
      toArray(),
      map((
        renamingFunctions
      ) => ({
        nextFilename: (
          renamingFunctions
          .reduce(
            (
              filename,
              renamingFunction
            ) => (
              renamingFunction(
                filename
              )
            ),
            (
              media
              ['@ref']
            ),
          )
        ),
        previousFilename: (
          media
          ['@ref']
        ),
      })),
    )
  )),
  mergeAll(),
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
  ignoreElements(),
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
