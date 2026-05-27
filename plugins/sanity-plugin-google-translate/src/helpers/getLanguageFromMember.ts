import {InputProps, ObjectMember} from 'sanity'

export function getLanguageFromMember(member: InputProps | ObjectMember): string {
  // Member is undefined
  if (!member) {
    return ``
  }

  // Member is an object field member
  if ('kind' in member && member.kind === 'field') {
    return member.key.split(`-`).pop() ?? ``
  } else if ('kind' in member) {
    return ``
  }

  // Member is an inputProps
  return member?.elementProps?.id.split(`.`).pop() ?? ``
}
