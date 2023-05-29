export const formatHdrName = ({
  hdrFormatCompatibility,
  hdrFormat,
  hdrFormatString,
  transferCharacteristics,
}: {
  hdrFormatCompatibility: string,
  hdrFormat: string,
  hdrFormatString: string,
  transferCharacteristics: string,
}) => {
  if (
    transferCharacteristics
    === 'HLG'
  ) {
    return 'HLG'
  }

  return (
    [
      (
        (
          hdrFormat
          ?.includes(
            'Dolby Vision'
          )
        )
        && 'DoVi'
      ),
      (
        (
          (
            hdrFormat
            ?.includes(
              'SMPTE ST 2094'
            )
          )
          || (
            hdrFormatCompatibility
            ?.includes(
              'HDR10+'
            )
          )
        )
        && 'HDR10+'
      ),
      (
        (
          (
            hdrFormat
            ?.includes(
              'SMPTE ST 2086'
            )
          )
          || (
            hdrFormatCompatibility
            === 'HDR10'
          )
          || (
            hdrFormatCompatibility
            .endsWith('HDR10')
          )
        )
        && 'HDR10'
      ),
    ]
    .filter(Boolean)
    .join(' ')
  )
}

export const replaceHdrFormat = ({
  colorSpace,
  filename,
  hdrFormatCompatibility,
  hdrFormat,
  hdrFormatString,
  transferCharacteristics,
}: {
  colorSpace: string,
  filename: string,
  hdrFormatCompatibility: string,
  hdrFormat: string,
  hdrFormatString: string,
  transferCharacteristics: string,
}) => (
  filename
  .replace(
    /(.+)({\w+).+( & .+})/,
    '$1$2'
    .concat(
      " ",
      (
        formatHdrName({
          hdrFormatCompatibility,
          hdrFormat,
          hdrFormatString,
          transferCharacteristics,
        })
        || 'SDR'
      ),
      '$3',
    )
  )
)
