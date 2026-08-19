'use client'

import styles from './AuthBackground.module.css'

const COLORS = ['59,130,246', '96,165,250', '139,92,246', '59,130,246', '129,140,248', '96,165,250', '59,130,246']

export default function AuthBackground() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.inner}>
        {COLORS.map((color, i) => (
          <div
            key={i}
            className={styles.card}
            style={{ '--index': i, '--color-card': color } as React.CSSProperties}
          >
            <div className={styles.img} />
          </div>
        ))}
      </div>
      <div className={styles.vignette} />
    </div>
  )
}