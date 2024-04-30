/**
 * A side bar component with Overlay that works without JavaScript.
 * @example
 * ```jsx
 * <Aside id="search-aside" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 * @param {{
 *   children?: React.ReactNode;
 *   heading: React.ReactNode;
 *   id?: string;
 * }}
 */
export function Aside({children, heading, id = 'aside'}) {
  return (
    <div aria-modal className="overlay" id={id} role="dialog">
      <button
        className="close-outside"
        onClick={() => {
          history.go(-1);
          window.location.hash = '';
        }}
      />
      <aside>
        {heading === 'MENU' ? null : (
          <header>
            <p>{heading}</p>
            <CloseAside />
          </header>
        )}
        <main>{children}</main>
      </aside>
    </div>
  );
}

function CloseAside() {
  function toggleScroll() {
    document.body.classList.remove('no-scroll');
  }
  return (
    /* eslint-disable-next-line jsx-a11y/anchor-is-valid */

    <a
      className="close"
      onClick={toggleScroll}
      href="#"
      onChange={() => history.go(-1)}
    >
      &times;
    </a>
  );
}
