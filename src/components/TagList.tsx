interface TagListProps {
  tags: string[];
  tone?: 'light' | 'dark' | 'accent';
}

export function TagList({ tags, tone = 'light' }: TagListProps) {
  if (!tags.length) return null;

  return (
    <div className={`tag-list tag-list--${tone}`}>
      {tags.map((tag) => (
        <span className="tag" key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}
