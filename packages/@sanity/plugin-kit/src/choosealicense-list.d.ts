declare module '@rexxars/choosealicense-list' {
  /** Single project → license file URL mapping from choosealicense.com metadata. */
  type ChooseALicenseUsingEntry = Record<string, string>

  interface ChooseALicense {
    'title': string
    'id': string
    'description': string
    'using': ChooseALicenseUsingEntry[]
    'permissions': string[]
    'conditions': string[]
    'limitations': string[]
    'featured': boolean
    'hidden': boolean
    'nickname': string | null
    'note': string
    'redirect_from': string
    'urls': {
      github: string
      choosealicense: string
      opensource: string
    }
    'spdx-id': string
    'how': string
    'body': string
  }

  type ChooseALicenseRecord = Record<string, ChooseALicense>

  interface ChooseALicenseDataField {
    name: string
    description: string
  }

  interface ChooseALicenseMetaField extends ChooseALicenseDataField {
    required?: boolean
  }

  interface ChooseALicenseRule {
    description: string
    label: string
    tag: string
  }

  interface ChooseALicenseData {
    fields: ChooseALicenseDataField[]
    meta: ChooseALicenseMetaField[]
    rules: {
      permissions: ChooseALicenseRule[]
      conditions: ChooseALicenseRule[]
      limitations: ChooseALicenseRule[]
    }
  }

  interface ChooseALicenseList extends ChooseALicenseRecord {
    license: ChooseALicenseRecord
    list: ChooseALicenseRecord
    find: (id: string) => ChooseALicense | false
    data: ChooseALicenseData
  }

  const licenses: ChooseALicenseList

  export default licenses
}
