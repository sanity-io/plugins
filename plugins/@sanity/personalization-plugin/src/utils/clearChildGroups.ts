import type {ObjectFieldProps} from 'sanity'

/**
 * Safely updates deeply nested children props to clear groups array
 * This prevents field grouping UI conflicts in personalization mode
 */
export const clearChildrenGroups = (props: ObjectFieldProps): ObjectFieldProps => {
  // Type assertion is needed here because Sanity's ObjectFieldProps children
  // typing doesn't account for the nested structure we need to manipulate
  const children = props.children as any

  if (!children || typeof children !== 'object' || !children.props) {
    return props
  }

  return {
    ...props,
    children: {
      ...children,
      props: {
        ...children.props,
        children: {
          ...children.props.children,
          props: {
            ...children.props.children?.props,
            groups: [],
          },
        },
      },
    },
  }
}
