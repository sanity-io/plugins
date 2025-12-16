import {SearchIcon, SpinnerIcon} from '@sanity/icons'
import {TextInput} from '@sanity/ui'
import {startTransition, useOptimistic} from 'react'
import {styled, keyframes} from 'styled-components'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

const StyledTextInput = styled(TextInput)`
  position: sticky;
  top: 0;
  z-index: 1;
`
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
    <StyledTextInput
      clearButton={inputValue.length > 0 && !isPending}
      icon={SearchIcon}
      onChange={(event) => handleChange(event.currentTarget.value)}
      onClear={() => handleChange('')}
      placeholder="Search by topics or colors"
      value={inputValue}
      iconRight={isPending && AnimatedSpinnerIcon}
    />
  )
}

export const Scroller = styled.div`
  overflow-y: auto;
  max-height: 80vh;
`
