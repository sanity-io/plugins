import {AddIcon, ChevronDownIcon, CloseIcon} from '@sanity/icons'
import {Box, Card, Flex, rem, Text} from '@sanity/ui'
import {buildTheme, type ThemeColorSchemeKey} from '@sanity/ui/theme'
import {components, type StylesConfig} from 'react-select'
import {Virtuoso} from 'react-virtuoso'

import {getSchemeColor} from '../../utils/getSchemeColor'

const defaultTheme = buildTheme()
const {radius: themeRadius, space: themeSpace} = defaultTheme.v2!

export const reactSelectStyles = (scheme: ThemeColorSchemeKey): StylesConfig => {
  return {
    control: (styles, {isFocused}) => {
      let boxShadow = `inset 0 0 0 1px var(--card-border-color)`
      if (isFocused) {
        boxShadow = `inset 0 0 0 1px ${getSchemeColor(scheme, 'inputEnabledBorder')},
        0 0 0 1px var(--card-bg-color),
        0 0 0 3px var(--card-focus-ring-color) !important`
      }

      return {
        ...styles,
        'backgroundColor': 'var(--card-bg-color)',
        'color': 'inherit',
        'border': 'none',
        'borderRadius': themeRadius[1] ?? 0,
        boxShadow,
        'margin': 0,
        'minHeight': '35px',
        'outline': 'none',
        'padding': rem(themeSpace[1] ?? 0),
        'transition': 'none',
        '&:hover': {
          boxShadow: `inset 0 0 0 1px ${getSchemeColor(scheme, 'inputHoveredBorder')}`,
        },
      }
    },
    indicatorsContainer: (styles, {isDisabled}) => ({
      ...styles,
      opacity: isDisabled ? 0.25 : 1,
    }),
    input: (styles) => ({
      ...styles,
      color: 'var(--card-fg-color)',
      fontFamily: defaultTheme.v2!.font.text.family,
      marginLeft: rem(themeSpace[2] ?? 0),
    }),
    menuList: (styles) => ({
      ...styles,
    }),
    multiValue: (styles, {isDisabled}) => ({
      ...styles,
      backgroundColor: getSchemeColor(scheme, 'mutedHoveredBg'),
      borderRadius: themeRadius[2] ?? 0,
      opacity: isDisabled ? 0.5 : 1,
    }),
    multiValueLabel: () => ({
      color: getSchemeColor(scheme, 'mutedHoveredFg'),
      fontSize: 'inherit',
      padding: 0,
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      'borderTopLeftRadius': 0,
      'borderBottomLeftRadius': 0,
      'svg': {color: getSchemeColor(scheme, 'mutedHoveredFg')},
      '&:hover': {
        backgroundColor: getSchemeColor(scheme, 'mutedSelectedBg'),
      },
    }),
    noOptionsMessage: (styles) => ({
      ...styles,
      fontFamily: defaultTheme.v2!.font.text.family,
      lineHeight: '1em',
    }),
    option: (styles, {isFocused}) => ({
      ...styles,
      'backgroundColor': isFocused ? getSchemeColor(scheme, 'spotBlue') : 'transparent',
      'borderRadius': themeRadius[2] ?? 0,
      'color': isFocused ? getSchemeColor(scheme, 'bg') : 'inherit',
      'padding': `${rem(themeSpace[1] ?? 0)} ${rem(themeSpace[2] ?? 0)}`,
      '&:hover': {
        backgroundColor: getSchemeColor(scheme, 'spotBlue'),
        color: getSchemeColor(scheme, 'bg'),
      },
    }),
    placeholder: (styles) => ({
      ...styles,
      marginLeft: rem(themeSpace[2] ?? 0),
    }),
    valueContainer: (styles) => ({
      ...styles,
      margin: 0,
      padding: 0,
    }),
  }
}

const DropdownIndicator = (props: any) => {
  return (
    <components.DropdownIndicator {...props}>
      <Box paddingX={2}>
        <Text size={1}>
          <ChevronDownIcon />
        </Text>
      </Box>
    </components.DropdownIndicator>
  )
}

const Menu = (props: any) => {
  return (
    <components.Menu {...props}>
      <Card radius={1} shadow={2}>
        {props.children}
      </Card>
    </components.Menu>
  )
}

const MenuList = (props: any) => {
  const {children} = props

  const MAX_ROWS = 5
  const OPTION_HEIGHT = 37

  if (Array.isArray(children)) {
    const height =
      children.length > MAX_ROWS ? OPTION_HEIGHT * MAX_ROWS : children.length * OPTION_HEIGHT

    return (
      <Virtuoso
        className="media__custom-scrollbar"
        itemContent={(index) => {
          const item = children[index]
          return <Option {...item.props} />
        }}
        style={{height}}
        totalCount={children.length}
      />
    )
  }
  return <components.MenuList {...props}>{children}</components.MenuList>
}

const MultiValueLabel = (props: any) => {
  return (
    <Box padding={2} paddingRight={1}>
      <Text size={1} weight="medium">
        <components.MultiValueLabel {...props} />
      </Text>
    </Box>
  )
}

const MultiValueRemove = (props: any) => {
  return (
    <components.MultiValueRemove {...props}>
      <CloseIcon color="#1f2123" />
    </components.MultiValueRemove>
  )
}

const Option = (props: any) => {
  return (
    <Box paddingX={1} paddingY={1}>
      <components.Option {...props}>
        <Flex align="center">
          {props.data.__isNew__ && <AddIcon style={{marginRight: '3px'}} />}
          {props.children}
        </Flex>
      </components.Option>
    </Box>
  )
}

export const reactSelectComponents = {
  DropdownIndicator,
  IndicatorSeparator: null,
  Menu,
  MenuList,
  MultiValueLabel,
  MultiValueRemove,
  Option,
}
