import groq from 'groq'

export const internationalizedPostQuery = groq`*[_type == "internationalizedPost"] {
  "title": title[_key == "en"][0].value,
  "description": description[_key == "en"][0].value,
  "slug": slug.current
}`

export const internationalizedPostQueryLanguage = groq`*[_type == "internationalizedPost"] {
    "title": title[_key == $language][0].value,
    "description": description[_key == $language][0].value,
    "slug": slug.current
  }`
