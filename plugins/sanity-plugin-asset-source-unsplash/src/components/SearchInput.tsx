import {SearchIcon} from '@sanity/icons/Search'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {TextInput} from '@sanity/ui'
import {startTransition, useOptimistic, type ComponentProps} from 'react'

import * as styles from './SearchInput.module.css'

function AnimatedSpinnerIcon(props: ComponentProps<typeof SpinnerIcon>) {
  return <SpinnerIcon {...props} className={styles.animatedSpinnerIcon} />
}

export function SearchInput({
  value,
  changeAction,
}: {
  value: string
  changeAction: (value: string) => Promise<void> | void
}) {
  const [inputValue, setInputValue] = useOptimistic(value)
  const isPending = inputValue !== value
  function handleChange(newValue: string) {
    startTransition(async () => {
      setInputValue(newValue)
      await changeAction(newValue)
    })
  }

  return (
    <TextInput
      clearButton={inputValue.length > 0 && !isPending}
      icon={SearchIcon}
      onChange={(event) => handleChange(event.currentTarget.value)}
      onClear={() => handleChange('')}
      placeholder="Search by topics, colors, or image ID"
      value={inputValue}
      iconRight={isPending && AnimatedSpinnerIcon}
    />
  )
}
