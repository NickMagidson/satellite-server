// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import GlobeWorkspaceShell from './GlobeWorkspaceShell'

afterEach(cleanup)

describe('GlobeWorkspaceShell', () => {
  it('keeps the existing globe-only view when chat is disabled', () => {
    render(
      <GlobeWorkspaceShell enabled={false} sidebar={<p>Chat</p>}>
        <div data-testid="globe">Globe</div>
      </GlobeWorkspaceShell>,
    )

    expect(screen.getByTestId('globe')).toBeTruthy()
    expect(screen.queryByRole('complementary', { name: 'Ask Lynx' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Hide chat' })).toBeNull()
  })

  it('preserves the mounted globe while chat is collapsed and reopened', () => {
    render(
      <GlobeWorkspaceShell enabled sidebar={<p>Chat</p>}>
        <div data-testid="globe">Globe</div>
      </GlobeWorkspaceShell>,
    )

    const globe = screen.getByTestId('globe')
    expect(screen.getByRole('complementary', { name: 'Ask Lynx' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Hide chat' }))
    expect(screen.getByTestId('globe')).toBe(globe)
    expect(
      screen
        .getByRole('button', { name: 'Show chat' })
        .getAttribute('aria-expanded'),
    ).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: 'Show chat' }))
    expect(screen.getByTestId('globe')).toBe(globe)
    expect(
      screen
        .getByRole('button', { name: 'Hide chat' })
        .getAttribute('aria-expanded'),
    ).toBe('true')
  })
})
