export const formatResolutionName = ({
  height,
  width,
}: {
  height: string,
  width: string,
}) => {
  if (
    Number(width) >= 3840
    && Number(width) <= 4000
  ) {
    if (
      Number(height) >= 1500
      && Number(height) <= 1700
    ) {
      return 'WQHD+'
    }

    if (
      Number(height) >= 1700
      && Number(height) <= 2060
    ) {
      return 'H4K'
    }

    if (
      Number(height) >= 2060
      && Number(height) <= 2160
    ) {
      return '4K'
    }

    console.log({height, width, dar: Number(width)/Number(height)})
  }

  if (
    width === '1920'
  ) {
    if (
      Number(height) >= 780
      && Number(height) <= 939
    ) {
      return 'UWXGA'
    }

    if (
      Number(height) >= 940
      && Number(height) <= 1050
    ) {
      return 'UWHD'
    }

    if (
      Number(height) >= 1050
      && Number(height) <= 1100
    ) {
      return 'FHD'
    }

    console.log({height, width, dar: Number(width)/Number(height)})
  }

  if (
    width === '1280'
  ) {
    if (height === '720') {
      return 'HD'
    }

    console.log({height, width, dar: Number(width)/Number(height)})
  }

  if (
    Number(height) >= 1438
    && Number(height) <= 1440
  ) {
    return 'QHD'
  }

  if (
    height === '480'
  ) {
    return 'WVGA'
  }

  if (
    height === '576'
  ) {
    return 'D-1'
  }

  return width.concat('x', height)
}

export const replaceResolutionName = ({
  filename,
  height,
  width,
}: {
  filename: string,
  height: string,
  width: string,
}) => (
  filename
  .replace(
    /(.+){(IMAX )?.+ (.+)( & .+})/,
    '$1'
    .concat(
      "{$2",
      (
        formatResolutionName({
          height,
          width,
        })
      ),
      ' $3$4',
    )
  )
)
