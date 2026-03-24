export default function decorate(block) {
  // Hero block expects: row with [content, image] columns
  // Content column has: pretitle paragraph, heading (h1/h2/h3), CTA link
  const rows = [...block.children];
  if (rows.length === 0) return;

  // If single row with two columns, ensure proper structure
  const cols = [...rows[0].children];
  if (cols.length >= 2) {
    const contentCol = cols[0];
    const imageCol = cols[1];

    // Make image column a proper image container
    if (imageCol.querySelector('picture')) {
      imageCol.classList.add('hero-image');
    }

    contentCol.classList.add('hero-content');
  }
}
