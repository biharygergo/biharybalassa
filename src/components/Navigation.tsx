import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
const Chevron = () => (
  <svg
    className="language-chevron"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const Check = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m5 12 4 4 10-10" />
  </svg>
);
type Link = { label: string; href: string };
type Props = {
  links: Link[];
  languages: Link[];
  lang: string;
  menuLabel: string;
  closeLabel: string;
  currentPath: string;
};
export default function Navigation({
  links,
  languages,
  lang,
  menuLabel,
  closeLabel,
  currentPath,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="navigation-island">
      <NavigationMenu.Root
        className="desktop-navigation"
        aria-label={menuLabel}
      >
        <NavigationMenu.List>
          {links.map((link) => (
            <NavigationMenu.Item key={link.href}>
              <NavigationMenu.Link
                href={link.href}
                active={currentPath === link.href}
              >
                {link.label}
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          ))}
        </NavigationMenu.List>
      </NavigationMenu.Root>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          className="language-trigger"
          aria-label="Language / Nyelv / Sprache"
        >
          <span>{lang.toUpperCase()}</span>
          <Chevron />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="language-content"
            align="end"
            sideOffset={10}
            collisionPadding={16}
          >
            {languages.map((link) => (
              <DropdownMenu.Item asChild key={link.label}>
                <a
                  href={link.href}
                  hrefLang={link.label}
                  lang={link.label}
                  aria-current={lang === link.label ? 'page' : undefined}
                >
                  <span className="language-name">
                    {
                      (
                        {
                          hu: 'Magyar',
                          en: 'English',
                          de: 'Deutsch',
                        } as Record<string, string>
                      )[link.label]
                    }
                  </span>
                  <span className="language-check">
                    {lang === link.label && <Check />}
                  </span>
                </a>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className="drawer-trigger" aria-label={menuLabel}>
          <span aria-hidden="true">☰</span>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay" />
          <Dialog.Content className="drawer-content">
            <div className="drawer-top">
              <Dialog.Title>{menuLabel}</Dialog.Title>
              <Dialog.Close className="drawer-close" aria-label={closeLabel}>
                ×
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Bihary Balassa
            </Dialog.Description>
            <nav className="drawer-links" aria-label={menuLabel}>
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={currentPath === link.href ? 'page' : undefined}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
