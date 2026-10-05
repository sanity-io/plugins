import {AddIcon} from '@sanity/icons/Add'
import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ImageIcon} from '@sanity/icons/Image'
import {RestoreIcon} from '@sanity/icons/Restore'
import {Button, Card, Flex, Stack} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {MotionConfig, Reorder} from 'motion/react'
import {useRef, useState} from 'react'

import type {ThemerProps} from '#types'

import {ImageFileInput} from './ImageFileButton'
import {optionsFromImagePalette, titleFromFileName} from './imagePalette'
import {PasteThemeDialog} from './PasteThemeDialog'
import {ScrollArea} from './ScrollArea'
import {ThemeCard} from './ThemeCard'
import {CONFIG_SLUG, CONFIG_TITLE} from './themes'
import {ThemeSnippetDialog} from './ThemeSnippetDialog'
import {useImagePalette} from './useImagePalette'
import {usePasteThemeCodes, useThemeCodes} from './useThemeCodes'

import {cardGrid} from './ThemeList.css'

/**
 * The flow for picking a theme: a grid of theme cards — the configured theme,
 * the presets and the user's own themes — that drag into the order the user
 * wants, with the entry point to the restore flow below. The footer takes the
 * applied theme on to the editor — a copy of it, for a preset or the
 * configured theme — and keeps the ways to add a theme and the applied
 * theme's code behind its menu. A theme code someone shared pastes right into
 * the list too.
 *
 * @internal
 */
export function ThemeList({
  actorRef,
  themes,
  removed,
  active,
}: Pick<ThemerProps, 'actorRef' | 'themes' | 'removed' | 'active'>) {
  const {addThemeFromClipboard} = useThemeCodes({actorRef})
  const [pasting, setPasting] = useState(false)
  const [snippetOpen, setSnippetOpen] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  usePasteThemeCodes({actorRef})

  const {busy, pickImage} = useImagePalette((palette, file) =>
    actorRef.send({
      type: 'theme.add',
      title: titleFromFileName(file.name),
      options: optionsFromImagePalette(palette),
      palette,
      imageUrl: URL.createObjectURL(file),
    }),
  )

  return (
    <>
      <ScrollArea padding={3}>
        <Stack gap={4}>
          {/* The group tells a column from a grid by measuring the cards, and
              lets go of the layout animations for users who prefer reduced motion */}
          <MotionConfig reducedMotion="user">
            <Reorder.Group
              as="div"
              className={cardGrid}
              onReorder={(order: string[]) => actorRef.send({type: 'theme.reorder', order})}
              values={themes.map((theme) => theme.slug)}
            >
              <ThemeCard
                actorRef={actorRef}
                active={!active}
                theme={{
                  slug: CONFIG_SLUG,
                  title: CONFIG_TITLE,
                  options: {},
                  source: 'config',
                }}
                themes={themes}
              />
              {themes.map((theme) => (
                <ThemeCard
                  key={theme.slug}
                  actorRef={actorRef}
                  active={theme.slug === active?.slug}
                  theme={theme}
                  themes={themes}
                />
              ))}
            </Reorder.Group>
          </MotionConfig>
          {/* Trails the list rather than sitting in the footer, so the footer
              does not shift when the first theme gets removed */}
          {removed.length > 0 && (
            <Button
              gap={2}
              icon={RestoreIcon}
              mode="bleed"
              onClick={() => actorRef.send({type: 'flow.removed'})}
              padding={2}
              text={`Show removed (${removed.length})`}
              width="fill"
            />
          )}
        </Stack>
      </ScrollArea>

      {/* Like the Studio's document footer: one primary action, the rest in
          the menu, in the size of the Studio's own buttons (padding and gap of 2) */}
      <Card borderTop padding={3}>
        <Flex align="center" gap={2} justify="flex-end">
          {active?.source === 'custom' ? (
            <Button
              gap={2}
              icon={EditIcon}
              onClick={() => actorRef.send({type: 'theme.edit', slug: active.slug})}
              padding={2}
              text="Edit"
              tone="primary"
            />
          ) : (
            <Button
              gap={2}
              icon={CopyIcon}
              onClick={() =>
                actorRef.send({type: 'theme.duplicate', slug: active?.slug ?? CONFIG_SLUG})
              }
              padding={2}
              text="Duplicate & Edit"
              tone="primary"
            />
          )}
          <MenuButton
            button={
              <Button
                aria-label="More actions"
                icon={EllipsisHorizontalIcon}
                // The image's colors are read on device, which the menu button shows while it lasts
                loading={busy}
                mode="bleed"
                padding={2}
              />
            }
            id="themer-list-actions"
            menu={
              // Short labels: the menu is confined to the sidebar, which can be narrow
              <Menu>
                <MenuItem
                  icon={AddIcon}
                  onClick={() => actorRef.send({type: 'theme.add'})}
                  text="Add theme"
                />
                <MenuItem
                  icon={ImageIcon}
                  onClick={() => imageInputRef.current?.click()}
                  text="Add from image"
                />
                <MenuItem
                  icon={ClipboardIcon}
                  onClick={async () => {
                    // Straight from the clipboard where the browser allows; by hand otherwise
                    if ((await addThemeFromClipboard()) !== 'added') setPasting(true)
                  }}
                  text="Add from code"
                />
                {active && (
                  <>
                    <MenuDivider />
                    <MenuItem
                      icon={CodeBlockIcon}
                      onClick={() => setSnippetOpen(true)}
                      text="Show theme code"
                    />
                  </>
                )}
              </Menu>
            }
            popover={{placement: 'top-end', portal: true}}
          />
        </Flex>
      </Card>

      <ImageFileInput onFile={pickImage} ref={imageInputRef} />

      {pasting && <PasteThemeDialog actorRef={actorRef} onClose={() => setPasting(false)} />}
      {active && snippetOpen && (
        <ThemeSnippetDialog onClose={() => setSnippetOpen(false)} theme={active} />
      )}
    </>
  )
}
