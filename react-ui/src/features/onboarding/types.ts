export type OnboardingStep1ViewState = 'normal'

export type OnboardingStep2ViewState =
  | 'normal'
  | 'filled'
  | 'location-selected'
  | 'quantity-adjusted'
  | 'colony-names-expanded'
  | 'submitting'
  | 'error'
  | 'offline'

export type OnboardingStep3ViewState =
  | 'normal'
  | 'no-apiary'
  | 'no-colony'
  | 'long-content'
  | 'loading'
  | 'error'
  | 'offline-cached'
  | 'offline-no-cache'
