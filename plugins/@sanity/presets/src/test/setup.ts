/// <reference types="@testing-library/jest-dom/vitest" />

import * as matchers from '@testing-library/jest-dom/matchers'
import {expect} from 'vitest'

// Not `@testing-library/jest-dom/vitest`: that entry extends whichever vitest
// pnpm links next to jest-dom, which can be a different copy than the one
// running the tests.
expect.extend(matchers)
