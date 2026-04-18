import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const links = [
  { href: "https://www.instagram.com/adi._._.69/", label: "Instagram", Icon: InstagramIcon },
  { href: "https://github.com/Adi-Dcpp", label: "GitHub", Icon: GitHubIcon },
  { href: "https://www.linkedin.com/in/aditya-mandal-2438a5368/", label: "LinkedIn", Icon: LinkedInIcon },
];

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.7" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function GitHubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3.5a8.5 8.5 0 0 0-2.69 16.56c.43.08.59-.18.59-.42v-1.48c-2.4.52-2.9-1.02-2.9-1.02-.39-1-.95-1.27-.95-1.27-.78-.54.06-.53.06-.53.87.06 1.33.9 1.33.9.77 1.32 2.02.94 2.51.72.08-.56.3-.94.55-1.16-1.92-.22-3.94-.96-3.94-4.27 0-.94.33-1.7.86-2.3-.09-.22-.37-1.08.08-2.25 0 0 .7-.22 2.28.88a7.9 7.9 0 0 1 4.15 0c1.58-1.1 2.28-.88 2.28-.88.45 1.17.17 2.03.08 2.25.53.6.86 1.36.86 2.3 0 3.32-2.03 4.05-3.96 4.27.31.27.58.78.58 1.58v2.34c0 .24.16.5.6.41A8.5 8.5 0 0 0 12 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.2 10v5.8M8.2 8.1v.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.1 15.8V12.5c0-1.1.7-2 1.8-2s1.8.8 1.8 2v3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FooterLinks() {
  const { theme } = useTheme();

  return (
    <footer className="mt-10 pb-8 text-center text-xs">
      <p className="mb-4" style={{ color: theme.palette.muted }}>
        Powered by Spotify API
      </p>
      <div className="flex items-center justify-center gap-4">
        {links.map(({ href, label, Icon }) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -2, scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full border p-2"
            style={{
              color: theme.palette.muted,
              borderColor: theme.palette.border,
              boxShadow: `0 8px 20px -10px ${theme.palette.accentSoft}`,
            }}
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </motion.a>
        ))}
      </div>
    </footer>
  );
}
