import { useEffect, useRef, useState } from 'react';
import { buildBookmarklet } from './bookmarklet';
import styles from './Admin.module.css';

const ADMIN_URL = new URL(`${import.meta.env.BASE_URL}#/admin`, window.location.origin).toString();

/** Explains and offers the "add to OnAir" bookmark. */
export function BookmarkletPanel() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const bookmarklet = buildBookmarklet(ADMIN_URL);

  // React refuses javascript: addresses in href, as a guard against injected links. This
  // one is our own fixed code, so it is set on the element directly.
  useEffect(() => {
    linkRef.current?.setAttribute('href', bookmarklet);
  }, [bookmarklet]);

  const copy = () => {
    navigator.clipboard
      .writeText(bookmarklet)
      .then(() => setIsCopied(true))
      .catch(() => undefined);
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.subheading}>כפתור סימנייה: הוספת ערוץ מכל אתר</h2>
      <p className={styles.muted}>
        לאתרים שחוסמים את החילוץ האוטומטי. הכפתור רץ בדפדפן שלכם, בדף של הערוץ, וקורא איזה קישור
        וידאו הדף כבר טען, בדיוק כמו לשונית Network בכלי המפתחים. הקישורים נפתחים כאן, בדף הניהול,
        ושום דבר לא עובר דרך שרת.
      </p>
      <details className={styles.howTo}>
        <summary>התקנה (פעם אחת)</summary>
        <ol>
          <li>
            במחשב: לגרור את הכפתור{' '}
            <a
              ref={linkRef}
              className={styles.bookmarklet}
              onClick={(event) => event.preventDefault()}
            >
              ＋ OnAir
            </a>{' '}
            לסרגל הסימניות (Ctrl+Shift+B מציג אותו).
          </li>
          <li>
            בטלפון, או אם הגרירה לא עובדת: להעתיק את הקוד{' '}
            <button type="button" className={styles.secondary} onClick={copy}>
              {isCopied ? 'הועתק' : 'העתקת הקוד'}
            </button>
            , ליצור סימנייה חדשה לכל דף, לערוך אותה, לקרוא לה ‎+OnAir ולהדביק את הקוד בשדה הכתובת.
          </li>
        </ol>
      </details>
      <details className={styles.howTo}>
        <summary>שימוש</summary>
        <ol>
          <li>לפתוח את דף השידור של הערוץ ולהפעיל את השידור.</li>
          <li>
            ללחוץ על הסימנייה ‎+OnAir. בטלפון: להקליד ‎+OnAir בשורת הכתובת ולבחור את הסימנייה.
          </li>
          <li>דף הניהול נפתח עם הקישורים שנמצאו, כל אחד נבדק, ואפשר ליצור ממנו ערוץ.</li>
        </ol>
        <p className={styles.muted}>
          אם הנגן מוטמע מאתר אחר (iframe), הכפתור לא רואה לתוכו: פתחו את כתובת הנגן עצמו ולחצו שם.
        </p>
      </details>
    </section>
  );
}
