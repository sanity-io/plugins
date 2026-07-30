import {Card, Grid} from '@sanity/ui'
import {AnimatePresence, motion} from 'motion/react'
import type {ComponentProps, PropsWithChildren} from 'react'

import {floatingCard} from './FloatingCard.css'

function StyledFloatingCard(props: ComponentProps<typeof Card>) {
  return <Card {...props} className={floatingCard} />
}

export default function FloatingCard({children}: PropsWithChildren) {
  const childrenHaveValues = Array.isArray(children) ? children.some(Boolean) : Boolean(children)

  return (
    <AnimatePresence>
      {childrenHaveValues ? (
        <motion.div key="floater" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
          <StyledFloatingCard shadow={3} padding={3} margin={3} radius={3}>
            <Grid gap={2}>{children}</Grid>
          </StyledFloatingCard>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
