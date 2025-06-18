import {useEffect} from 'react';
import {
  PredictiveSearchForm,
  PredictiveSearchResults,
} from '~/components/Search';
import x2 from '../assets/X2.png';

import {useLocation} from '@remix-run/react';
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
  const {hash} = useLocation();
  useEffect(() => {
    if (hash.includes(id)) document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [hash, id]);
  return (
    <div aria-modal className="overlay" id={id} role="dialog">
      <button
        onClick={() => {
          history.go(-1);
          window.location.hash = '';
        }}
        className="close-aside"
      />
      {heading != 'menu' ? null : (
        <button
          className="close-outside"
          onClick={() => {
            history.go(-1);
            window.location.hash = '';
          }}
        />
      )}
      <aside>
        {heading === 'MENU' ? null : heading === 'SEARCH' ? (
          <header>
            <PredictiveSearchForm>
              {({fetchResults, inputRef}) => (
                <div>
                  <input
                    name="q"
                    onChange={fetchResults}
                    onFocus={fetchResults}
                    placeholder="Search"
                    ref={inputRef}
                    type="search"
                  />

                  {/* <button
                    onClick={() => {
                      window.location.href = inputRef?.current?.value
                        ? `/search?q=${inputRef.current.value}`
                        : `/search`;
                    }}
                  >
                    Search
                  </button> */}
                </div>
              )}
            </PredictiveSearchForm>
            <CloseAside />
          </header>
        ) : (
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
  return (
    /* eslint-disable-next-line jsx-a11y/anchor-is-valid */
    <a className="close" href="#" onChange={() => history.go(-1)}>
      <img src={x2} />
    </a>
  );
}
