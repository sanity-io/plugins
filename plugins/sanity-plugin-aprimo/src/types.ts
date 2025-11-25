export interface AprimoCDNAsset {
  id: string
  title: string
  rendition: {
    id: string
    publicuri: string
  }
  _key?: string
}

export interface AprimoAdditionalFile {
  additionalFileId: string
  fileName: string
  label: string
  type: string
}

export interface AprimoAsset {
  id: string
  title: string
  additionalFile?: AprimoAdditionalFile
  _key?: string
}

export interface AprimoConfig {
  tenantName: string
}
