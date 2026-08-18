'use client';

import { useState } from "react";
import styles from "./SearchBar.module.scss";

type Props = {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  hint?: string;
};

export default function SearchBar({
  initialValue = "",
  placeholder = "Search by artist, album, or catalog number...",
  onSearch,
}: Props) {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <button className={styles.submit} type="submit">
        Search
      </button>
    </form>
  );
}



