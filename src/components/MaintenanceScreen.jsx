import "../css/maintenance.css";

export default function MaintenanceScreen() {
  return (
    <main className="maintenance">
      <section className="maintenance__card">
        <span className="maintenance__badge">Scheduled update</span>
        <h1>We&apos;ll be back shortly</h1>
        <p>
          We are updating our website to improve checkout, payments, and order
          processing. Please check back in a short while.
        </p>
        <p>Thank you for your patience.</p>

        <div className="maintenance__info">
          <p>
            <strong>Need immediate help?</strong>
            <br />
            Call us:
          </p>
          <a className="maintenance__phone" href="tel:+919841854321">
            +91 98418 54321
          </a>
        </div>

        <p className="maintenance__small">
          Site owners: open the site once with your maintenance access link to
          continue testing while visitors see this page.
        </p>
      </section>
    </main>
  );
}
