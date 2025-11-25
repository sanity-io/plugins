export const openSelector = (tenantName: string, selectType: string): void => {
  let assetType = 'asset rendition'
  switch (selectType) {
    case 'singlefile':
      assetType = 'asset file'
      break
    case 'multiple':
      assetType = 'asset renditions'
      break
    default:
      assetType = 'asset rendition'
  }

  const selectorOptions = {
    title: `Select ${assetType}`,
    description: `Select the ${assetType} you'd like to bring into this document`,
    accept: `Use ${assetType}`,
    select: selectType,
  }

  const params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,
  width=1000,height=600,left=100,top=100`

  const encodedOptions = btoa(JSON.stringify(selectorOptions))
  window.open(
    `https://${tenantName}.dam.aprimo.com/dam/selectcontent#options=${encodedOptions}`,
    'selector',
    params,
  )
}
