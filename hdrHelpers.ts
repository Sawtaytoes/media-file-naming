export const formatHdrName = (
  hdrFormat: string
) => {
  if (
    hdrFormat
    .includes(
      'Dolby Vision'
    )
  ) {
    return 'DoVi'
  }

  if (
    hdrFormat
    .includes(
      'HDR10+'
    )
  ) {
    return 'HDR10+'
  }

  if (
    hdrFormat
    .includes(
      'HDR10 Compatible'
    )
  ) {
    return 'HDR10'
  }

  return ''
}

export const replaceHdrFormat = ({
  colorSpace,
  filename,
  hdrFormat,
}: {
  colorSpace: string,
  filename: string,
  hdrFormat: string,
}) => {
  if (hdrFormat) {
    filename
    .replace(
      /(.+)({\w+).+( & .+})/,
      '$1$2'
      .concat(
        " ",
        (
          formatHdrName(
            hdrFormat
          )
        ),
        '$3',
      )
    )
  }

  return filename
}
