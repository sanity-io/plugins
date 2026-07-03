import {icons, Icon, type IconSymbol} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {type ElementType, type ReactNode, useCallback, useId, useMemo} from 'react'
import {set, type StringInputProps} from 'sanity'

export function IconInput(props: StringInputProps) {
  const {value, onChange} = props
  const id = useId()
  const items = useMemo(
    () =>
      Object.entries(icons).map(([key, icon]) => (
        <IconItem key={key} iconKey={key} icon={icon} onChange={onChange} />
      )),
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
  icon,
  iconKey: key,
  onChange,
}: {
  iconKey: string
  // oxlint-disable-next-line no-redundant-type-constituents
  icon: ElementType | ReactNode
  onChange: StringInputProps['onChange']
}) {
  const onClick = useCallback(() => onChange(set(key)), [onChange, key])
  return <MenuItem icon={icon} title={key} text={key} onClick={onClick} />
}

export function getIcon(iconName?: string): IconSymbol {
  return iconName && isIconSymbol(iconName) ? iconName : 'sparkles'
}

function isIconSymbol(iconName: string): iconName is IconSymbol {
  return iconName in icons
}
