import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ContactSectionProps = {
  email: string
}

function ContactSection({ email }: ContactSectionProps) {
  return (
    <div className="contact-wrap">
      <div className="contact-copy">
        <p className="contact-lead">Get in touch</p>
        <p className="contact-hint">Opens your email app.</p>
      </div>
      <a
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          'h-10 min-w-[9rem] rounded-full border-primary/35 text-primary hover:border-primary/55 hover:bg-primary/8'
        )}
        href={`mailto:${email}`}
      >
        Email me
      </a>
    </div>
  )
}

export default ContactSection
