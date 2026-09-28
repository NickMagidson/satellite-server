import { ButtonLink } from '../ui/Button'

type LandingHeroProps = {
  eyebrow?: string
  title: string
  description: string
  primaryCta: { label: string; to: string }
  secondaryCta: { label: string; to: string; hash?: string }
}

function LandingHero({
  eyebrow = 'Orbital catalog',
  title,
  description,
  primaryCta,
  secondaryCta,
}: LandingHeroProps) {
  return (
    <section className="px-[clamp(20px,3.2vw,44px)] py-[clamp(48px,12vw,120px)]">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="mt-4 text-balance text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-object">
          {title}
        </h1>
        <p className="mt-5 max-w-[42ch] text-pretty text-base leading-relaxed text-ink-muted sm:text-[17px]">
          {description}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink to={primaryCta.to} variant="primary">
            {primaryCta.label}
          </ButtonLink>
          <ButtonLink
            to={secondaryCta.to}
            hash={secondaryCta.hash}
            variant="secondary"
          >
            {secondaryCta.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

export { LandingHero, type LandingHeroProps }
