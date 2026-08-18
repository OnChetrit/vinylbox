'use client';

import styles from "./PageHeader.module.scss";

type Props = {
  title: string;
  description?: string;
  chips?: string[];
  rightSlot?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  chips,
  rightSlot,
}: Props) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
        {chips?.length ? (
          <div className={styles.actions}>
            {chips.map((chip) => (
              <span key={chip} className={styles.chip}>
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {rightSlot}
    </div>
  );
}



