import MuxLogo from './MuxLogo'

import * as styles from './ConfigureApi.module.css'

export const Header = () => (
  <>
    <span className={styles.logo}>
      <MuxLogo height={13} />
    </span>
    API Credentials
  </>
)
