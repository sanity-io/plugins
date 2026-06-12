import mailchimp from '@mailchimp/mailchimp_marketing'

import createHandler from '../shared/create-handler'

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
  const signupForms = []
  // @ts-expect-error bad typing for mailchimp
  const {lists} = await mailchimp.lists.getAllLists()
  for (const list of lists) {
    // @ts-expect-error bad typing for mailchimp
    // eslint-disable-next-line camelcase
    const {signup_forms} = await mailchimp.lists.getListSignupForms(list.id)
    // eslint-disable-next-line camelcase
    for (const form of signup_forms) {
      signupForms.push({
        list,
        form,
        value: form.signup_form_url,
      })
    }
  }
  return signupForms
}

// Create the Mailchimp handler for a specific key and server
export const mailchimpHandler = (keys: {key: string; server: string}) => {
  return createHandler(() => fetchMailchimpData(keys))
}
