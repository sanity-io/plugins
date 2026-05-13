import {colorInput} from '@sanity/color-input'
import {DropIcon} from '@sanity/icons'
import {definePlugin, defineType} from 'sanity'

const colorTest = defineType({
  name: 'colorTest',
  type: 'document',
  title: 'Color',
  icon: DropIcon,
  preview: {
    select: {
      title: 'title',
      color: 'testColor1',
    },

    prepare({title, color}) {
      let subtitle = (color && color.hex) || 'No color set'
      if (color && color.hsl) {
        subtitle = `${color.hex}`
      }
      return {
        title: title,
        subtitle: subtitle,
        description:
          color &&
          color.hsl &&
          `H:${Math.round(color.hsl.h)} S:${Math.round(color.hsl.s * 100)} L:${Math.round(
            color.hsl.l * 100,
          )} A:${Math.round(color.hsl.a * 100)}`,
        media: () => (
          <div
            style={{
              backgroundColor: (color && color.hex) || '#000',
              opacity: (color && color.alpha) || 1,
              position: 'absolute',
              height: '100%',
              width: '100%',
              top: '0',
              left: '0',
            }}
          />
        ),
      }
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'testColor1',
      title: 'Color to be used in preview',
      description: 'A color input',
      type: 'color',
    },
    {
      name: 'testColor2',
      title: 'Color with no alpha',
      description: 'A color input with no alpha',
      type: 'color',
      options: {
        disableAlpha: true,
      },
    },
    {
      name: 'testColor3',
      title: 'Color with presets',
      description: 'A color input with a list of preset colors',
      type: 'color',
      options: {
        colorList: [
          '#FF6900',
          {hex: '#FCB900'},
          {r: 123, g: 220, b: 181},
          {r: 0, g: 208, b: 132, a: 0.5},
          {h: 203, s: 95, l: 77, a: 1},
          {h: 202, s: 95, l: 46, a: 0.5},
          {h: 345, s: 43, v: 97},
          {h: 344, s: 91, v: 92, a: 0.5},
        ],
      },
    },
    {
      // Reproduction for sanity-io/plugins#881.
      // User's initialValue: only `_type`, `hex`, `alpha`. Picker renders empty
      // because ColorPickerInner returns null when `hsl` or `hsv` is missing.
      name: 'issue881UsersInitialValue',
      title: 'Issue #881 — user’s initialValue (partial)',
      description:
        "User's setup from issue #881: only _type, hex, alpha. Expect: picker renders empty.",
      type: 'color',
      initialValue: {_type: 'color', hex: '#f5f1e6', alpha: 1},
    },
    {
      // Same hex as above, but with the full color shape including hsl/hsv/rgb
      // sub-objects. Expect: picker renders with the color preselected.
      name: 'issue881SuggestedInitialValue',
      title: 'Issue #881 — suggested initialValue (complete)',
      description:
        'Same hex (#f5f1e6) with full color shape (hsl/hsv/rgb). Expect: picker renders normally.',
      type: 'color',
      initialValue: {
        _type: 'color',
        hex: '#f5f1e6',
        alpha: 1,
        hsl: {_type: 'hslaColor', h: 44, s: 0.4286, l: 0.9314, a: 1},
        hsv: {_type: 'hsvaColor', h: 44, s: 0.0612, v: 0.9608, a: 1},
        rgb: {_type: 'rgbaColor', r: 245, g: 241, b: 230, a: 1},
      },
    },
    {
      name: 'colorList',
      title: 'List of colors',
      description: 'An array of colors with the built in color preview',
      type: 'array',
      of: [
        {
          type: 'color',
        },
      ],
    },
    {
      name: 'readOnlyColor',
      title: 'Read-only color',
      description: 'Color input in readOnly mode',
      readOnly: true,
      type: 'color',
    },
    {
      name: 'colorGrid',
      title: 'Grid of colors',
      description: 'An grid of colors with the built in color preview',
      type: 'array',
      options: {
        layout: 'grid',
      },
      of: [
        {
          type: 'color',
        },
      ],
    },
    {
      name: 'objectWithObjectWithColors',
      title: 'Object with object with colors',
      type: 'object',
      fields: [
        {
          name: 'objectWithColors',
          title: 'Object with colors',
          type: 'object',
          fields: [
            {name: 'primaryColor', title: 'Primary color', type: 'color'},
            {name: 'secondaryColor', title: 'Secondary color', type: 'color'},
            {name: 'extraColor', title: 'Extra color', type: 'color'},
          ],
        },
      ],
    },
  ],
})

export const colorExample = definePlugin(() => ({
  schema: {types: [colorTest]},
  plugins: [colorInput()],
}))
