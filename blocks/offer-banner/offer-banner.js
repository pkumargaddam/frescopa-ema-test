export default function decorate(block) {
  // Offer banner: row with [background-image-col, content-col]
  const row = block.children[0];
  if (!row) return;

  const cols = [...row.children];
  let pictureCol = null;
  let contentCol = null;

  // Find the column with a picture (background image) and the content column
  cols.forEach((col) => {
    if (col.querySelector('picture') && !contentCol) {
      pictureCol = col;
    } else {
      contentCol = col;
    }
  });

  // Set background image from picture
  if (pictureCol) {
    const img = pictureCol.querySelector('img');
    if (img) {
      block.style.backgroundImage = `url('${img.src}')`;
      block.classList.add('has-bg-image');
    }
  }

  // Flatten: move content elements directly into a wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'offer-banner-content';

  if (contentCol) {
    while (contentCol.firstChild) wrapper.appendChild(contentCol.firstChild);
  }

  // Clear block and append
  block.textContent = '';
  block.appendChild(wrapper);
}
