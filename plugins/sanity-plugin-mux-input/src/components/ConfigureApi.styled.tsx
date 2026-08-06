import MuxLogo from './MuxLogo'

import {logo} from './ConfigureApi.css'

export const Header = () => (
  <>
    <span className={logo}>
      <MuxLogo height={13} />
    </span>
    API Credentials
  </>
)
