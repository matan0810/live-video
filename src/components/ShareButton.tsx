import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/context';
import { IconButton } from './IconButton';
import { CheckIcon, ShareIcon } from './icons';

const COPIED_FEEDBACK_MS = 2000;

interface ShareButtonProps {
  title: string;
  url: string;
}

/** Opens the system share sheet where there is one, and copies the link otherwise. */
export function ShareButton({ title, url }: ShareButtonProps) {
  const { t } = useI18n();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timeout = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [isCopied]);

  const share = async () => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
      }
    } catch {
      // The user dismissed the share sheet, or clipboard access was denied.
    }
  };

  return (
    <IconButton label={isCopied ? t.linkCopied : t.share} onClick={() => void share()}>
      {isCopied ? <CheckIcon /> : <ShareIcon />}
    </IconButton>
  );
}
