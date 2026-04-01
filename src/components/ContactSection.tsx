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
      <a className="button button-secondary" href={`mailto:${email}`}>
        Email me
      </a>
    </div>
  )
}

export default ContactSection
