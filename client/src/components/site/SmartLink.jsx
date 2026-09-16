import { Link } from 'react-router';

export const isExternal = (url) => /^(https?:)?\/\//i.test(url || '') || /^(mailto|tel):/i.test(url || '');

/**
 * Renders internal links with the router, external links with safe attributes and "#anchor" links as same-page anchors.
 * Use "/#classes" (with the slash) in the CMS to link to a homepage section from other pages.
 */
export function SmartLink({ to, newTab, children, ...props }) {
  const url = to || '#';
  if (isExternal(url) || newTab) {
    return (
      <a href={url} target={newTab || isExternal(url) ? '_blank' : undefined} rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  if (url.startsWith('#')) {
    return (
      <a href={url} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={url} {...props}>
      {children}
    </Link>
  );
}
