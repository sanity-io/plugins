import {icons, Icon, type IconSymbol} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {useCallback, useId, useMemo} from 'react'
import {set, type StringInputProps} from 'sanity'

export function IconInput(props: StringInputProps) {
  const {value, onChange} = props
  const id = useId()
  const items = useMemo(
    () =>
      Object.keys(icons)
        .filter(isIconSymbol)
        .map((key) => <IconItem key={key} iconKey={key} onChange={onChange} />),
    [onChange],
  )

  const selectedSymbol = useMemo(() => getIcon(value), [value])

  return (
    <MenuButton
      button={
        <Button
          icon={<Icon symbol={selectedSymbol} />}
          title="Select icon"
          padding={3}
          mode="ghost"
          radius={1}
        />
      }
      id={id}
      menu={<Menu style={{maxHeight: 300}}>{items}</Menu>}
      popover={{portal: true}}
    />
  )
}

function IconItem({
  iconKey: key,
  onChange,
}: {
  iconKey: IconSymbol
  onChange: StringInputProps['onChange']
}) {
  const onClick = useCallback(() => onChange(set(key)), [onChange, key])
  // `Icon` wraps the lazy-loaded icon in its own `Suspense` boundary. Rendering the raw
  // lazy component from `icons` would suspend the whole menu (there is no boundary between
  // it and the popover), which unmounts the menu and closes it before it can be seen.
  return <MenuItem icon={<Icon symbol={key} />} title={key} text={key} onClick={onClick} />
}

export function getIcon(iconName?: string): IconSymbol {
  return iconName && isIconSymbol(iconName) ? iconName : 'sparkles'
}

function isIconSymbol(iconName: string): iconName is IconSymbol {
  return iconName in icons
}
