import createHandler from '../shared/create-handler'

interface MailchimpList {
  id: string
  [key: string]: unknown
}

interface MailchimpSignupForm {
  signup_form_url: string
  [key: string]: unknown
}

// Fetch from Mailchimp's API
export async function fetchMailchimpData({
  key,
  server,
}: {
  key: string
  server: string
}): Promise<unknown> {
  async function getJson(path: string): Promise<Record<string, unknown>> {
    const response = await fetch(`https://${server}.api.mailchimp.com/3.0${path}`, {
      headers: {Authorization: `Basic ${btoa(`anystring:${key}`)}`},
    })
    const body: Record<string, unknown> = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = typeof body['detail'] === 'string' ? `: ${body['detail']}` : ''
      throw new Error(`Mailchimp request to ${path} failed with status ${response.status}${detail}`)
    }
    return body
  }

  const {lists} = await getJson('/lists')
  if (!Array.isArray(lists)) {
    throw new Error('Failed to fetch Mailchimp lists')
  }
  const signupFormsPerList = await Promise.all(
    lists.map(async (list: MailchimpList) => {
      const {signup_forms: signupForms} = await getJson(
        `/lists/${encodeURIComponent(list.id)}/signup-forms`,
      )
      return (Array.isArray(signupForms) ? signupForms : []).map((form: MailchimpSignupForm) => ({
        list,
        form,
        value: form.signup_form_url,
      }))
    }),
  )
  return signupFormsPerList.flat()
}

// Create the Mailchimp handler for a specific key and server
export const mailchimpHandler = (keys: {key: string; server: string}) => {
  return createHandler(() => fetchMailchimpData(keys))
}
