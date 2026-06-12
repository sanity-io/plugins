import mailchimp from '@mailchimp/mailchimp_marketing'

import createHandler from '../shared/create-handler'

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
  mailchimp.setConfig({
    apiKey: key,
    server: server,
  })
  const response = await mailchimp.lists.getAllLists()
  if (!('lists' in response)) {
    throw new Error('Failed to fetch Mailchimp lists')
  }
  const signupFormsPerList = await Promise.all(
    response.lists.map(async (list) => {
      const {signup_forms: signupForms}: {signup_forms: MailchimpSignupForm[]} =
        // @ts-expect-error getListSignupForms is missing from the mailchimp typings
        await mailchimp.lists.getListSignupForms(list.id)
      return signupForms.map((form) => ({
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
