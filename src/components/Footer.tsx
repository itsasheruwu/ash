type FooterProps = {
  displayName: string
}

function Footer({ displayName }: FooterProps) {
  return (
    <footer className="site-footer">
      <p className="site-footer__line">
        &copy; {new Date().getFullYear()} {displayName}
      </p>
    </footer>
  )
}

export default Footer
