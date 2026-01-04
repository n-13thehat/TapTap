export function Emoji({ children }:{ children:string }) {
  // no-op for native; can later swap to twemoji parse if desired
  return <span className='align-[ -0.1em ]'>{children}</span>;
}
